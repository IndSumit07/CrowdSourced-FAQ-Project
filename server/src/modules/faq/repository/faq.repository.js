import { FAQ } from "../schema/faq.schema.js";
import { aiConfig } from "../../../configs/ai.config.js";

export class FAQRepository {
  /**
   * Exact text match — case-insensitive title search.
   */
  async findExactMatch(title) {
    return FAQ.findOne({
      title: { $regex: new RegExp(`^${title.trim()}$`, "i") },
      published: true,
    })
      .populate("section", "title order")
      .lean();
  }

  /**
   * Full-text search using MongoDB text indexes with regex fallback.
   */
  async textSearch(query, { page = 1, limit = 20, category } = {}) {
    const skip = (page - 1) * limit;

    try {
      const filter = {
        $text: { $search: query },
        published: true,
        ...(category && { category }),
      };

      const [results, total] = await Promise.all([
        FAQ.find(filter, { score: { $meta: "textScore" } })
          .sort({ score: { $meta: "textScore" } })
          .skip(skip)
          .limit(limit)
          .populate("section", "title order")
          .lean(),
        FAQ.countDocuments(filter),
      ]);

      return { results, total };
    } catch (err) {
      // Fallback to keyword regex search if Atlas text index is missing or building
      const STOP_WORDS = new Set([
        "what", "is", "the", "a", "an", "and", "or", "in", "of", "to", "for", "with",
        "on", "at", "by", "from", "about", "tell", "me", "how", "can", "i", "are", "do",
        "does", "there", "any", "gla", "university"
      ]);
      const words = String(query || "")
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

      const searchTerms = words.length > 0 ? words : [query.trim()].filter(Boolean);
      const pattern = searchTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

      const regexFilter = {
        published: true,
        ...(category && { category }),
        ...(pattern && {
          $or: [
            { title: { $regex: pattern, $options: "i" } },
            { answer: { $regex: pattern, $options: "i" } },
          ],
        }),
      };

      const [results, total] = await Promise.all([
        FAQ.find(regexFilter)
          .skip(skip)
          .limit(limit)
          .populate("section", "title order")
          .lean(),
        FAQ.countDocuments(regexFilter),
      ]);

      // Assign score: 2.0 so fallback results pass relevancy thresholds
      const scoredResults = results.map((r) => ({ ...r, score: 2.0 }));
      return { results: scoredResults, total };
    }
  }

  /**
   * MongoDB Atlas Vector Search for semantic similarity.
   */
  async vectorSearch(embedding, { limit = 5, minScore = aiConfig.vectorSearch.similarityThreshold } = {}) {
    try {
      const results = await FAQ.aggregate([
        {
          $vectorSearch: {
            index: aiConfig.vectorSearch.indexName,
            path: "embedding",
            queryVector: embedding,
            numCandidates: aiConfig.vectorSearch.numCandidates,
            limit: limit * 2, // Over-fetch to filter by score
          },
        },
        {
          $addFields: {
            vectorScore: { $meta: "vectorSearchScore" },
          },
        },
        {
          $match: {
            published: true,
            vectorScore: { $gte: minScore },
          },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            embedding: 0,
            __v: 0,
          },
        },
      ]);

      return results;
    } catch (err) {
      // Don't crash if Atlas vector index is not yet built or configured
      return [];
    }
  }

  async create(data) {
    return FAQ.create(data);
  }

  async findById(id, { includeEmbedding = false } = {}) {
    let query = FAQ.findById(id);
    if (includeEmbedding) query = query.select("+embedding");
    return query.lean();
  }

  async findAll({ page, limit, skip, sort, filter = {} }) {
    const [faqs, total] = await Promise.all([
      FAQ.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("section", "title order")
        .lean(),
      FAQ.countDocuments(filter),
    ]);
    return { faqs, total };
  }

  async findPendingApproval({ page, limit, skip }) {
    const filter = { published: false };
    const [faqs, total] = await Promise.all([
      FAQ.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sourceQuery", "question")
        .lean(),
      FAQ.countDocuments(filter),
    ]);
    return { faqs, total };
  }

  async updateById(id, update) {
    return FAQ.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
  }

  async publish(id, adminId) {
    return FAQ.findByIdAndUpdate(
      id,
      { published: true, approvedBy: adminId, publishedAt: new Date() },
      { new: true }
    ).lean();
  }

  async reject(id) {
    return FAQ.findByIdAndDelete(id);
  }

  async incrementViews(id) {
    return FAQ.findByIdAndUpdate(id, { $inc: { views: 1 } }).lean();
  }

  async vote(id, type) {
    const field = type === "up" ? "upvotes" : "downvotes";
    return FAQ.findByIdAndUpdate(id, { $inc: { [field]: 1 } }, { new: true }).lean();
  }

  async getStats() {
    const [total, published, pending] = await Promise.all([
      FAQ.countDocuments({}),
      FAQ.countDocuments({ published: true }),
      FAQ.countDocuments({ published: false }),
    ]);
    return { total, published, pending };
  }
}
