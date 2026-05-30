import { Router } from "express";
import { QueryController } from "../controller/query.controller.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/auth.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../../middlewares/validate.middleware.js";
import {
  authLimiter,
  aiLimiter,
} from "../../../middlewares/rateLimit.middleware.js";
import { z } from "zod";
import { objectIdSchema } from "../../auth/validator/auth.validator.js";

const router = Router();
const queryController = new QueryController();

const submitSchema = z.object({
  question: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(1000),
  force: z.boolean().optional(),
});

// Schema for the RAG ask endpoint (same validation as submit)
const askSchema = z.object({
  question: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(1000),
});

const queryListSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  category: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional().default("-createdAt"),
});

// ─── RAG Ask Route (public — no auth required for preview) ───
router.post("/ask", aiLimiter, validateBody(askSchema), queryController.askQuery);

// ─── Static Routes (No Route Parameters) ───
// Public
router.get("/feed", validateQuery(queryListSchema), queryController.getFeed);

// Auth Required
router.get("/my", authenticate, validateQuery(queryListSchema), queryController.getMyQueries);

// Admin Specific
router.get("/admin/stats", authenticate, authorize("admin"), queryController.getStats);

// ─── Dynamic & Wildcard Routes (Contains Route Parameters) ───
// Public
router.get("/:id", validateParams(objectIdSchema), queryController.getById);
router.get(
  "/:id/responses",
  validateParams(objectIdSchema),
  queryController.getResponses,
);

// Auth Required mutations
router.post("/", authenticate, aiLimiter, validateBody(submitSchema), queryController.submit);
router.delete(
  "/:id",
  authenticate,
  validateParams(objectIdSchema),
  queryController.deleteMyQuery,
);

// Admin General List
router.get(
  "/",
  authenticate,
  authorize("admin"),
  validateQuery(queryListSchema),
  queryController.getAll,
);

export default router;
