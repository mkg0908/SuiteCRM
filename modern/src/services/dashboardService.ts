import * as dashboardRepo from '../repositories/dashboardRepository.js';
import type { DashboardSummary } from '../contracts/dashboardSchemas.js';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [openByStatus, atRiskCount, breachedCount, byChannel, avgFirstResponseMs, topCategories, casesPerAgent] =
    await Promise.all([
      dashboardRepo.getOpenCasesByStatus(),
      dashboardRepo.getAtRiskCount(),
      dashboardRepo.getBreachedCount(),
      dashboardRepo.getCasesByChannel(),
      dashboardRepo.getAvgFirstResponseMs(),
      dashboardRepo.getTopCategories(),
      dashboardRepo.getCasesPerAgent(),
    ]);

  return { openByStatus, atRiskCount, breachedCount, byChannel, avgFirstResponseMs, topCategories, casesPerAgent };
}
