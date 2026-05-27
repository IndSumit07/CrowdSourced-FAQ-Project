import { Router } from "express";
import { AuthController } from "../controller/auth.controller.js";
import { validateBody } from "../../../middlewares/validate.middleware.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { strictAuthLimiter } from "../../../middlewares/rateLimit.middleware.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from "../validator/auth.validator.js";

const router = Router();
const authController = new AuthController();

// Public routes
router.post("/register", strictAuthLimiter, validateBody(registerSchema), authController.register);
router.post("/login", strictAuthLimiter, validateBody(loginSchema), authController.login);
router.post("/refresh", authController.refresh);

// Protected routes
router.use(authenticate);
router.post("/logout", authController.logout);
router.get("/me", authController.me);
router.patch("/change-password", validateBody(changePasswordSchema), authController.changePassword);

export default router;
