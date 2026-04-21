import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService.js";
import { toUserDTO } from "../dto/index.js";
import type { LoginInput, RegisterInput, ProfileUpdateInput } from "@sbs/shared";
import { AppError } from "../errors/AppError.js";
import { User } from "../models/User.js";

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body as LoginInput);
      res.json(result);
    } catch (e) {
      next(e);
    }
  },

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body as RegisterInput);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  },

  async logout(_req: Request, res: Response) {
    res.status(204).end();
  },
};

export const userController = {
  async me(req: Request, res: Response) {
    res.json(toUserDTO(req.user!));
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as ProfileUpdateInput;
      const user = req.user!;
      if (input.email !== user.email) {
        const existing = await User.unscoped().findOne({
          where: { email: input.email },
        });
        if (existing && existing.id !== user.id) {
          throw new AppError("CONFLICT", "Email already in use", {
            email: "This email is already taken",
          });
        }
      }
      user.firstName = input.firstName;
      user.lastName = input.lastName;
      user.email = input.email;
      await user.save();
      const fresh = (await User.findByPk(user.id))!;
      res.json(toUserDTO(fresh));
    } catch (e) {
      next(e);
    }
  },
};
