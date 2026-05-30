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

  async incrementReputationAndAccepted(id, amount = 1) {
    return User.findByIdAndUpdate(id, {
      $inc: { reputation: amount, totalAccepted: 1 },
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

  async findByGoogleId(googleId) {
    return User.findOne({ googleId }).lean();
  }

  /**
   * Find an existing user by Google ID, or by email (to link the Google account),
   * or create a brand-new user if neither exists.
   */
  async findOrCreateGoogleUser({ googleId, email, name, avatar }) {
    // 1. Already linked to this Google account
    let user = await User.findOne({ googleId }).lean();
    if (user) return { user, isNew: false };

    // 2. Email already exists (email-registered user) — link Google to that account
    user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { $set: { googleId, authProvider: "google", avatar: avatar || null } },
      { new: true }
    ).lean();
    if (user) return { user, isNew: false };

    // 3. Completely new user — create with Google provider
    const created = await User.create({
      name,
      email: email.toLowerCase().trim(),
      googleId,
      authProvider: "google",
      avatar: avatar || null,
    });
    return { user: created.toObject(), isNew: true };
  }
}
