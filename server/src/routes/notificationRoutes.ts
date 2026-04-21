import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { notificationController } from "../controllers/notificationController.js";

const router = Router();

router.use(requireAuth);

router.get("/", notificationController.list);
router.patch("/:id/read", notificationController.markRead);

export default router;
