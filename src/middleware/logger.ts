import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData: Record<string, unknown> = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration,
      contentLength: res.getHeader('content-length'),
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      requestId: req.requestId,
      correlationId: (req as Record<string, unknown>).correlationId,
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP request completed with error', logData);
    } else {
      logger.info('HTTP request completed', logData);
    }
  });

  next();
};