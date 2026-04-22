import type { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import {
  AvailabilityBlock,
  Booking,
  Service,
  ServiceCategory,
  User,
} from "../models/index.js";
import {
  toAvailabilityDTO,
  toBookingDTO,
  toServiceDTO,
} from "../dto/index.js";
import { AppError } from "../errors/AppError.js";
import type { CreateAvailabilityInput } from "@sbs/shared";

async function myServiceIds(userId: number) {
  const services = await Service.findAll({
    where: { providerId: userId },
    attributes: ["id"],
  });
  return services.map((s) => s.id);
}

export const providerController = {
  async requests(req: Request, res: Response, next: NextFunction) {
    try {
      const ids = await myServiceIds(req.user!.id);
      const rows = await Booking.findAll({
        where: { serviceId: { [Op.in]: ids }, status: "pending" },
        include: [
          { model: Service, as: "service", include: [{ model: User, as: "provider" }] },
          { model: User, as: "student" },
        ],
        order: [["startAt", "ASC"]],
      });
      res.json(rows.map((r) => toBookingDTO(r as never)));
    } catch (e) {
      next(e);
    }
  },

  async schedule(req: Request, res: Response, next: NextFunction) {
    try {
      const ids = await myServiceIds(req.user!.id);
      const rows = await AvailabilityBlock.findAll({
        where: { serviceId: { [Op.in]: ids } },
        order: [["startAt", "ASC"]],
      });
      res.json(rows.map(toAvailabilityDTO));
    } catch (e) {
      next(e);
    }
  },

  async addAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateAvailabilityInput;
      const service = await Service.findByPk(input.serviceId);
      if (!service) throw new AppError("NOT_FOUND", "Service not found");
      if (service.providerId !== req.user!.id) {
        throw new AppError("FORBIDDEN", "You do not own this service");
      }
      const created = await AvailabilityBlock.create({
        serviceId: input.serviceId,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        recurrenceRule: null,
      });
      res.status(201).json(toAvailabilityDTO(created));
    } catch (e) {
      next(e);
    }
  },

  async removeAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const row = await AvailabilityBlock.findByPk(id, {
        include: [{ model: Service, as: "service" }],
      });
      if (!row) throw new AppError("NOT_FOUND", "Availability block not found");
      const svc = (row as unknown as { service?: { providerId: number } }).service;
      if (svc?.providerId !== req.user!.id) {
        throw new AppError("FORBIDDEN", "You do not own this service");
      }
      await row.destroy();
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },

  async bookings(req: Request, res: Response, next: NextFunction) {
    try {
      const ids = await myServiceIds(req.user!.id);
      const rows = await Booking.findAll({
        where: { serviceId: { [Op.in]: ids } },
        include: [
          { model: Service, as: "service", include: [{ model: User, as: "provider" }] },
          { model: User, as: "student" },
        ],
        order: [["startAt", "ASC"]],
      });
      res.json(rows.map((r) => toBookingDTO(r as never)));
    } catch (e) {
      next(e);
    }
  },

  async myServices(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await Service.findAll({
        where: { providerId: req.user!.id },
        include: [
          { model: ServiceCategory, as: "category" },
          { model: User, as: "provider" },
        ],
        order: [["title", "ASC"]],
      });
      res.json(rows.map((r) => toServiceDTO(r as never)));
    } catch (e) {
      next(e);
    }
  },
};
