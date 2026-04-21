import { Router } from "express";
import { profileUpdateSchema } from "@sbs/shared";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { userController } from "../controllers/authController.js";

const router = Router();

router.get("/me", requireAuth, userController.me);
router.put("/me", requireAuth, validate(profileUpdateSchema), userController.updateMe);

export default router;
