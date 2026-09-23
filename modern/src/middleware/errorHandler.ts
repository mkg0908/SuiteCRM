import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../observability/logger.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'validation_error',
      message: 'Request validation failed',
      details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  switch (err.name) {
    case 'TransitionConflictError':
      res.status(409).json({ error: 'transition_conflict', message: err.message });
      return;
    case 'CaseNotFoundError':
      res.status(404).json({ error: 'not_found', message: err.message });
      return;
    case 'NoActiveAgentError':
      res.status(409).json({ error: 'no_active_agents', message: err.message });
      return;
  }

  logger.error('Unhandled error', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred' });
}
