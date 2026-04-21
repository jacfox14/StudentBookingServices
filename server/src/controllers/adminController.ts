import type { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import {
  User,
  Service,
  ServiceCategory,
  Booking,
  AuditLog,
} from "../models/index.js";
import { toUserDTO, toServiceDTO } from "../dto/index.js";
import { AppError } from "../errors/AppError.js";
import type { CreateServiceInput } from "@sbs/shared";

const dayKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const subDays = (d: Date, days: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - days);
  return copy;
};

const startOfWeekMonday = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diff = (day + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  return copy;
};

export const adminController = {
  async users(_req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await User.findAll({ order: [["createdAt", "DESC"]] });
      res.json(rows.map(toUserDTO));
    } catch (e) {
      next(e);
    }
  },

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const user = await User.findByPk(id);
      if (!user) throw new AppError("NOT_FOUND", "User not found");
      const { isBanned, role, firstName, lastName, email } = req.body ?? {};
      if (typeof isBanned === "boolean") user.isBanned = isBanned;
      if (role && ["student", "staff", "admin"].includes(role)) user.role = role;
      if (typeof firstName === "string") user.firstName = firstName;
      if (typeof lastName === "string") user.lastName = lastName;
      if (typeof email === "string") user.email = email;
      await user.save();
      await AuditLog.create({
        actorId: req.user!.id,
        action: "user.update",
        targetType: "User",
        targetId: user.id,
        meta: { isBanned, role },
      });
      res.json(toUserDTO(user));
    } catch (e) {
      next(e);
    }
  },

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const user = await User.findByPk(id);
      if (!user) throw new AppError("NOT_FOUND", "User not found");
      await user.destroy();
      await AuditLog.create({
        actorId: req.user!.id,
        action: "user.delete",
        targetType: "User",
        targetId: id,
      });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },

  async services(_req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await Service.findAll({
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

  async createService(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateServiceInput;
      const provider = await User.findByPk(input.providerId);
      if (!provider || provider.role !== "staff") {
        throw new AppError("VALIDATION_ERROR", "Provider must be a staff user", {
          providerId: "Must reference a staff user",
        });
      }
      const category = await ServiceCategory.findByPk(input.categoryId);
      if (!category) {
        throw new AppError("VALIDATION_ERROR", "Category not found", {
          categoryId: "Unknown category",
        });
      }
      const created = await Service.create({
        categoryId: input.categoryId,
        providerId: input.providerId,
        title: input.title,
        description: input.description,
        location: input.location,
        durationMinutes: input.durationMinutes,
        isActive: input.isActive ?? true,
      });
      const full = await Service.findByPk(created.id, {
        include: [
          { model: ServiceCategory, as: "category" },
          { model: User, as: "provider" },
        ],
      });
      res.status(201).json(toServiceDTO(full as never));
    } catch (e) {
      next(e);
    }
  },

  async updateService(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const svc = await Service.findByPk(id);
      if (!svc) throw new AppError("NOT_FOUND", "Service not found");
      const input = req.body as CreateServiceInput;
      svc.categoryId = input.categoryId;
      svc.providerId = input.providerId;
      svc.title = input.title;
      svc.description = input.description;
      svc.location = input.location;
      svc.durationMinutes = input.durationMinutes;
      if (typeof input.isActive === "boolean") svc.isActive = input.isActive;
      await svc.save();
      const full = await Service.findByPk(svc.id, {
        include: [
          { model: ServiceCategory, as: "category" },
          { model: User, as: "provider" },
        ],
      });
      res.json(toServiceDTO(full as never));
    } catch (e) {
      next(e);
    }
  },

  async deleteService(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const svc = await Service.findByPk(id);
      if (!svc) throw new AppError("NOT_FOUND", "Service not found");
      await svc.destroy();
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },

  async reportsSummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const weekStart = startOfWeekMonday(new Date());
      const [
        totalUsers,
        totalBookings,
        totalServices,
        pendingRequests,
        approvedThisWeek,
        activeProviders,
      ] = await Promise.all([
        User.count(),
        Booking.count(),
        Service.count({ where: { isActive: true } }),
        Booking.count({ where: { status: "pending" } }),
        Booking.count({
          where: { status: "approved", updatedAt: { [Op.gte]: weekStart } },
        }),
        User.count({ where: { role: "staff", isBanned: false } }),
      ]);
      res.json({
        totalUsers,
        totalBookings,
        totalServices,
        pendingRequests,
        approvedThisWeek,
        activeProviders,
      });
    } catch (e) {
      next(e);
    }
  },

  async reportsBookings(_req: Request, res: Response, next: NextFunction) {
    try {
      const since = subDays(new Date(), 13);
      const rows = await Booking.findAll({
        where: { createdAt: { [Op.gte]: since } },
        attributes: ["createdAt"],
      });
      const counts = new Map<string, number>();
      for (let i = 13; i >= 0; i--) {
        const d = subDays(new Date(), i);
        counts.set(dayKey(d), 0);
      }
      for (const r of rows) {
        const key = dayKey(r.createdAt);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const out = Array.from(counts.entries()).map(([date, count]) => ({
        date,
        count,
      }));
      res.json(out);
    } catch (e) {
      next(e);
    }
  },
};
