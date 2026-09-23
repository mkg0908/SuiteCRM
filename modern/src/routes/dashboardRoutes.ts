import { Router, type Request, type Response, type NextFunction } from 'express';
import { getDashboardSummary } from '../services/dashboardService.js';

const router = Router();

router.get('/dashboard/summary', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await getDashboardSummary();
    return res.json(summary);
  } catch (err) {
    next(err);
  }
});

export default router;
