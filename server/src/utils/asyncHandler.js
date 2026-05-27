/**
 * Wraps async route handlers to eliminate try/catch boilerplate.
 * Forwards errors to Express error middleware automatically.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
