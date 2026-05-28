import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { UserRepository } from "../../users/repository/user.repository.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../../utils/tokenService.js";
import { hashPassword, comparePassword } from "../../../utils/hashService.js";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../../../utils/errors.js";
import { cacheDel } from "../../../utils/cache.js";
import { logger } from "../../../utils/logger.js";

const userRepo = new UserRepository();

const buildTokenPayload = (user) => ({
  id: user._id.toString(),
  email: user.email,
  role: user.role,
  name: user.name,
});

const buildUserResponse = (user) => ({
  id: user._id.toString(),
  email: user.email,
  role: user.role,
  name: user.name,
  reputation: user.reputation ?? 0,
  expertise: user.expertise ?? [],
  totalAnswers: user.totalAnswers ?? 0,
  totalAccepted: user.totalAccepted ?? 0,
});

export class AuthService {
  async register(dto) {
    const exists = await userRepo.existsByEmail(dto.email);
    if (exists) throw new ConflictError("Email is already registered");

    const user = await userRepo.create({
      name: dto.name,
      email: dto.email,
      password: dto.password, // Schema pre-save hook hashes this
      expertise: dto.expertise,
      role: dto.role,
    });

    const payload = buildTokenPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: user._id.toString() });
    const family = randomUUID();
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);

    await userRepo.updateRefreshToken(user._id, hashedRefresh, family);

    logger.info({
      msg: "User registered",
      userId: user._id,
      email: user.email,
    });

    return {
      user: buildUserResponse(user),
      accessToken,
      refreshToken,
    };
  }

  async login(dto) {
    // Fetch with password (not in lean by default)
    const user = await userRepo.findByEmail(dto.email, {
      includePassword: true,
    });
    if (!user) throw new UnauthorizedError("Invalid credentials");
    if (!user.isActive) throw new UnauthorizedError("Account is deactivated");

    const passwordValid = await comparePassword(dto.password, user.password);
    if (!passwordValid) throw new UnauthorizedError("Invalid credentials");

    const payload = buildTokenPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: user._id.toString() });
    const family = randomUUID();
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);

    await userRepo.updateRefreshToken(user._id, hashedRefresh, family);

    // Invalidate user's cache
    await cacheDel(`user:${user._id}`);

    logger.info({ msg: "User logged in", userId: user._id });

    return {
      user: buildUserResponse(user),
      accessToken,
      refreshToken,
    };
  }

  async refresh(dto) {
    let decoded;
    try {
      decoded = verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const user = await userRepo.findById(decoded.id, {
      includeRefreshToken: true,
    });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedError("Refresh token revoked");
    }

    // Verify the stored hashed token matches
    const isValid = await bcrypt.compare(dto.refreshToken, user.refreshToken);
    if (!isValid) {
      // Potential token reuse — revoke entire family
      await userRepo.invalidateRefreshToken(user._id);
      logger.warn({
        msg: "Refresh token reuse detected — family revoked",
        userId: user._id,
      });
      throw new UnauthorizedError("Token reuse detected. Please log in again.");
    }

    const payload = buildTokenPayload(user);
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken({ id: user._id.toString() });
    const hashedRefresh = await bcrypt.hash(newRefreshToken, 10);

    await userRepo.updateRefreshToken(
      user._id,
      hashedRefresh,
      user.refreshTokenFamily,
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId) {
    await userRepo.invalidateRefreshToken(userId);
    await cacheDel(`user:${userId}`);
    logger.info({ msg: "User logged out", userId });
  }

  async getMe(userId) {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError("User");
    return buildUserResponse(user);
  }

  async changePassword(userId, dto) {
    const user = await userRepo.findByIdWithPassword(userId);
    if (!user) throw new NotFoundError("User");

    const valid = await comparePassword(dto.currentPassword, user.password);
    if (!valid) throw new UnauthorizedError("Current password is incorrect");

    const hashed = await hashPassword(dto.newPassword);
    await userRepo.updateById(userId, { password: hashed });
    await userRepo.invalidateRefreshToken(userId);
  }
}
