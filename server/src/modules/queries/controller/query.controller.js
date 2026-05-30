import { QueryService } from "../service/query.service.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ForbiddenError } from "../../../utils/errors.js";

const queryService = new QueryService();

export class QueryController {
  askQuery = asyncHandler(async (req, res) => {
    const { question } = req.body;
    const result = await queryService.askQuery(question);
    return ApiResponse.success(res, {
      aiAnswer: result.aiAnswer,
      relatedFAQs: result.relatedFAQs,
    }, "AI answer generated");
  });

  submit = asyncHandler(async (req, res) => {
    if (req.user?.role === "admin") {
      throw new ForbiddenError("Administrators are not permitted to submit queries");
    }
    const result = await queryService.submit(req.body.question, req.user.id, req.body.force);
    if (result.resolved) {
      return ApiResponse.success(
        res,
        result.resolution,
        "Found an existing answer",
      );
    }
    return ApiResponse.created(
      res,
      { query: result.query },
      "Query submitted to contributor pool",
    );
  });

  getById = asyncHandler(async (req, res) => {
    const query = await queryService.getById(req.params.id);
    return ApiResponse.success(res, { query });
  });

  getFeed = asyncHandler(async (req, res) => {
    const result = await queryService.getOpenFeed(req.query);
    return ApiResponse.paginated(res, result.queries, result.pagination);
  });

  getMyQueries = asyncHandler(async (req, res) => {
    const result = await queryService.getMyQueries(req.user.id, req.query);
    return ApiResponse.paginated(res, result.queries, result.pagination);
  });

  getResponses = asyncHandler(async (req, res) => {
    const responses = await queryService.getResponses(req.params.id);
    return ApiResponse.success(res, { responses });
  });

  deleteMyQuery = asyncHandler(async (req, res) => {
    const result = await queryService.deleteMyQuery(req.params.id, req.user.id);
    return ApiResponse.success(res, result, "Query deleted");
  });

  getAll = asyncHandler(async (req, res) => {
    const result = await queryService.getAll(req.query);
    return ApiResponse.paginated(res, result.queries, result.pagination);
  });

  getStats = asyncHandler(async (req, res) => {
    const stats = await queryService.getStats();
    return ApiResponse.success(res, { stats });
  });
}
