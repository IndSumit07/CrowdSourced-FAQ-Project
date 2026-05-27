const hasUnsafeKey = (key) => key.startsWith("$") || key.includes(".");

const sanitizeNoSql = (value) => {
  if (Array.isArray(value)) {
    value.forEach(sanitizeNoSql);
    return;
  }

  if (value !== null && typeof value === "object") {
    Object.keys(value).forEach((key) => {
      if (hasUnsafeKey(key)) {
        delete value[key];
        return;
      }

      sanitizeNoSql(value[key]);
    });
  }
};

export const mongoSanitize = (req, res, next) => {
  if (req.body) sanitizeNoSql(req.body);
  if (req.params) sanitizeNoSql(req.params);
  if (req.query) sanitizeNoSql(req.query);
  next();
};
