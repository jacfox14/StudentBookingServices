import { Router } from "express";
import { createAvailabilitySchema } from "@sbs/shared";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { providerController } from "../controllers/providerController.js";

const router = Router();

router.use(requireAuth, requireRole("staff"));

router.get("/bookings", providerController.bookings);
router.get("/requests", providerController.requests);
router.get("/schedule", providerController.schedule);
router.post(
  "/availability",
  validate(createAvailabilitySchema),
  providerController.addAvailability
);
router.delete("/availability/:id", providerController.removeAvailability);
router.get("/services", providerController.myServices);

export default router;
