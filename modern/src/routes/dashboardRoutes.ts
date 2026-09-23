import { Router } from 'express';
import { getDashboardSummary } from '../services/dashboardService.js';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', async (_req, res, next) => {
  try {
    const summary = await getDashboardSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});
