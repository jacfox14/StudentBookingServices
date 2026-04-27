import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { serviceController } from "../controllers/serviceController.js";

const router = Router();

router.get("/service-categories", serviceController.categories);
router.get("/services", serviceController.list);
router.get("/services/:id", serviceController.get);
router.get("/services/:id/availability", requireAuth, serviceController.availability);

export default router;
