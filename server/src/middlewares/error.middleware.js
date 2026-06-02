import mongoose from "mongoose";
import { AppError, ValidationError } from "../utils/errors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";
import { env } from "../configs/env.config.js";

/**
 * Centralized error handler middleware.
 * Converts all error types to consistent API error responses.
 */
export const errorHandler = (err, req, res, next) => {
  // Prevent double-sending
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let code = err.code || "INTERNAL_ERROR";
  let details = err.details || null;

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    code = "MONGOOSE_VALIDATION_ERROR";
    message = "Database validation failed";
    console.log("Mongoose ValidationError:", JSON.stringify(err.errors), "\nStack:", err.stack);
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle Mongoose cast errors (invalid ObjectId etc.)
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    code = "INVALID_ID";
    message = `Invalid value for field '${err.path}'`;
  }

  // Handle MongoDB duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_KEY";
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `A record with this ${field} already exists`;
  }

  // Handle Zod-wrapped ValidationError
  if (err instanceof ValidationError) {
    statusCode = 422;
  }

  // Log non-operational or server errors
  if (statusCode >= 500 || !err.isOperational) {
    logger.error({
      msg: "Unhandled error",
      err: {
        message: err.message,
        stack: err.stack,
        code: err.code,
      },
      req: {
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id,
      },
    });
  }

  return ApiResponse.error(
    res,
    env.NODE_ENV === "production" && statusCode >= 500
      ? "Internal Server Error"
      : message,
    statusCode,
    code,
    env.NODE_ENV !== "production" ? details : undefined
  );
};

/**
 * 404 handler — must be registered after all other routes.
 */
export const notFoundHandler = (req, res, next) => {
  return ApiResponse.error(res, `Route '${req.method} ${req.path}' not found`, 404, "ROUTE_NOT_FOUND");
};
