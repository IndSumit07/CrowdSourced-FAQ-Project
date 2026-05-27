import xss from "xss";

/**
 * Recursively sanitizes an object's string values against XSS.
 */
const sanitizeObject = (obj) => {
  if (typeof obj === "string") return xss(obj.trim());

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      obj[index] = sanitizeObject(item);
    });
    return obj;
  }

  if (obj !== null && typeof obj === "object") {
    Object.keys(obj).forEach((key) => {
      obj[key] = sanitizeObject(obj[key]);
    });
    return obj;
  }

  return obj;
};

/**
 * Sanitizes req.body and req.query recursively.
 */
export const sanitize = (req, res, next) => {
  if (req.body) {
    const sanitizedBody = sanitizeObject(req.body);
    if (sanitizedBody !== req.body) req.body = sanitizedBody;
  }
  if (req.query) sanitizeObject(req.query);
  next();
};
