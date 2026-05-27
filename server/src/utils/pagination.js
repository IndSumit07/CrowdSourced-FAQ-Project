/**
 * Builds a MongoDB aggregation $sort stage from query params.
 * @param {string} sortBy - e.g. "createdAt" or "-createdAt"
 * @param {string[]} allowedFields - whitelist of sortable fields
 */
export const buildSortStage = (sortBy = "-createdAt", allowedFields = []) => {
  const dir = sortBy.startsWith("-") ? -1 : 1;
  const field = sortBy.replace(/^-/, "");
  const safeField = allowedFields.includes(field) ? field : "createdAt";
  return { [safeField]: dir };
};

/**
 * Builds pagination metadata and skip value.
 */
export const buildPagination = (page = 1, limit = 20) => {
  const safePage = Math.max(1, parseInt(page, 10));
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, skip };
};

/**
 * Constructs pagination metadata for API response.
 */
export const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});
