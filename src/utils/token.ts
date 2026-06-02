import crypto from 'crypto';
import { authConfig } from '../config/auth';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export class TokenUtils {
  static generateTokenPair(userId: string, email: string, roles: string[]): TokenPair {
    const { JWTUtils } = require('./jwt');

    const accessToken = JWTUtils.sign(
      { userId, email, roles },
      'access'
    );

    const refreshToken = this.generateRefreshToken();

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpiresInSeconds('access'),
      tokenType: 'Bearer',
    };
  }

  static generateRefreshToken(): string {
    return crypto.randomBytes(authConfig.refreshToken.length).toString('hex');
  }

  static hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static getExpiresInSeconds(type: 'access' | 'refresh'): number {
    const expiry = type === 'access'
      ? authConfig.jwt.accessToken.expiresIn
      : authConfig.jwt.refreshToken.expiresIn;

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }

  static validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < authConfig.password.minLength) {
      errors.push(`Password must be at least ${authConfig.password.minLength} characters`);
    }
    if (password.length > authConfig.password.maxLength) {
      errors.push(`Password must be at most ${authConfig.password.maxLength} characters`);
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}