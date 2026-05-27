/**
 * Consistent API response wrapper.
 * All endpoints use these methods to ensure uniform response shape.
 */
export const ApiResponse = {
  success(res, data = null, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  },

  created(res, data = null, message = "Created successfully") {
    return ApiResponse.success(res, data, message, 201);
  },

  noContent(res) {
    return res.status(204).send();
  },

  paginated(res, data, pagination, message = "Success") {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    });
  },

  error(res, message = "Internal Server Error", statusCode = 500, code = "INTERNAL_ERROR", details = null) {
    const body = {
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
    };
    if (details) body.details = details;
    return res.status(statusCode).json(body);
  },
};
