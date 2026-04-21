import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import type { Role } from "../models/User.js";

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("UNAUTHENTICATED", "Not authenticated"));
    if (!roles.includes(req.user.role)) {
      return next(new AppError("FORBIDDEN", "You do not have access to this resource"));
    }
    next();
  };
