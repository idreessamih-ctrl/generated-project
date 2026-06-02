export const logger = {
  info: (message: string, data?: Record<string, unknown>): void => {
    const logEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...data,
    };
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },

  warn: (message: string, data?: Record<string, unknown>): void => {
    const logEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...data,
    };
    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.warn(`[WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },

  error: (message: string, data?: Record<string, unknown>): void => {
    const logEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...data,
    };
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(logEntry));
    } else {
      console.error(`[ERROR] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },

  debug: (message: string, data?: Record<string, unknown>): void => {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = {
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        ...data,
      };
      console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
};