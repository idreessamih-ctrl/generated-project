import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from './errorHandler';
import { securityConfig } from '../config/security';

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  type: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: string[];
      };
    }
  }
}

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthorized("Missing or invalid authorization header");
    }

    const token = authHeader.split(" ")[1] as string;

    const decoded = jwt.verify(token, securityConfig.jwt.accessSecret) as JwtPayload;

    if (decoded.type !== "access") {
      throw AppError.unauthorized("Invalid token type");
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      roles: decoded.roles,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(AppError.unauthorized("Token expired"));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(AppError.unauthorized("Invalid token"));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1] as string;
      const decoded = jwt.verify(token, securityConfig.jwt.accessSecret) as JwtPayload;

      if (decoded.type === "access") {
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          roles: decoded.roles,
        };
      }
    }
  } catch {
    // Silent fail for optional auth
  }

  next();
};