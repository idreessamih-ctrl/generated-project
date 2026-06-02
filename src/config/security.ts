export const securityConfig = {
  jwt: {
    accessSecret: process.env.JWT_SECRET ?? "your-access-secret-key-change-in-production",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "your-refresh-secret-key-change-in-production",
    accessExpiry: process.env.JWT_EXPIRES_IN ?? "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "12", 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "900000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? "100", 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? "*",
  },
};