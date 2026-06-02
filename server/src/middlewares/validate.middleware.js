import { ValidationError } from "../utils/errors.js";

/**
 * Validates request body against a Zod schema.
 * Attaches parsed (coerced/transformed) data to req.body.
 */
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
      received: i.received,
    }));
    return next(new ValidationError("Request body validation failed", details));
  }
  req.body = result.data;
  next();
};

/**
 * Validates query params against a Zod schema.
 */
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return next(
      new ValidationError("Query parameter validation failed", details),
    );
  }
  if (req.query && typeof req.query === "object") {
    Object.keys(req.query).forEach((key) => {
      delete req.query[key];
    });
    Object.assign(req.query, result.data);
  } else {
    req.validatedQuery = result.data;
  }
  next();
};

/**
 * Validates route params against a Zod schema.
 */
export const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    console.log("validateParams error:", JSON.stringify(result.error.issues));
    const details = result.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
      received: i.received,
    }));
    return next(
      new ValidationError("Route parameter validation failed", details),
    );
  }
  req.params = result.data;
  next();
};
