import type { Request, Response, NextFunction } from "express";
import { Notification } from "../models/index.js";
import { toNotificationDTO } from "../dto/index.js";
import { AppError } from "../errors/AppError.js";

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await Notification.findAll({
        where: { userId: req.user!.id },
        order: [["createdAt", "DESC"]],
      });
      res.json(rows.map(toNotificationDTO));
    } catch (e) {
      next(e);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const row = await Notification.findByPk(id);
      if (!row) throw new AppError("NOT_FOUND", "Notification not found");
      if (row.userId !== req.user!.id) {
        throw new AppError("FORBIDDEN", "Not your notification");
      }
      if (!row.readAt) {
        row.readAt = new Date();
        await row.save();
      }
      res.json(toNotificationDTO(row));
    } catch (e) {
      next(e);
    }
  },
};
