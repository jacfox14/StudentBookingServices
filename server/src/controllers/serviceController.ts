import type { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import {
  Service,
  ServiceCategory,
  User,
  AvailabilityBlock,
  Booking,
} from "../models/index.js";
import { toServiceDTO, toCategoryDTO, toAvailabilityDTO } from "../dto/index.js";
import { AppError } from "../errors/AppError.js";

export const serviceController = {
  async categories(_req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await ServiceCategory.findAll({ order: [["name", "ASC"]] });
      res.json(rows.map(toCategoryDTO));
    } catch (e) {
      next(e);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string | undefined)?.trim();
      const categoryId = req.query.categoryId
        ? Number(req.query.categoryId)
        : undefined;
      const where: Record<string, unknown> = { isActive: true };
      if (categoryId) where.categoryId = categoryId;
      if (q) {
        where[Op.or as unknown as string] = [
          { title: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
          { location: { [Op.like]: `%${q}%` } },
        ];
      }
      const rows = await Service.findAll({
        where,
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

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const row = await Service.findByPk(id, {
        include: [
          { model: ServiceCategory, as: "category" },
          { model: User, as: "provider" },
        ],
      });
      if (!row) throw new AppError("NOT_FOUND", "Service not found");
      res.json(toServiceDTO(row as never));
    } catch (e) {
      next(e);
    }
  },

  async availability(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      if (!from || !to) {
        throw new AppError("VALIDATION_ERROR", "`from` and `to` query params are required");
      }
      const fromDate = new Date(from);
      const toDate = new Date(to);
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        throw new AppError("VALIDATION_ERROR", "Invalid date range");
      }

      const service = await Service.findByPk(id);
      if (!service) throw new AppError("NOT_FOUND", "Service not found");

      const blocks = await AvailabilityBlock.findAll({
        where: {
          serviceId: id,
          startAt: { [Op.gte]: fromDate },
          endAt: { [Op.lte]: toDate },
        },
        order: [["startAt", "ASC"]],
      });

      const bookings = await Booking.findAll({
        where: {
          serviceId: id,
          status: { [Op.in]: ["pending", "approved"] },
          startAt: { [Op.lt]: toDate },
          endAt: { [Op.gt]: fromDate },
        },
      });

      const free = blocks.filter((b) => {
        return !bookings.some(
          (bk) =>
            bk.startAt.getTime() < b.endAt.getTime() &&
            bk.endAt.getTime() > b.startAt.getTime()
        );
      });

      res.json(free.map(toAvailabilityDTO));
    } catch (e) {
      next(e);
    }
  },
};
