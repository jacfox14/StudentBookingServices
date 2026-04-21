import type { ApiErrorCode } from "@sbs/shared";

const statusByCode: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    code: ApiErrorCode,
    message: string,
    fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = statusByCode[code];
    this.fieldErrors = fieldErrors;
  }
}
