export interface RateLimitConfig {
  windowMs: number;
  max: number;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  message?: Record<string, unknown>;
}

export const rateLimitConfig: Record<string, RateLimitConfig | Record<string, RateLimitConfig>> = {
  global: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    },
  },
  auth: {
    login: {
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many login attempts. Please try again in 15 minutes.',
        },
      },
    },
    register: {
      windowMs: 60 * 60 * 1000,
      max: 3,
      message: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many registration attempts. Please try again later.',
        },
      },
    },
  },
};