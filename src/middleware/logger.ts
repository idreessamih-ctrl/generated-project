import { Request, Response, NextFunction } from "express";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const originalEnd = res.end;

  res.end = function (this: Response, ...args: Parameters<typeof originalEnd>): Response {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id ?? "anonymous",
      timestamp: new Date().toISOString(),
    };

    if (res.statusCode >= 400) {
      console.error(JSON.stringify(logData));
    } else {
      console.log(JSON.stringify(logData));
    }

    return originalEnd.apply(this, args);
  } as typeof originalEnd;

  next();
};