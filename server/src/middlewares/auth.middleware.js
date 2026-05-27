import { verifyAccessToken } from "../utils/tokenService.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";

/**
 * Extracts and verifies Bearer JWT from Authorization header.
 * Attaches decoded user to req.user.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("No token provided"));
  }

  const token = authHeader.slice(7);
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Role-based access control middleware factory.
 * Usage: authorize("admin") or authorize("admin", "contributor")
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role '${req.user.role}' is not permitted`));
    }
    next();
  };
};

/**
 * Optional auth — attaches user if token present, does not fail if absent.
 */
export const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();

  const token = authHeader.slice(7);
  try {
    req.user = verifyAccessToken(token);
  } catch {
    // Silent — user remains undefined
  }
  next();
};
