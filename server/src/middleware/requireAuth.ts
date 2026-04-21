import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/User.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const header = req.header("authorization") || req.header("Authorization");
    if (!header || !header.toLowerCase().startsWith("bearer ")) {
      throw new AppError("UNAUTHENTICATED", "Missing bearer token");
    }
    const token = header.slice(7).trim();
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      throw new AppError("UNAUTHENTICATED", "Invalid or expired token");
    }
    const user = await User.findByPk(decoded.sub);
    if (!user) {
      throw new AppError("UNAUTHENTICATED", "User no longer exists");
    }
    if (user.isBanned) {
      throw new AppError("UNAUTHENTICATED", "Account is banned");
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
