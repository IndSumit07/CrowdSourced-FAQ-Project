import { FAQRepository } from "../repository/faq.repository.js";
import { EmbeddingService } from "../../ai/service/embedding.service.js";
import { withCache, cacheDelPattern } from "../../../utils/cache.js";
import { buildPagination, buildSortStage, buildPaginationMeta } from "../../../utils/pagination.js";
import { NotFoundError, BadRequestError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";
import { getIO } from "../../../configs/socket.config.js";
import { SOCKET_EVENTS } from "../../realtime/constants/events.js";

const FAQ_CACHE_TTL = 600; // 10 minutes

export class FAQService {
  #faqRepo;
  #embeddingService;

  constructor() {
    this.#faqRepo = new FAQRepository();
    this.#embeddingService = new EmbeddingService();
  }

  /**
   * Full query resolution workflow:
   * 1. Exact title match
   * 2. Full-text search
   * 3. Vector (semantic) search
   */
  async resolveQuery(question) {
    // Step 1: Exact match
    const exact = await this.#faqRepo.findExactMatch(question);
    if (exact) {
      await this.#faqRepo.incrementViews(exact._id);
      return { faq: exact, matchType: "exact" };
    }

    // Step 2: Full-text search
    const { results: textMatches } = await this.#faqRepo.textSearch(question, { limit: 3 });
    if (textMatches.length > 0) {
      await this.#faqRepo.incrementViews(textMatches[0]._id);
      return { faq: textMatches[0], matchType: "text", alternatives: textMatches.slice(1) };
    }

    // Step 3: Vector search
    const embedding = await this.#embeddingService.embed(question);
    const vectorMatches = await this.#faqRepo.vectorSearch(embedding);
    if (vectorMatches.length > 0) {
      await this.#faqRepo.incrementViews(vectorMatches[0]._id);
      return { faq: vectorMatches[0], matchType: "semantic", alternatives: vectorMatches.slice(1), embedding };
    }

    return { faq: null, matchType: "none", embedding };
  }

  async getAll(query) {
    const { page, limit, skip } = buildPagination(query.page, query.limit);
    const sort = buildSortStage(query.sortBy, ["createdAt", "views", "upvotes", "title"]);
    const filter = { published: true };
    if (query.category) filter.category = query.category;

    const cacheKey = `faqs:list:${JSON.stringify({ page, limit, sort, filter })}`;
    return withCache(cacheKey, async () => {
      const { faqs, total } = await this.#faqRepo.findAll({ page, limit, skip, sort, filter });
      return { faqs, pagination: buildPaginationMeta(total, page, limit) };
    }, FAQ_CACHE_TTL);
  }

  async getById(id) {
    const cacheKey = `faq:${id}`;
    const faq = await withCache(cacheKey, () => this.#faqRepo.findById(id), FAQ_CACHE_TTL);
    if (!faq) throw new NotFoundError("FAQ");
    if (!faq.published) throw new NotFoundError("FAQ");
    await this.#faqRepo.incrementViews(id);
    return faq;
  }

  async search(queryText, params) {
    if (!queryText?.trim()) throw new BadRequestError("Search query cannot be empty");
    const { page, limit } = buildPagination(params.page, params.limit);
    const { results, total } = await this.#faqRepo.textSearch(queryText, { page, limit, category: params.category });
    return { results, pagination: buildPaginationMeta(total, page, limit) };
  }

  async vote(id, type) {
    if (!["up", "down"].includes(type)) throw new BadRequestError("Vote type must be 'up' or 'down'");
    const faq = await this.#faqRepo.vote(id, type);
    if (!faq) throw new NotFoundError("FAQ");
    await cacheDelPattern(`faq:${id}*`);
    return faq;
  }

  /**
   * Called when admin approves a FAQ draft.
   * Publishes and emits realtime event.
   */
  async publishFAQ(id, adminId) {
    const faq = await this.#faqRepo.publish(id, adminId);
    if (!faq) throw new NotFoundError("FAQ");

    await cacheDelPattern("faqs:list:*");

    // Emit realtime event
    try {
      const io = getIO();
      io.emit(SOCKET_EVENTS.FAQ_PUBLISHED, {
        faqId: faq._id,
        title: faq.title,
        category: faq.category,
        publishedAt: faq.publishedAt,
      });
    } catch (socketErr) {
      logger.warn({ msg: "Could not emit FAQ publish event", err: socketErr.message });
    }

    logger.info({ msg: "FAQ published", faqId: id, adminId });
    return faq;
  }

  async getStats() {
    return this.#faqRepo.getStats();
  }
}
