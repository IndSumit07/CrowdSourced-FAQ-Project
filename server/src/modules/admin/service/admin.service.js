import mongoose from "mongoose";
import { FAQRepository } from "../../faq/repository/faq.repository.js";
import { FAQService } from "../../faq/service/faq.service.js";
import { Section } from "../../faq/schema/section.schema.js";
import { UserRepository } from "../../users/repository/user.repository.js";
import {
  QueryRepository,
  ContributorResponseRepository,
} from "../../queries/repository/query.repository.js";
import { Query } from "../../queries/schema/query.schema.js";
import { Notification } from "../../notifications/schema/notification.schema.js";
import { EmbeddingService } from "../../ai/service/embedding.service.js";
import { NotFoundError, BadRequestError } from "../../../utils/errors.js";
import { cacheDelPattern } from "../../../utils/cache.js";
import { logger } from "../../../utils/logger.js";
import { getIO } from "../../../configs/socket.config.js";
import { SOCKET_EVENTS } from "../../realtime/constants/events.js";
import { QueryExpiryService } from "../../queries/service/query.expiry.service.js";

const faqRepo = new FAQRepository();
const userRepo = new UserRepository();
const queryRepo = new QueryRepository();
const responseRepo = new ContributorResponseRepository();
const embeddingService = new EmbeddingService();
const faqService = new FAQService();
const queryExpiryService = new QueryExpiryService();

export class AdminService {
  async #resolveSection(sectionId, existingSectionId = null) {
    const resolvedSectionId = sectionId || existingSectionId;
    if (!resolvedSectionId) {
      throw new BadRequestError("Section is required");
    }

    const section = await Section.findById(resolvedSectionId).lean();
    if (!section) {
      throw new NotFoundError("Section");
    }

