import { Router } from 'express';
import prisma from '../repositories/prismaClient.js';

export const healthzRouter = Router();

healthzRouter.get('/healthz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'degraded' });
  }
});
