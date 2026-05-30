import { Router } from "express";
import { AdminController } from "../controller/admin.controller.js";
import {
  authenticate,
  authorize,
} from "../../../middlewares/auth.middleware.js";
import {
  validateBody,
  validateParams,
} from "../../../middlewares/validate.middleware.js";
import { z } from "zod";
import { objectIdSchema } from "../../auth/validator/auth.validator.js";

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication + admin role
router.use(authenticate, authorize("admin"));

const userIdSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
});
const roleSchema = z.object({ role: z.enum(["user", "contributor", "admin"]) });
const rejectSchema = z.object({ reason: z.string().min(1).optional() });
const sectionIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);
const publishFaqSchema = z.object({
  answer: z.string().min(20).max(10000),
  category: z
    .enum([
      "internship",
      "placement",
      "resume",
      "dsa",
      "coding-interview",
      "career",
      "general",
    ])
    .optional(),
  responseId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional()
    .nullable(),
  sectionId: sectionIdSchema,
});
const editFaqSchema = z.object({
  title: z.string().min(10).max(300).optional(),
  answer: z.string().min(20).max(10000).optional(),
  category: z
    .enum([
      "internship",
      "placement",
      "resume",
      "dsa",
      "coding-interview",
      "career",
      "general",
    ])
    .optional(),
  tags: z.array(z.string()).optional(),
  sectionId: sectionIdSchema,
  responseId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional()
    .nullable(), // ID of the selected contributor response
});
const approveFaqSchema = z.object({
  sectionId: sectionIdSchema,
});

const createDirectFaqSchema = z.object({
  title: z.string().min(10).max(300),
  answer: z.string().min(20).max(10000),
  sectionId: sectionIdSchema,
  tags: z.array(z.string()).optional().default([]),
});

// Dashboard
router.get("/stats", adminController.getDashboardStats);
router.get("/top-contributors", adminController.getTopContributors);

// Query Management
router.get("/queries/pending-review", adminController.getPendingReviewQueries);
router.post(
  "/queries/:id/publish-faq",
  validateParams(objectIdSchema),
  validateBody(publishFaqSchema),
  adminController.publishQueryToFAQ,
);

// FAQ management
router.post(
  "/faqs",
  validateBody(createDirectFaqSchema),
  adminController.createDirectFAQ,
);
router.get("/faqs/pending", adminController.getPendingFAQs);
router.post(
  "/faqs/:id/approve",
  validateParams(objectIdSchema),
  validateBody(approveFaqSchema),
  adminController.approveFAQ,
);
router.put(
  "/faqs/:id/edit-approve",
  validateParams(objectIdSchema),
  validateBody(editFaqSchema),
  adminController.editAndApproveFAQ,
);
router.delete(
  "/faqs/:id/reject",
  validateParams(objectIdSchema),
  validateBody(rejectSchema),
  adminController.rejectFAQ,
);

// User management
router.get("/users", adminController.getAllUsers);
router.patch(
  "/users/:userId/role",
  validateParams(userIdSchema),
  validateBody(roleSchema),
  adminController.updateUserRole,
);
router.delete(
  "/users/:userId",
  validateParams(userIdSchema),
  adminController.deactivateUser,
);

export default router;
