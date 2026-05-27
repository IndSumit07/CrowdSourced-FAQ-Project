import { Router } from "express";
import { getNotifications, markAllRead, markRead } from "../controller/notification.controller.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", getNotifications);
router.post("/read-all", markAllRead);
router.patch("/:id/read", markRead);

export default router;
