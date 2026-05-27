import { User } from "../schema/user.schema.js";

/**
 * UserRepository — all DB access for the User collection.
 * Services must not use the Mongoose model directly.
 */
export class UserRepository {
  async create(data) {
    return User.create(data);
  }

  async findById(id, { includePassword = false, includeRefreshToken = false } = {}) {
    let query = User.findById(id);
    if (includePassword) query = query.select("+password");
    if (includeRefreshToken) query = query.select("+refreshToken +refreshTokenFamily");
    return query.lean();
  }

  async findByEmail(email, { includePassword = false, includeRefreshToken = false } = {}) {
    let query = User.findOne({ email: email.toLowerCase().trim() });
    if (includePassword) query = query.select("+password");
    if (includeRefreshToken) query = query.select("+refreshToken +refreshTokenFamily");
    return query.lean();
  }

  async findByIdWithPassword(id) {
    return User.findById(id).select("+password").lean();
  }

  async updateById(id, update) {
    return User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
  }

  async updateRefreshToken(id, hashedToken, family) {
    return User.findByIdAndUpdate(id, {
      refreshToken: hashedToken,
      refreshTokenFamily: family,
      lastLoginAt: new Date(),
    }).lean();
  }

  async invalidateRefreshToken(id) {
    return User.findByIdAndUpdate(id, {
      refreshToken: null,
      refreshTokenFamily: null,
    }).lean();
  }

  async incrementReputation(id, amount = 1) {
    return User.findByIdAndUpdate(id, {
      $inc: { reputation: amount, totalAnswers: 1 },
    }).lean();
  }

  async findTopContributors(limit = 10) {
    return User.find({ role: { $in: ["contributor", "admin"] } })
      .sort({ reputation: -1 })
      .limit(limit)
      .select("name email reputation expertise totalAnswers totalAccepted avatar")
      .lean();
  }

  async findAll({ page, limit, skip, role, search, sort }) {
    const filter = { isActive: true };
    if (role) filter.role = role;
    if (search) filter.$text = { $search: search };

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return { users, total };
  }

  async updateRole(id, role) {
    return User.findByIdAndUpdate(id, { role }, { new: true }).lean();
  }

  async deactivate(id) {
    return User.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  }

  async existsByEmail(email) {
    return User.exists({ email: email.toLowerCase().trim() });
  }
}
