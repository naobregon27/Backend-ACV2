import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env, corsOriginsList } from './config';
import { apiV1Router } from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { ApiError } from './utils/ApiError';
import { swaggerSpec } from './swagger';

/**
 * Límite de body JSON para el endpoint de subida de media.
 * Base64 ocupa ~4/3 del binario. El límite máximo seguro para MongoDB
 * es ~15 MB binario → ~20 MB en base64 + overhead JSON.
 */
const MONGO_SAFE_BYTES = 15 * 1024 * 1024;
const adminMediaUploadJsonLimitBytes = Math.ceil((MONGO_SAFE_BYTES * 4) / 3) + 512 * 1024;

export function createApp(): express.Application {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());
  app.use(
    cors({
      origin: corsOriginsList.length ? corsOriginsList : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use((req, res, next) => {
    if (req.method === 'POST' && req.path === '/api/v1/admin/media/upload') {
      return express.json({ limit: adminMediaUploadJsonLimitBytes })(req, res, next);
    }
    return express.json({ limit: '2mb' })(req, res, next);
  });
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api/v1', apiV1Router);

  app.use((_req, _res, next) => {
    next(new ApiError(404, 'NOT_FOUND', 'Ruta no encontrada'));
  });
  app.use(errorMiddleware);

  return app;
}
