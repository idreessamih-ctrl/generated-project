import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { AppError } from './errorHandler';

type ValidationSchemas = {
  body?: z.ZodType<unknown>;
  query?: z.ZodType<unknown>;
  params?: z.ZodType<unknown>;
};

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          const details = result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          }));
          throw AppError.badRequest("Validation failed", details);
        }
        req.body = result.data;
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          const details = result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          }));
          throw AppError.badRequest("Validation failed", details);
        }
        req.query = result.data;
      }

      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          const details = result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          }));
          throw AppError.badRequest("Validation failed", details);
        }
        req.params = result.data;
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        next(AppError.badRequest("Validation failed", details));
      } else {
        next(error);
      }
    }
  };
};
</me>

<file path="src/middleware/rateLimiter.ts">
import rateLimit from "express-rate-limit";
import { AppError } from './errorHandler';

export const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "900000", 10),
  max: parseInt(process.env.RATE_LIMIT_MAX ?? "100", 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests("Too many requests, please try again later"));
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests("Too many authentication attempts, please try again later"));
  },
  skipSuccessfulRequests: true,
});