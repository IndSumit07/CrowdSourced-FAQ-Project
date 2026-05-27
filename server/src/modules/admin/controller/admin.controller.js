import { AdminService } from "../service/admin.service.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

const adminService = new AdminService();

export class AdminController {
  // FAQ Management
  getPendingFAQs = asyncHandler(async (req, res) => {
    const { faqs, total } = await adminService.getPendingFAQs(req.query);
    return ApiResponse.success(res, { faqs, total });
  });

  approveFAQ = asyncHandler(async (req, res) => {
    const faq = await adminService.approveFAQ(req.params.id, req.user.id);
    return ApiResponse.success(res, { faq }, "FAQ approved and published");
  });

  editAndApproveFAQ = asyncHandler(async (req, res) => {
    const faq = await adminService.editAndApproveFAQ(req.params.id, req.user.id, req.body);
    return ApiResponse.success(res, { faq }, "FAQ edited and published");
  });

  rejectFAQ = asyncHandler(async (req, res) => {
    await adminService.rejectFAQ(req.params.id, req.body.reason);
    return ApiResponse.success(res, null, "FAQ rejected and removed");
  });

  // User Management
  getAllUsers = asyncHandler(async (req, res) => {
    const { users, total } = await adminService.getAllUsers(req.query);
    return ApiResponse.success(res, { users, total });
  });

  updateUserRole = asyncHandler(async (req, res) => {
    const user = await adminService.updateUserRole(req.params.userId, req.body.role);
    return ApiResponse.success(res, { user }, "User role updated");
  });

  deactivateUser = asyncHandler(async (req, res) => {
    await adminService.deactivateUser(req.params.userId);
    return ApiResponse.success(res, null, "User deactivated");
  });

  getTopContributors = asyncHandler(async (req, res) => {
    const contributors = await adminService.getTopContributors();
    return ApiResponse.success(res, { contributors });
  });

  getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await adminService.getDashboardStats();
    return ApiResponse.success(res, { stats });
  });
}
