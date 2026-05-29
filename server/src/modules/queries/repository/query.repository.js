import { Query, ContributorResponse } from "../schema/query.schema.js";

export class QueryRepository {
  async create(data) {
    return Query.create(data);
  }

  async findById(id) {
    return Query.findById(id).populate("creator", "name email avatar").lean();
  }

  async updateById(id, update) {
    return Query.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
  }

  async deleteById(id) {
    return Query.findByIdAndDelete(id).lean();
  }

  async updateStatus(id, status) {
    return Query.findByIdAndUpdate(id, { status }, { new: true }).lean();
  }

  async findOpenQueries({ page = 1, limit = 20, skip = 0, category } = {}) {
    // Show both "open" and "in-progress" queries so the feed remains visible
    // to all contributors until the deadline passes, not just the first acceptor.
    const filter = {
      status: { $in: ["open", "in-progress"] },
      ...(category && { category }),
    };
    const [queries, total] = await Promise.all([
      Query.find(filter)
        .sort({ deadline: 1 })
        .skip(skip)
        .limit(limit)
        .populate("creator", "name avatar")
        .lean(),
      Query.countDocuments(filter),
    ]);
    return { queries, total };
  }

  async findByCreator(creatorId, { skip = 0, limit = 20 } = {}) {
    const [queries, total] = await Promise.all([
      Query.find({ creator: creatorId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Query.countDocuments({ creator: creatorId }),
    ]);
    return { queries, total };
  }

  async findExpiredQueries() {
    return Query.find({
      status: { $in: ["open", "in-progress"] },
      deadline: { $lte: new Date() },
    }).lean();
  }

  async addAcceptedContributor(queryId, contributorId) {
    return Query.findByIdAndUpdate(
      queryId,
      {
        $addToSet: { acceptedContributors: contributorId },
        status: "in-progress",
      },
      { new: true },
    ).lean();
  }

  async incrementResponseCount(queryId) {
    return Query.findByIdAndUpdate(queryId, {
      $inc: { responseCount: 1 },
    }).lean();
  }

  async findAll({ page, limit, skip, sort, filter = {} }) {
    const [queries, total] = await Promise.all([
      Query.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("creator", "name email")
        .lean(),
      Query.countDocuments(filter),
    ]);
    return { queries, total };
  }

  async getStats() {
    const stats = await Query.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    return stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
  }
}

export class ContributorResponseRepository {
  async create(data) {
    return ContributorResponse.create(data);
  }

  async findByQueryAndContributor(queryId, contributorId) {
    return ContributorResponse.findOne({
      query: queryId,
      contributor: contributorId,
    }).lean();
  }

  async findByQuery(queryId) {
    return ContributorResponse.find({
      query: queryId,
      skipped: false,
      answer: { $exists: true, $ne: "" },
    })
      .populate("contributor", "name expertise reputation")
      .lean();
  }

  async findByContributor(contributorId, { skip = 0, limit = 20 } = {}) {
    return ContributorResponse.find({ contributor: contributorId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("query", "question category status")
      .lean();
  }

  async updateById(id, update) {
    return ContributorResponse.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();
  }

  async deleteByQuery(queryId) {
    return ContributorResponse.deleteMany({ query: queryId });
  }

  async countByQuery(queryId) {
    return ContributorResponse.countDocuments({
      query: queryId,
      skipped: false,
    });
  }
}