    return section;
  }

  async getPendingReviewQueries(params) {
    await queryExpiryService.sweepExpiredQueries();
    const page = parseInt(params.page || 1);
    const limit = parseInt(params.limit || 20);
    const skip = (page - 1) * limit;

    const filter = { status: "admin-review" };
    const { queries, total } = await queryRepo.findAll({
      page,
      limit,
      skip,
      sort: { deadline: 1 },
      filter,
    });

    // Fetch answers for each query
    const queriesWithAnswers = await Promise.all(
      queries.map(async (query) => {
        const answers = await responseRepo.findByQuery(query._id);
        return { ...query, answers };
      }),
    );

    return { queries: queriesWithAnswers, total };
  }

  async publishQueryToFAQ(
    queryId,
    adminId,
    { answer, category, responseId, sectionId },
  ) {
    const query = await queryRepo.findById(queryId);
    if (!query) throw new NotFoundError("Query");
    if (!["admin-review", "flagged"].includes(query.status))
      throw new BadRequestError("Query is not in a publishable state");

    const answers = await responseRepo.findByQuery(queryId);

    // Prefer finding by responseId (reliable), fall back to text match for backward compat
    let selectedResponse = null;
    if (responseId) {
      selectedResponse = answers.find(
        (a) => a._id.toString() === responseId.toString(),
      );
    }
    if (!selectedResponse && answer) {
      selectedResponse = answers.find((a) => a.answer === answer);
    }

    let acceptedContributorId = null;
    if (selectedResponse) {
      // Reset all other responses' accepted flag before setting new one
      for (const a of answers) {
        if (a._id.toString() !== selectedResponse._id.toString() && a.accepted) {
          await responseRepo.updateById(a._id, { accepted: false });
        }
      }
      await responseRepo.updateById(selectedResponse._id, { accepted: true });
      acceptedContributorId = (
        selectedResponse.contributor._id || selectedResponse.contributor
      ).toString();
      await userRepo.incrementReputationAndAccepted(acceptedContributorId, 10);
    } else {
      // AI answer selected - reset ALL responses' accepted flag
      for (const a of answers) {
        if (a.accepted) {
          await responseRepo.updateById(a._id, { accepted: false });
        }
      }
    }

    const aiSummaryUsed = responseId === null && !selectedResponse;

    // Generate embedding
    const embedding = await embeddingService.embed(query.question);
    const section = await this.#resolveSection(sectionId);

    // Create FAQ
    const faq = await faqRepo.create({
      title: query.question,
      answer,
      category: category || query.category,
      tags: [section.title],
      embedding,
      published: true,
      aiGenerated: aiSummaryUsed,
      sourceQuery: query._id,
      section: section._id,
      createdBy: query.creator._id || query.creator,
      approvedBy: adminId,
      publishedAt: new Date(),
    });

    // Update Query with completion info
    const resolvedAt = new Date();
    await queryRepo.updateById(queryId, {
      status: "completed",
      faqGenerated: faq._id,
      resolvedAnswer: answer,
      resolvedAt,
      aiSummaryUsed,
    });

    // Notify the query creator via realtime socket
    const creatorId = (query.creator?._id || query.creator)?.toString();
    try {
      const io = getIO();
      io.to(`user:${creatorId}`).emit(SOCKET_EVENTS.USER_NOTIFICATION, {
        type: "query_answered",
        message: "Your query has been answered and published!",
        queryId: queryId.toString(),
        faqId: faq._id.toString(),
        answer,
        resolvedAt: resolvedAt.toISOString(),
      });
      logger.info({
        msg: "Notified creator of query resolution",
        queryId,
        creatorId,
      });

      // Notify the accepted contributor (if different from creator)
      if (acceptedContributorId && acceptedContributorId !== creatorId) {
        io.to(`user:${acceptedContributorId}`).emit(
          SOCKET_EVENTS.CONTRIBUTOR_ANSWER_ACCEPTED,
          {
            type: "answer_accepted",
            message:
              "🎉 Your answer was selected by the admin! You earned +10 reputation.",
            queryId: queryId.toString(),
            faqId: faq._id.toString(),
            reputationGained: 10,
            question: query.question,
          },
        );
        logger.info({
          msg: "Notified contributor of answer acceptance",
          queryId,
          contributorId: acceptedContributorId,
        });
      }
    } catch (socketErr) {
      logger.warn({
        msg: "Could not emit query_answered event",
        err: socketErr.message,
      });
    }

    await cacheDelPattern(`faqs:*`);
    return faq;
  }

  async getPendingFAQs(params) {
    const page = parseInt(params.page || 1);
    const limit = parseInt(params.limit || 20);
    const skip = (page - 1) * limit;
    return faqRepo.findPendingApproval({ page, limit, skip });
  }

  async approveFAQ(faqId, adminId, sectionId) {
    const faq = await faqRepo.findById(faqId);
    if (!faq) throw new NotFoundError("FAQ");
    if (faq.published) throw new BadRequestError("FAQ is already published");

    const section = await this.#resolveSection(sectionId, faq.section);
    await faqRepo.updateById(faqId, {
      section: section._id,
      tags: [section.title],
    });
    await cacheDelPattern(`faq:${faqId}*`);

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
    const section = await this.#resolveSection(updates.sectionId, faq.section);

    await faqRepo.updateById(faqId, {
      ...updates,
      section: section._id,
      tags: [section.title],
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
    return userRepo.findAll({
      page,
      limit,
      skip,
      sort,
      role: params.role,
      search: params.search,
    });
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
    await queryExpiryService.sweepExpiredQueries();
    const [userStats, faqStats, queryStats] = await Promise.all([
      userRepo.findAll({ page: 1, limit: 1, skip: 0, sort: { createdAt: -1 } }),
      faqRepo.getStats(),
      queryRepo.getStats(),
    ]);

    return {
      users: { total: userStats.total },
      faqs: faqStats,
      queries: {
        ...queryStats,
        total: Object.values(queryStats).reduce((sum, count) => sum + count, 0),
        adminReview: queryStats["admin-review"] ?? 0,
        flagged: queryStats["flagged"] ?? 0,
        adminDeleted: queryStats["admin-deleted"] ?? 0,
      },
    };
  }

  async getRejectedQueries(params) {
    const page = parseInt(params.page || 1);
    const limit = parseInt(params.limit || 20);
    const skip = (page - 1) * limit;

    const filter = { status: "flagged" };
    const { queries, total } = await queryRepo.findAll({
      page,
      limit,
      skip,
      sort: { updatedAt: -1 },
      filter,
    });

    return { queries, total };
  }

  async restoreQuery(queryId) {
    const query = await queryRepo.findById(queryId);
    if (!query) throw new NotFoundError("Query");
    if (!["flagged", "admin-deleted"].includes(query.status))
      throw new BadRequestError("Only flagged or admin-deleted queries can be restored");

    const updated = await queryRepo.updateById(queryId, {
      status: "open",
      flagCount: 0,
      flaggedBy: [],
    });

    const creatorId = (query.creator?._id || query.creator)?.toString();

    await Notification.create({
      recipient: creatorId,
      type: "query_restored",
      message: "Your query has been restored to the feed!",
      metadata: { queryId },
    });

    try {
      const io = getIO();
      io.to(`user:${creatorId}`).emit(SOCKET_EVENTS.USER_NOTIFICATION, {
        type: "query_restored",
        message: "Your query has been restored to the feed!",
        queryId,
      });
    } catch (e) {
      logger.warn({ msg: "Could not emit restore notification", err: e.message });
    }

    return updated;
  }

  async deleteQuery(queryId) {
    const query = await queryRepo.findById(queryId);
    if (!query) throw new NotFoundError("Query");

    await Query.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(queryId) },
      { $set: { status: "admin-deleted" } }
    );

    const creatorId = (query.creator?._id || query.creator)?.toString();

    await Notification.create({
      recipient: creatorId,
      type: "query_deleted_by_admin",
      message: "Your query was removed by an admin.",
      metadata: { queryId },
    });

    try {
      const io = getIO();
      io.to(`user:${creatorId}`).emit(SOCKET_EVENTS.USER_NOTIFICATION, {
        type: "query_deleted_by_admin",
        message: "Your query was removed by an admin.",
        queryId,
      });
    } catch (e) {
      logger.warn({ msg: "Could not emit delete notification", err: e.message });
    }

    return { deleted: true };
  }

  async createDirectFAQ(data, adminId) {
    return faqService.createDirectFAQ(data, adminId);
  }
}
