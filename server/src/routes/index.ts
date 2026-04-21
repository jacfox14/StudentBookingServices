import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import serviceRoutes from "./serviceRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import providerRoutes from "./providerRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/", serviceRoutes);
router.use("/bookings", bookingRoutes);
router.use("/provider", providerRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);

export default router;
