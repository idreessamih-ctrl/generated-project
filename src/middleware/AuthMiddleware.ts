import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt';
import { UnauthorizedError } from '../errors/types';
import { TokenPayload } from '../types/auth';

export const authenticate = (options?: {
  required?: boolean;
  extractFrom?: ('header' | 'cookie')[];
  cookieName?: string;
}) => {
  const {
    required = true,
    extractFrom = ['header'],
    cookieName = 'access_token',
  } = options || {};

  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      let token: string | undefined;

      if (extractFrom.includes('header')) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token && extractFrom.includes('cookie')) {
        token = req.cookies?.[cookieName];
      }

      if (!token) {
        if (required) {
          throw new UnauthorizedError('No authentication token provided');
        }
        next();
        return;
      }

      const payload: TokenPayload = JWTUtils.verify(token, 'access');
      req.user = payload;

      next();
    } catch (error) {
      if (required) {
        next(error);
      } else {
        next();
      }
    }
  };
};

export const optionalAuth = authenticate({ required: false });

export const authenticateRefresh = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new UnauthorizedError('No refresh token provided');
    }

    req.body.refreshToken = refreshToken;

    next();
  } catch (error) {
    next(error);
  }
};

export const validateTokenPayload = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    next(new UnauthorizedError('User not authenticated'));
    return;
  }

  const { userId, email, roles } = req.user;

  if (!userId || !email || !Array.isArray(roles)) {
    next(new UnauthorizedError('Invalid token payload'));
    return;
  }

  next();
};