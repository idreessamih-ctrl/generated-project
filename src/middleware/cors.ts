import cors from 'cors';
import { corsConfig } from '../config/cors';

export const corsMiddleware = cors(corsConfig);

export const dynamicCorsMiddleware = (allowedOrigins?: string[]) => {
  return cors({
    ...corsConfig,
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const origins = allowedOrigins || ['http://localhost:3000', 'http://localhost:5173'];

      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  });
};