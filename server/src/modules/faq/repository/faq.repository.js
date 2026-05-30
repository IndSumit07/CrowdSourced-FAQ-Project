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
   * Full-text search using MongoDB text indexes.
   */
  async textSearch(query, { page = 1, limit = 20, category } = {}) {
    const filter = {
      $text: { $search: query },
      published: true,
      ...(category && { category }),
    };
    const skip = (page - 1) * limit;

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
  }

  /**
   * MongoDB Atlas Vector Search for semantic similarity.
   */
  async vectorSearch(embedding, { limit = 5, minScore = aiConfig.vectorSearch.similarityThreshold } = {}) {
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
