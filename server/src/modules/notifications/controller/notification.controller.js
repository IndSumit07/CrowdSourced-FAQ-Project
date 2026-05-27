import { Notification } from "../schema/notification.schema.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/apiResponse.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;
  const notifications = await Notification.find({ recipient: req.user.id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();
  const total = await Notification.countDocuments({ recipient: req.user.id });
  const unreadCount = await Notification.countDocuments({ recipient: req.user.id, read: false });
  return ApiResponse.success(res, { notifications, total, unreadCount });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
  return ApiResponse.success(res, null, "All notifications marked as read");
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user.id }, { read: true });
  return ApiResponse.success(res, null, "Notification marked as read");
});
