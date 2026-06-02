import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import { AppError } from '../errors/AppError';
import { TokenPayload, TokenType } from '../types/auth';

export class JWTUtils {
  private static getSecret(type: TokenType): string {
    return type === 'access'
      ? authConfig.jwt.accessToken.secret
      : authConfig.jwt.refreshToken.secret;
  }

  private static getExpiry(type: TokenType): string {
    return type === 'access'
      ? authConfig.jwt.accessToken.expiresIn
      : authConfig.jwt.refreshToken.expiresIn;
  }

  static sign(payload: Omit<TokenPayload, 'type'>, type: TokenType = 'access'): string {
    const secret = this.getSecret(type);
    const options: SignOptions = {
      algorithm: authConfig.jwt.accessToken.algorithm,
      expiresIn: this.getExpiry(type),
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
      subject: payload.userId,
    };

    return jwt.sign({ ...payload, type }, secret, options);
  }

  static verify(token: string, type: TokenType = 'access'): TokenPayload {
    const secret = this.getSecret(type);
    const options: VerifyOptions = {
      algorithms: [authConfig.jwt.accessToken.algorithm],
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience,
    };

    try {
      const decoded = jwt.verify(token, secret, options) as TokenPayload;

      if (decoded.type !== type) {
        throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
      }

      return decoded;
    } catch (error) {
      if (error instanceof AppError) throw error;

      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
      }
      throw new AppError('Token verification failed', 401, 'TOKEN_VERIFICATION_FAILED');
    }
  }

  static decode(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }
}