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
   * 2. Concurrent Full-text search and Vector (semantic) search
   * 3. Merging and filtering out irrelevant matches
   */
  async resolveQuery(question) {
    // Step 1: Exact match (always 100% relevant)
    const exact = await this.#faqRepo.findExactMatch(question);
    if (exact) {
      await this.#faqRepo.incrementViews(exact._id);
      const exactResult = { ...exact, matchType: "exact" };
      return { faq: exactResult, matchType: "exact", alternatives: [] };
    }

    // Generate embedding for vector search
    const embedding = await this.#embeddingService.embed(question);

    // Fetch candidate matches from both Vector Search and Full-Text Search concurrently
    const [vectorMatches, { results: textMatches }] = await Promise.all([
      this.#faqRepo.vectorSearch(embedding, { limit: 5 }),
      this.#faqRepo.textSearch(question, { limit: 5 }),
    ]);

    const mergedMatches = [];
    const seenIds = new Set();

    // 1. Process Vector matches first. They are already filtered by the similarity threshold
    // in the database pipeline, so they are guaranteed to be semantically highly relevant.
    for (const match of vectorMatches) {
      const matchId = match._id.toString();
      if (!seenIds.has(matchId)) {
        seenIds.add(matchId);
        mergedMatches.push({
          ...match,
          matchType: "semantic",
        });
      }
    }

    // 2. Process Full-Text matches.
    // MongoDB text scores are not normalized, but a score < 1.5 usually indicates matching only minor/common words.
    // We only accept text search matches that are highly relevant (score >= 1.5).
    const MIN_TEXT_SCORE = 1.5;
    for (const match of textMatches) {
      const matchId = match._id.toString();
      if (match.score >= MIN_TEXT_SCORE && !seenIds.has(matchId)) {
        seenIds.add(matchId);
        mergedMatches.push({
          ...match,
          matchType: "text",
        });
      }
    }

    // If we have any matches
    if (mergedMatches.length > 0) {
      const bestMatch = mergedMatches[0];
      await this.#faqRepo.incrementViews(bestMatch._id);

      return {
        faq: bestMatch,
        matchType: bestMatch.matchType,
        alternatives: mergedMatches.slice(1),
        embedding,
      };
    }

    return { faq: null, matchType: "none", alternatives: [], embedding };
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

  /**
   * Admin directly creates and publishes a FAQ (bypasses approval workflow).
   * Generates embedding automatically.
   */
  async createDirectFAQ(data, adminId) {
    const embedding = await this.#embeddingService.embed(data.title);
    const { sectionId, ...rest } = data;
    const faqData = {
      ...rest,
      embedding,
      published: true,
      publishedAt: new Date(),
      createdBy: adminId,
      approvedBy: adminId,
      aiGenerated: false,
      editedByAdmin: true,
      section: sectionId,
    };
    const faq = await this.#faqRepo.create(faqData);
    await cacheDelPattern("faqs:list:*");
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
    logger.info({ msg: "Direct FAQ created by admin", faqId: faq._id, adminId });
    return faq;
  }
}
