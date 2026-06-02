export const authConfig = {
  jwt: {
    accessToken: {
      secret: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-change-in-production',
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
      algorithm: 'HS256' as const,
    },
    refreshToken: {
      secret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production',
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
      algorithm: 'HS256' as const,
    },
    issuer: process.env.JWT_ISSUER || 'bookmark-manager-api',
    audience: process.env.JWT_AUDIENCE || 'bookmark-manager-app',
  },
  password: {
    saltRounds: 12,
    minLength: 8,
    maxLength: 128,
  },
  refreshToken: {
    length: 64,
    maxActiveTokens: 5,
  },
} as const;