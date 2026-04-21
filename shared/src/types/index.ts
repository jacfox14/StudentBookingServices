export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

export interface ApiErrorShape {
  code: ApiErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
}
