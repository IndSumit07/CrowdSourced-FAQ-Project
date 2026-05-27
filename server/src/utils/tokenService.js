import jwt from "jsonwebtoken";
import { authConfig } from "../configs/auth.config.js";
import { UnauthorizedError } from "./errors.js";

/**
 * Signs a JWT access token.
 */
export const signAccessToken = (payload) => {
  return jwt.sign(payload, authConfig.jwt.accessSecret, {
    expiresIn: authConfig.jwt.accessExpiresIn,
    issuer: "faq-platform",
    audience: "faq-platform-client",
  });
};

/**
 * Signs a JWT refresh token.
 */
export const signRefreshToken = (payload) => {
  return jwt.sign(payload, authConfig.jwt.refreshSecret, {
    expiresIn: authConfig.jwt.refreshExpiresIn,
    issuer: "faq-platform",
    audience: "faq-platform-client",
  });
};

/**
 * Verifies an access token and returns the decoded payload.
 * Throws UnauthorizedError on failure.
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, authConfig.jwt.accessSecret, {
      issuer: "faq-platform",
      audience: "faq-platform-client",
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new UnauthorizedError("Access token expired");
    }
    throw new UnauthorizedError("Invalid access token");
  }
};

/**
 * Verifies a refresh token and returns the decoded payload.
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, authConfig.jwt.refreshSecret, {
      issuer: "faq-platform",
      audience: "faq-platform-client",
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new UnauthorizedError("Refresh token expired");
    }
    throw new UnauthorizedError("Invalid refresh token");
  }
};

/**
 * Decodes a token without verifying the signature.
 * Used to extract payload from expired tokens.
 */
export const decodeToken = (token) => jwt.decode(token);
