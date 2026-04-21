import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from "sequelize";
import { AppError } from "../errors/AppError.js";
import type { ApiErrorBody } from "@sbs/shared";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      code: err.code,
      message: err.message,
      ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
    };
    return res.status(err.status).json(body);
  }

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    const body: ApiErrorBody = {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      fieldErrors,
    };
    return res.status(400).json(body);
  }

  if (err instanceof UniqueConstraintError) {
    const fieldErrors: Record<string, string> = {};
    for (const e of err.errors) fieldErrors[e.path || "_"] = "Must be unique";
    const body: ApiErrorBody = {
      code: "CONFLICT",
      message: "Duplicate value",
      fieldErrors,
    };
    return res.status(409).json(body);
  }

  if (err instanceof ForeignKeyConstraintError) {
    const body: ApiErrorBody = {
      code: "CONFLICT",
      message:
        "This record is referenced by other data and cannot be removed. Consider banning instead of deleting.",
    };
    return res.status(409).json(body);
  }

  if (err instanceof ValidationError) {
    const fieldErrors: Record<string, string> = {};
    for (const e of err.errors) fieldErrors[e.path || "_"] = e.message;
    const body: ApiErrorBody = {
      code: "VALIDATION_ERROR",
      message: "Invalid data",
      fieldErrors,
    };
    return res.status(400).json(body);
  }

  console.error("Unhandled error:", err);
  const body: ApiErrorBody = {
    code: "INTERNAL",
    message: "Something went wrong on our end",
  };
  return res.status(500).json(body);
}
