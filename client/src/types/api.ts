import type { ApiErrorShape, ApiErrorCode } from "@shared/types";

export type { ApiErrorCode, ApiErrorShape };

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(body: ApiErrorShape, status: number) {
    super(body.message);
    this.code = body.code;
    this.status = status;
    this.fieldErrors = body.fieldErrors;
  }
}
