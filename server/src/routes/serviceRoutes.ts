import { Router } from "express";
import { serviceController } from "../controllers/serviceController.js";

const router = Router();

router.get("/service-categories", serviceController.categories);
router.get("/services", serviceController.list);
router.get("/services/:id", serviceController.get);
router.get("/services/:id/availability", serviceController.availability);

export default router;
