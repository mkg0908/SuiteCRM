import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../services/dashboardService.js', () => ({
  getDashboardSummary: vi.fn().mockResolvedValue({
    openCasesByStatus: { 'Open_New': 5, 'Open_Assigned': 3 },
    atRiskCount: 2,
    breachedCount: 1,
    casesByChannel: { Email: 8, WhatsApp: 3 },
    averageFirstResponseHours: 4.5,
    topCategories: [{ category: 'technical', count: 10 }],
    casesPerAgent: [{ agentId: 'a1', agentName: 'Alice', count: 4 }],
  }),
}));

import dashboardRoutes from './dashboardRoutes.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/caseflow', dashboardRoutes);
  return app;
}

describe('GET /api/caseflow/dashboard/summary', () => {
  it('returns dashboard summary with all required fields', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/caseflow/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body.openCasesByStatus).toBeDefined();
    expect(res.body.atRiskCount).toBeDefined();
    expect(res.body.breachedCount).toBeDefined();
    expect(res.body.casesByChannel).toBeDefined();
    expect(res.body.topCategories).toBeDefined();
    expect(res.body.casesPerAgent).toBeDefined();
  });

  it('includes open cases by status', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/caseflow/dashboard/summary');
    expect(res.body.openCasesByStatus['Open_New']).toBe(5);
    expect(res.body.openCasesByStatus['Open_Assigned']).toBe(3);
  });

  it('includes at-risk and breached counts', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/caseflow/dashboard/summary');
    expect(res.body.atRiskCount).toBe(2);
    expect(res.body.breachedCount).toBe(1);
  });

  it('includes channel grouping', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/caseflow/dashboard/summary');
    expect(res.body.casesByChannel['Email']).toBe(8);
    expect(res.body.casesByChannel['WhatsApp']).toBe(3);
  });

  it('includes average first response time', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/caseflow/dashboard/summary');
    expect(res.body.averageFirstResponseHours).toBe(4.5);
  });

  it('includes top categories', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/caseflow/dashboard/summary');
    expect(res.body.topCategories[0].category).toBe('technical');
  });

  it('includes cases per agent', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/caseflow/dashboard/summary');
    expect(res.body.casesPerAgent[0].agentName).toBe('Alice');
  });
});
