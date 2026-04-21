import type { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import { Booking, Service, User } from "../models/index.js";
import { BookingService } from "../services/BookingService.js";
import { toBookingDTO } from "../dto/index.js";
import { AppError } from "../errors/AppError.js";
import type {
  CreateBookingInput,
  RejectBookingInput,
  RescheduleBookingInput,
} from "@sbs/shared";

async function loadFullBooking(id: number) {
  return Booking.findByPk(id, {
    include: [
      { model: Service, as: "service", include: [{ model: User, as: "provider" }] },
      { model: User, as: "student" },
    ],
  });
}

export const bookingController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user!.role !== "student") {
        throw new AppError("FORBIDDEN", "Only students can create bookings");
      }
      const booking = await BookingService.create(
        req.user!.id,
        req.body as CreateBookingInput
      );
      res.status(201).json(toBookingDTO(booking as never));
    } catch (e) {
      next(e);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = req.user!;
      const status = req.query.status as string | undefined;
      const where: Record<string, unknown> = {};
      if (status) where.status = status;

      if (actor.role === "student") {
        where.studentId = actor.id;
      } else if (actor.role === "staff") {
        const myServices = await Service.findAll({
          where: { providerId: actor.id },
          attributes: ["id"],
        });
        where.serviceId = { [Op.in]: myServices.map((s) => s.id) };
      }
      // admin sees all

      const rows = await Booking.findAll({
        where,
        include: [
          { model: Service, as: "service", include: [{ model: User, as: "provider" }] },
          { model: User, as: "student" },
        ],
        order: [["startAt", "DESC"]],
      });
      res.json(rows.map((r) => toBookingDTO(r as never)));
    } catch (e) {
      next(e);
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const booking = await loadFullBooking(id);
      if (!booking) throw new AppError("NOT_FOUND", "Booking not found");
      const actor = req.user!;
      const service = (booking as unknown as { service?: { providerId: number } }).service;
      const isOwner = booking.studentId === actor.id;
      const isProvider = service?.providerId === actor.id;
      if (!isOwner && !isProvider && actor.role !== "admin") {
        throw new AppError("FORBIDDEN", "You cannot view this booking");
      }
      res.json(toBookingDTO(booking as never));
    } catch (e) {
      next(e);
    }
  },

  async reschedule(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const booking = await BookingService.reschedule(
        id,
        { id: req.user!.id, role: req.user!.role },
        req.body as RescheduleBookingInput
      );
      res.json(toBookingDTO(booking as never));
    } catch (e) {
      next(e);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const booking = await BookingService.transition(id, "cancelled", {
        id: req.user!.id,
        role: req.user!.role,
      });
      res.json(toBookingDTO(booking as never));
    } catch (e) {
      next(e);
    }
  },

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const booking = await BookingService.transition(id, "approved", {
        id: req.user!.id,
        role: req.user!.role,
      });
      res.json(toBookingDTO(booking as never));
    } catch (e) {
      next(e);
    }
  },

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { reason } = req.body as RejectBookingInput;
      const booking = await BookingService.transition(
        id,
        "rejected",
        { id: req.user!.id, role: req.user!.role },
        { rejectionReason: reason }
      );
      res.json(toBookingDTO(booking as never));
    } catch (e) {
      next(e);
    }
  },
};
