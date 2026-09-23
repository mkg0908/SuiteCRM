import {
  getOpenCasesByStatus,
  getAtRiskCount,
  getBreachedCount,
  getCasesByChannel,
  getAverageFirstResponseHours,
  getTopCategories,
  getCasesPerAgent,
} from '../repositories/dashboardRepository.js';
import type { DashboardSummary } from '../contracts/dashboardSchemas.js';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [
    openCasesByStatus,
    atRiskCount,
    breachedCount,
    casesByChannel,
    averageFirstResponseHours,
    topCategories,
    casesPerAgent,
  ] = await Promise.all([
    getOpenCasesByStatus(),
    getAtRiskCount(),
    getBreachedCount(),
    getCasesByChannel(),
    getAverageFirstResponseHours(),
    getTopCategories(),
    getCasesPerAgent(),
  ]);

  return {
    openCasesByStatus,
    atRiskCount,
    breachedCount,
    casesByChannel,
    averageFirstResponseHours,
    topCategories,
    casesPerAgent,
  };
}
