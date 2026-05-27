import { Router } from "express";
import { ContributorController } from "../controller/contributor.controller.js";
import { authenticate, authorize } from "../../../middlewares/auth.middleware.js";
import { validateBody, validateParams } from "../../../middlewares/validate.middleware.js";
import { authLimiter } from "../../../middlewares/rateLimit.middleware.js";
import { z } from "zod";
import { objectIdSchema } from "../../auth/validator/auth.validator.js";

const router = Router();
const contributorController = new ContributorController();

const queryIdSchema = z.object({ queryId: z.string().regex(/^[0-9a-fA-F]{24}$/) });

const answerSchema = z.object({
  answer: z.string().min(10, "Answer must be at least 10 characters").max(5000),
  confidence: z.number().int().min(1).max(5).optional().default(3),
});

router.use(authenticate);

router.post("/queries/:queryId/accept", authLimiter, validateParams(queryIdSchema), contributorController.accept);
router.post("/queries/:queryId/answer", authLimiter, validateParams(queryIdSchema), validateBody(answerSchema), contributorController.answer);
router.post("/queries/:queryId/skip", validateParams(queryIdSchema), contributorController.skip);
router.get("/my-responses", contributorController.myResponses);

export default router;
