import { TokenPayload } from './auth';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      requestId?: string;
      correlationId?: string;
      startTime?: number;
      validatedQuery?: Record<string, unknown>;
      validatedParams?: Record<string, unknown>;
      validatedBody?: Record<string, unknown>;
    }

    interface Response {
      correlationId?: string;
    }
  }
}

export {};