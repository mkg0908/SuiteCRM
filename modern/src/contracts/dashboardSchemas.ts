import { z } from 'zod';

export const DashboardSummarySchema = z.object({
  openByStatus: z.record(z.string(), z.number()),
  atRiskCount: z.number(),
  breachedCount: z.number(),
  byChannel: z.record(z.string(), z.number()),
  avgFirstResponseMs: z.number().nullable(),
  topCategories: z.array(
    z.object({
      category: z.string(),
      count: z.number(),
    }),
  ),
  casesPerAgent: z.array(
    z.object({
      agentId: z.string(),
      agentName: z.string(),
      count: z.number(),
    }),
  ),
});

export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
