import { Router } from "express";
import rateLimit from "express-rate-limit";
import { loginSchema, registerSchema } from "@sbs/shared";
import { validate } from "../middleware/validate.js";
import { authController } from "../controllers/authController.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/logout", authController.logout);

export default router;
