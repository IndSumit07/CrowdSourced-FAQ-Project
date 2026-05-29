import { SectionService } from "../service/section.service.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

const sectionService = new SectionService();

export class SectionController {
  getAll = asyncHandler(async (req, res) => {
    const sections = await sectionService.getAll();
    return ApiResponse.success(res, { sections });
  });

  create = asyncHandler(async (req, res) => {
    const section = await sectionService.create(req.body);
    return ApiResponse.created(res, { section }, "Section created");
  });
}