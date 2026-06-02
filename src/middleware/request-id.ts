import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (options?: {
  headerName?: string;
  correlationHeaderName?: string;
  setHeader?: boolean;
}) => {
  const {
    headerName = 'X-Request-Id',
    correlationHeaderName = 'X-Correlation-Id',
    setHeader = true,
  } = options || {};

  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = uuidv4();
    req.requestId = requestId;

    const correlationId = (req.headers[correlationHeaderName.toLowerCase()] as string) || requestId;
    (req as Record<string, unknown>).correlationId = correlationId;
    (res as Record<string, unknown>).correlationId = correlationId;

    if (setHeader) {
      res.setHeader(headerName, requestId);
      res.setHeader(correlationHeaderName, correlationId);
    }

    (req as Record<string, unknown>).startTime = Date.now();

    next();
  };
};