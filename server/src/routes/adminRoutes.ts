import { Router } from "express";
import { createServiceSchema } from "@sbs/shared";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { adminController } from "../controllers/adminController.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/users", adminController.users);
router.patch("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

router.get("/services", adminController.services);
router.post("/services", validate(createServiceSchema), adminController.createService);
router.put("/services/:id", validate(createServiceSchema), adminController.updateService);
router.delete("/services/:id", adminController.deleteService);

router.get("/reports/summary", adminController.reportsSummary);
router.get("/reports/bookings", adminController.reportsBookings);

export default router;
