import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { rateLimitConfig } from '../config/rate-limit';
import { AppError } from '../errors/AppError';

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: Record<string, unknown>;
  keyGenerator?: (req: Request) => string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
}

export const createRateLimiter = (options: RateLimitOptions = {}) => {
  const {
    windowMs = (rateLimitConfig.global as { windowMs: number; max: number }).windowMs,
    max = (rateLimitConfig.global as { windowMs: number; max: number }).max,
    message = (rateLimitConfig.global as { message?: Record<string, unknown> }).message,
    keyGenerator,
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
  } = options;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: message,
    keyGenerator: keyGenerator || ((req: Request) => {
      return req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
    }),
    skipFailedRequests,
    skipSuccessfulRequests,
    handler: (req: Request, res: Response, next: NextFunction) => {
      next(new AppError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED'));
    },
  });
};

export const globalRateLimiter = createRateLimiter({
  windowMs: (rateLimitConfig.global as { windowMs: number }).windowMs,
  max: (rateLimitConfig.global as { max: number }).max,
});

const authConfig = rateLimitConfig.auth as Record<string, RateLimitOptions>;

export const loginRateLimiter = createRateLimiter({
  ...authConfig.login,
  skipSuccessfulRequests: true,
});

export const registerRateLimiter = createRateLimiter({
  ...authConfig.register,
  keyGenerator: (req) => {
    return `${req.ip}-${(req.body as { email?: string })?.email || 'unknown'}`;
  },
});