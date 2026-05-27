import { FAQRepository } from "../../faq/repository/faq.repository.js";
import { FAQService } from "../../faq/service/faq.service.js";
import { UserRepository } from "../../users/repository/user.repository.js";
import { QueryRepository, ContributorResponseRepository } from "../../queries/repository/query.repository.js";
import { EmbeddingService } from "../../ai/service/embedding.service.js";
import { NotFoundError, BadRequestError } from "../../../utils/errors.js";
import { cacheDelPattern } from "../../../utils/cache.js";
import { logger } from "../../../utils/logger.js";

const faqRepo = new FAQRepository();
const userRepo = new UserRepository();
const queryRepo = new QueryRepository();
const responseRepo = new ContributorResponseRepository();
const embeddingService = new EmbeddingService();
const faqService = new FAQService();

export class AdminService {
  async getPendingReviewQueries(params) {
    const page = parseInt(params.page || 1);
    const limit = parseInt(params.limit || 20);
    const skip = (page - 1) * limit;

    const filter = { status: "admin-review" };
    const { queries, total } = await queryRepo.findAll({ page, limit, skip, sort: { deadline: 1 }, filter });
    
    // Fetch answers for each query
    const queriesWithAnswers = await Promise.all(
      queries.map(async (query) => {
        const answers = await responseRepo.findByQuery(query._id);
        return { ...query, answers };
      })
    );

    return { queries: queriesWithAnswers, total };
  }

  async publishQueryToFAQ(queryId, adminId, { answer, category, tags }) {
    const query = await queryRepo.findById(queryId);
    if (!query) throw new NotFoundError("Query");
    if (query.status !== "admin-review") throw new BadRequestError("Query is not pending review");

    // Generate embedding
    const embedding = await embeddingService.embed(query.question);

    // Create FAQ
    const faq = await faqRepo.create({
      title: query.question,
      answer,
      category: category || query.category,
      tags: tags || [],
      embedding,
      published: true,
      aiGenerated: false,
      sourceQuery: query._id,
      createdBy: query.creator._id || query.creator,
      publishedBy: adminId,
      publishedAt: new Date(),
    });

    // Update Query
    await queryRepo.updateById(queryId, {
      status: "completed",
      faqGenerated: faq._id,
    });

    await cacheDelPattern(`faqs:*`);
    return faq;
  }

  async getPendingFAQs(params) {
    const page = parseInt(params.page || 1);
    const limit = parseInt(params.limit || 20);
    const skip = (page - 1) * limit;
    return faqRepo.findPendingApproval({ page, limit, skip });
  }

  async approveFAQ(faqId, adminId) {
    const faq = await faqRepo.findById(faqId);
    if (!faq) throw new NotFoundError("FAQ");
    if (faq.published) throw new BadRequestError("FAQ is already published");

    return faqService.publishFAQ(faqId, adminId);
  }

  async editAndApproveFAQ(faqId, adminId, updates) {
    const faq = await faqRepo.findById(faqId);
    if (!faq) throw new NotFoundError("FAQ");

    // Re-generate embedding if title changed
    const needsNewEmbedding = updates.title && updates.title !== faq.title;
    const newEmbedding = needsNewEmbedding
      ? await embeddingService.embed(updates.title)
      : undefined;

    await faqRepo.updateById(faqId, {
      ...updates,
      ...(newEmbedding && { embedding: newEmbedding }),
      editedByAdmin: true,
    });

    await cacheDelPattern(`faq:${faqId}*`);
    return faqService.publishFAQ(faqId, adminId);
  }

  async rejectFAQ(faqId, reason) {
    const faq = await faqRepo.findById(faqId);
    if (!faq) throw new NotFoundError("FAQ");

    logger.info({ msg: "FAQ rejected", faqId, reason });
    return faqRepo.reject(faqId);
  }

  async getAllUsers(params) {
    const page = parseInt(params.page || 1);
    const limit = parseInt(params.limit || 20);
    const skip = (page - 1) * limit;
    const sort = { createdAt: -1 };
    return userRepo.findAll({ page, limit, skip, sort, role: params.role, search: params.search });
  }

  async updateUserRole(userId, role) {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError("User");
    return userRepo.updateRole(userId, role);
  }

  async deactivateUser(userId) {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError("User");
    return userRepo.deactivate(userId);
  }

  async getTopContributors() {
    return userRepo.findTopContributors(20);
  }

  async getDashboardStats() {
    const [faqStats, queryStats] = await Promise.all([
      faqRepo.getStats(),
      queryRepo.getStats(),
    ]);
    return { faqs: faqStats, queries: queryStats };
  }
}
