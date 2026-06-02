export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public requestId?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): Record<string, unknown> {
    const errorObj: Record<string, unknown> = {
      code: this.code,
      message: this.message,
    };

    if (this.details && Object.keys(this.details).length > 0) {
      errorObj.details = this.details;
    }

    if (this.requestId) {
      errorObj.requestId = this.requestId;
    }

    return { error: errorObj };
  }

  public setRequestId(requestId: string): this {
    this.requestId = requestId;
    return this;
  }
}