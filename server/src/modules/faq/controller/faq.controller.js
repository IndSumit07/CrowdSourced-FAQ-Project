import { FAQService } from "../service/faq.service.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

const faqService = new FAQService();

export class FAQController {
  getAll = asyncHandler(async (req, res) => {
    const result = await faqService.getAll(req.query);
    return ApiResponse.paginated(res, result.faqs, result.pagination, "FAQs retrieved");
  });

  getById = asyncHandler(async (req, res) => {
    const faq = await faqService.getById(req.params.id);
    return ApiResponse.success(res, { faq });
  });

  search = asyncHandler(async (req, res) => {
    const { q, ...rest } = req.query;
    const result = await faqService.search(q, rest);
    return ApiResponse.paginated(res, result.results, result.pagination, "Search results");
  });

  resolve = asyncHandler(async (req, res) => {
    const { question } = req.body;
    const result = await faqService.resolveQuery(question);
    return ApiResponse.success(res, result, "Query resolved");
  });

  vote = asyncHandler(async (req, res) => {
    const faq = await faqService.vote(req.params.id, req.body.type);
    return ApiResponse.success(res, { faq }, "Vote recorded");
  });

  getStats = asyncHandler(async (req, res) => {
    const stats = await faqService.getStats();
    return ApiResponse.success(res, { stats });
  });
}
