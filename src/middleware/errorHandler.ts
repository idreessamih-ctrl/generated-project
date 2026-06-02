export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details: unknown | null;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = "INTERNAL_ERROR",
    details: unknown | null = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, "VALIDATION_ERROR", details);
  }

  static unauthorized(message: string = "Authentication required"): AppError {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message: string = "Insufficient permissions"): AppError {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static notFound(message: string = "Resource not found"): AppError {
    return new AppError(message, 404, "NOT_FOUND");
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, "CONFLICT");
  }

  static tooManyRequests(message: string = "Too many requests"): AppError {
    return new AppError(message, 429, "RATE_LIMIT_EXCEEDED");
  }

  static internal(message: string = "Internal server error"): AppError {
    return new AppError(message, 500, "INTERNAL_ERROR");
  }
}

interface ErrorResponse {
  status: number;
  code: string;
  message: string;
  timestamp: string;
  details?: unknown;
  stack?: string;
}

export const errorHandler = (
  err: Error,
  _req: import("express").Request,
  res: import("express").Response,
  _next: import("express").NextFunction
): void => {
  console.error({
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });

  if (res.headersSent) {
    return;
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const errorCode = err instanceof AppError ? err.errorCode : "INTERNAL_ERROR";
  const message = err instanceof AppError ? err.message : "An unexpected error occurred";

  const errorResponse: ErrorResponse = {
    status: statusCode,
    code: errorCode,
    message,
    timestamp: new Date().toISOString(),
  };

  if (err instanceof AppError && err.details) {
    errorResponse.details = err.details;
  }

  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};