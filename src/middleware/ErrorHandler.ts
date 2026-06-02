import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { InternalError, ValidationError } from '../errors/types';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const startTime = (req as Record<string, unknown>).startTime as number || Date.now();
  const duration = Date.now() - startTime;

  logError(err, req, duration);

  if (!(err instanceof AppError)) {
    if (err.name === 'ZodError' || err.name === 'ValidationError') {
      err = new ValidationError(err.message);
    } else if (err.message.includes('CORS')) {
      err = new (require('../errors/types').ForbiddenError)('Cross-origin request blocked');
    } else {
      err = new InternalError();
    }
  }

  const appError = err as AppError;

  if (req.requestId) {
    appError.setRequestId(req.requestId);
  }

  const statusCode = appError.statusCode;
  const errorResponse = appError.toJSON();

  if (req.correlationId) {
    (errorResponse.error as Record<string, unknown>).correlationId = req.correlationId;
  }

  res.setHeader('X-Request-Id', req.requestId || '');
  res.setHeader('X-Error-Code', appError.code);

  res.status(statusCode).json(errorResponse);
};

const logError = (err: Error, req: Request, duration: number): void => {
  const logData: Record<string, unknown> = {
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    request: {
      method: req.method,
      url: req.originalUrl || req.url,
      requestId: req.requestId,
      correlationId: (req as Record<string, unknown>).correlationId,
    },
    duration,
    timestamp: new Date().toISOString(),
  };

  if (err instanceof AppError && err.isOperational) {
    logger.warn('Operational error', logData);
  } else {
    logger.error('Unexpected error', logData);
  }
};