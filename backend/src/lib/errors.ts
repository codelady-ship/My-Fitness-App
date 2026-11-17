export type ErrorCode =
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ErrorDetail = { path: string; message: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public details?: ErrorDetail[],
  ) {
    super(message);
  }

  static badRequest(message = "Bad request") {
    return new ApiError(400, "BAD_REQUEST", message);
  }
  static unauthorized(message = "Authentication required") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "You do not have permission to do this") {
    return new ApiError(403, "FORBIDDEN", message);
  }
  static notFound(what = "Resource") {
    return new ApiError(404, "NOT_FOUND", `${what} not found`);
  }
  static conflict(message: string) {
    return new ApiError(409, "CONFLICT", message);
  }
}
