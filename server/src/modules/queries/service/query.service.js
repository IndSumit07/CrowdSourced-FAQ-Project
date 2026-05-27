import {
  QueryRepository,
  ContributorResponseRepository,
} from "../repository/query.repository.js";
import { FAQService } from "../../faq/service/faq.service.js";
import { EmbeddingService } from "../../ai/service/embedding.service.js";
import { AIValidationService } from "../../ai/service/aiValidation.service.js";
import { deadlineQueue } from "../../queues/deadline.queue.js";
import {
  buildPagination,
  buildSortStage,
  buildPaginationMeta,
} from "../../../utils/pagination.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../../../utils/errors.js";
import { env } from "../../../configs/env.config.js";
import { getIO } from "../../../configs/socket.config.js";
import { SOCKET_EVENTS } from "../../realtime/constants/events.js";
import { logger } from "../../../utils/logger.js";

const queryRepo = new QueryRepository();
const responseRepo = new ContributorResponseRepository();

export class QueryService {
  #faqService;
  #embeddingService;
  #aiValidationService;

  constructor() {
    this.#faqService = new FAQService();
    this.#embeddingService = new EmbeddingService();
    this.#aiValidationService = new AIValidationService();
  }

  /**
   * Full query submission workflow.
   */
  async submit(question, creatorId) {
    // Step 1: Try to resolve from existing FAQs
    const resolution = await this.#faqService.resolveQuery(question);
    if (resolution.faq) {
      return { resolved: true, resolution };
    }

    // Step 2: AI relevance validation
    const validation =
      await this.#aiValidationService.validateRelevance(question);
    if (!validation.relevant) {
      throw new BadRequestError(
        `This question is outside our supported domains. ${validation.reason}`,
      );
    }

    // Step 3: Generate embedding for the query
    const embedding =
      resolution.embedding || (await this.#embeddingService.embed(question));

    // Step 4: Calculate deadline
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + env.QUERY_DEADLINE_HOURS);

    // Step 5: Persist the query
    const query = await queryRepo.create({
      question,
      category: validation.category,
      status: "open",
      deadline,
      embedding,
      creator: creatorId,
      aiValidated: true,
      aiRelevanceScore: validation.confidence,
    });

    // Step 6: Schedule deadline processing job
    const job = await deadlineQueue.add(
      "process-deadline",
      { queryId: query._id.toString() },
      {
        delay: env.QUERY_DEADLINE_HOURS * 60 * 60 * 1000,
        jobId: `deadline_${query._id}`,
      },
    );

    await queryRepo.updateById(query._id, { deadlineJobId: job.id });

    // Step 7: Publish to realtime contributor feed
    try {
      const io = getIO();
      io.to("feed:contributors").emit(SOCKET_EVENTS.NEW_QUERY, {
        queryId: query._id,
        question: query.question,
        category: query.category,
        deadline: query.deadline,
        createdAt: query.createdAt,
      });
    } catch (socketErr) {
      logger.warn({
        msg: "Could not emit new query event",
        err: socketErr.message,
      });
    }

    logger.info({ msg: "Query submitted", queryId: query._id, creatorId });
    return { resolved: false, query };
  }

  async getById(id) {
    const query = await queryRepo.findById(id);
    if (!query) throw new NotFoundError("Query");
    return query;
  }

  async deleteMyQuery(queryId, creatorId) {
    const query = await queryRepo.findById(queryId);
    if (!query) throw new NotFoundError("Query");

    const ownerId = (query.creator?._id || query.creator)?.toString();
    if (ownerId !== creatorId) {
      throw new ForbiddenError(
        "You do not have permission to delete this query",
      );
    }

    if (["processing", "completed"].includes(query.status)) {
      throw new BadRequestError(
        "This query cannot be deleted at its current stage",
      );
    }

    if (query.deadlineJobId) {
      try {
        await deadlineQueue.remove(query.deadlineJobId);
      } catch (err) {
        logger.warn({
          msg: "Failed to remove deadline job",
          err: err.message,
          jobId: query.deadlineJobId,
        });
      }
    }

    await responseRepo.deleteByQuery(queryId);
    await queryRepo.deleteById(queryId);

    logger.info({ msg: "Query deleted", queryId, creatorId });
    return { deleted: true };
  }

  async getOpenFeed(params) {
    const { page, limit, skip } = buildPagination(params.page, params.limit);
    const { queries, total } = await queryRepo.findOpenQueries({
      page,
      limit,
      skip,
      category: params.category,
    });
    return { queries, pagination: buildPaginationMeta(total, page, limit) };
  }

  async getMyQueries(creatorId, params) {
    const { page, limit, skip } = buildPagination(params.page, params.limit);
    const { queries, total } = await queryRepo.findByCreator(creatorId, {
      skip,
      limit,
    });
    return { queries, pagination: buildPaginationMeta(total, page, limit) };
  }

  async getResponses(queryId) {
    const query = await queryRepo.findById(queryId);
    if (!query) throw new NotFoundError("Query");
    return responseRepo.findByQuery(queryId);
  }

  async getAll(params) {
    const { page, limit, skip } = buildPagination(params.page, params.limit);
    const sort = buildSortStage(params.sortBy, [
      "createdAt",
      "deadline",
      "responseCount",
    ]);
    const filter = {};
    if (params.status) filter.status = params.status;
    if (params.category) filter.category = params.category;
    const { queries, total } = await queryRepo.findAll({
      page,
      limit,
      skip,
      sort,
      filter,
    });
    return { queries, pagination: buildPaginationMeta(total, page, limit) };
  }

  async getStats() {
    return queryRepo.getStats();
  }
}
