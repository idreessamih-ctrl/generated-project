import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestIdMiddleware } from './middleware/request-id';
import { globalRateLimiter } from './middleware/rate-limit';
import { corsMiddleware } from './middleware/cors';
import { securityHeadersMiddleware } from './middleware/security-headers';
import { loggerMiddleware } from './middleware/logger';
import { errorHandler } from './middleware/error-handler';
import { indexRoutes } from './routes/IndexRoutes';

const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(securityHeadersMiddleware);
app.use(requestIdMiddleware());
app.use(loggerMiddleware);
app.use(globalRateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api', indexRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  errorHandler(err, req, res, _next);
});

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;