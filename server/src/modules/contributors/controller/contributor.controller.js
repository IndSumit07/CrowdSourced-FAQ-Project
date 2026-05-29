import { ContributorService } from "../service/contributor.service.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

const contributorService = new ContributorService();

export class ContributorController {
  accept = asyncHandler(async (req, res) => {
    const response = await contributorService.acceptQuery(req.params.queryId, req.user.id);
    return ApiResponse.created(res, { response }, "Query accepted successfully");
  });

  answer = asyncHandler(async (req, res) => {
    const response = await contributorService.submitAnswer(
      req.params.queryId,
      req.user.id,
      req.body
    );
    return ApiResponse.success(res, { response }, "Answer submitted");
  });

  skip = asyncHandler(async (req, res) => {
    await contributorService.skipQuery(req.params.queryId, req.user.id);
    return ApiResponse.success(res, null, "Query skipped");
  });

  myResponses = asyncHandler(async (req, res) => {
    const responses = await contributorService.getMyResponses(req.user.id, req.query);
    return ApiResponse.success(res, { responses });
  });

  flag = asyncHandler(async (req, res) => {
    const result = await contributorService.flagQuery(req.params.queryId, req.user.id);
    return ApiResponse.success(res, result, "Query flagged");
  });
}
