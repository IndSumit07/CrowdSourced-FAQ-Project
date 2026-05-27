import { Router } from "express";
import { FAQController } from "../controller/faq.controller.js";
import { authenticate, optionalAuthenticate } from "../../../middlewares/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../../middlewares/validate.middleware.js";
import { publicLimiter, aiLimiter } from "../../../middlewares/rateLimit.middleware.js";
import { z } from "zod";
import { objectIdSchema } from "../../auth/validator/auth.validator.js";

const router = Router();
const faqController = new FAQController();

const faqQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  category: z.enum(["internship", "placement", "resume", "dsa", "coding-interview", "career", "general"]).optional(),
  sortBy: z.string().optional().default("-createdAt"),
});

const searchQuerySchema = z.object({
  q: z.string().min(2, "Search query must be at least 2 characters"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  category: z.enum(["internship", "placement", "resume", "dsa", "coding-interview", "career", "general"]).optional(),
});

const resolveSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters").max(500),
});

const voteSchema = z.object({
  type: z.enum(["up", "down"]),
});

// Public
router.get("/", publicLimiter, validateQuery(faqQuerySchema), faqController.getAll);
router.get("/search", publicLimiter, validateQuery(searchQuerySchema), faqController.search);
router.get("/stats", faqController.getStats);
router.get("/:id", publicLimiter, validateParams(objectIdSchema), faqController.getById);

// AI-powered resolution (rate limited)
router.post("/resolve", aiLimiter, validateBody(resolveSchema), faqController.resolve);

// Auth required
router.post("/:id/vote", authenticate, validateParams(objectIdSchema), validateBody(voteSchema), faqController.vote);

export default router;
