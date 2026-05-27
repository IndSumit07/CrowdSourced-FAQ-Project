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
});

const queryListSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  category: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional().default("-createdAt"),
});

// Public
router.get("/feed", validateQuery(queryListSchema), queryController.getFeed);
router.get("/:id", validateParams(objectIdSchema), queryController.getById);
router.get(
  "/:id/responses",
  validateParams(objectIdSchema),
  queryController.getResponses,
);

// Auth required
router.use(authenticate);
router.post("/", aiLimiter, validateBody(submitSchema), queryController.submit);
router.get("/my", validateQuery(queryListSchema), queryController.getMyQueries);
router.delete(
  "/:id",
  validateParams(objectIdSchema),
  queryController.deleteMyQuery,
);

// Admin
router.get(
  "/",
  authorize("admin"),
  validateQuery(queryListSchema),
  queryController.getAll,
);
router.get("/admin/stats", authorize("admin"), queryController.getStats);

export default router;
