import express, { type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';
import { TransitionConflictError } from './domain/cases/status.js';
import { NoActiveAgentsError } from './domain/assignment/assignmentService.js';
import { logger } from './observability/logger.js';
import { getPrismaClient } from './repositories/prismaClient.js';
import { generateOpenApiDocument } from './contracts/openapi.js';
import sessionRoutes from './routes/sessionRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import intakeRoutes from './routes/intakeRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Health check - before session middleware
  app.get('/healthz', async (_req: Request, res: Response) => {
    try {
      const prisma = getPrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok' });
    } catch (_err) {
      res.status(503).json({ status: 'degraded' });
    }
  });

  // OpenAPI doc
  app.get('/api/caseflow/openapi.json', (_req: Request, res: Response) => {
    res.json(generateOpenApiDocument());
  });

  // Routes
  app.use('/api/caseflow', sessionRoutes);
  app.use('/api/caseflow', caseRoutes);
  app.use('/api/caseflow', intakeRoutes);
  app.use('/api/caseflow', dashboardRoutes);

  // Error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Request validation failed',
        details: err.errors,
      });
    }

    if (err instanceof TransitionConflictError) {
      return res.status(409).json({
        error: 'transition_conflict',
        message: err.message,
        from: err.from,
        to: err.to,
      });
    }

    if (err instanceof NoActiveAgentsError) {
      return res.status(409).json({
        error: 'no_active_agents',
        message: err.message,
      });
    }

    if (err instanceof Error && err.message === 'Case not found') {
      return res.status(404).json({ error: 'not_found', message: 'Case not found' });
    }

    logger.error('Unhandled error', { message: err instanceof Error ? err.message : 'Unknown error' });
    return res.status(500).json({ error: 'internal_error', message: 'An internal error occurred' });
  });

  return app;
}
