import { Router } from "express";
import {
  createBookingSchema,
  rejectBookingSchema,
  rescheduleBookingSchema,
} from "@sbs/shared";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { bookingController } from "../controllers/bookingController.js";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("student"), validate(createBookingSchema), bookingController.create);
router.get("/", bookingController.listMine);
router.get("/:id", bookingController.get);
router.patch("/:id", validate(rescheduleBookingSchema), bookingController.reschedule);
router.delete("/:id", bookingController.cancel);
router.post("/:id/approve", requireRole("staff", "admin"), bookingController.approve);
router.post(
  "/:id/reject",
  requireRole("staff", "admin"),
  validate(rejectBookingSchema),
  bookingController.reject
);

export default router;
