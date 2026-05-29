import { Router } from "express";
import { SectionController } from "../controller/section.controller.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { validateBody } from "../../../middlewares/validate.middleware.js";
import { z } from "zod";

const router = Router();
const sectionController = new SectionController();

const createSectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
});

router.get("/", sectionController.getAll);
router.post("/", authenticate, validateBody(createSectionSchema), sectionController.create);

export default router;