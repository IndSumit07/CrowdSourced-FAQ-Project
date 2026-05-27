import rateLimit from "express-rate-limit";
import { env } from "../configs/env.config.js";
import { ApiResponse } from "../utils/apiResponse.js";

const createLimiter = (max, message) =>
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: (req, res) => {
      return ApiResponse.error(res, message, 429, "TOO_MANY_REQUESTS");
    },
  });

/** General public-facing routes */
export const publicLimiter = createLimiter(
  env.RATE_LIMIT_MAX_PUBLIC,
  "Too many requests from this IP. Please try again later."
);

/** Authenticated user routes */
export const authLimiter = createLimiter(
  env.RATE_LIMIT_MAX_AUTH,
  "You are sending too many requests. Please slow down."
);

/** AI-heavy endpoints */
export const aiLimiter = createLimiter(
  env.RATE_LIMIT_MAX_AI,
  "AI request limit reached. Please wait before trying again."
);

/** Strict auth endpoint limiter (login/register) */
export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    return ApiResponse.error(res, "Too many authentication attempts. Please wait 15 minutes.", 429, "TOO_MANY_REQUESTS");
  },
});
