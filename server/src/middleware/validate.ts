import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../errors/AppError.js";

type Source = "body" | "query" | "params";

export const validate =
  <T>(schema: ZodSchema<T>, source: Source = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".") || "_";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return next(
        new AppError("VALIDATION_ERROR", "Request validation failed", fieldErrors)
      );
    }
    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };
