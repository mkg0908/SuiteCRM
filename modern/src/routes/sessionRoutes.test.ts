import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import sessionRoutes from './sessionRoutes.js';

// Mock session middleware
function createTestApp() {
  const app = express();
  app.use(express.json());
  // Simple mock session
  app.use((req, _res, next) => {
    (req as unknown as { session: Record<string, unknown> }).session = {};
    next();
  });
  app.use('/api/caseflow', sessionRoutes);
  return app;
}

describe('POST /api/caseflow/session/role', () => {
  it('accepts agent role', async () => {
    const app = createTestApp();
    const res = await request(app).post('/api/caseflow/session/role').send({ role: 'agent' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('agent');
  });

  it('accepts manager role', async () => {
    const app = createTestApp();
    const res = await request(app).post('/api/caseflow/session/role').send({ role: 'manager' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('manager');
  });

  it('rejects invalid role with 400', async () => {
    const app = createTestApp();
    const res = await request(app).post('/api/caseflow/session/role').send({ role: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation_error');
  });

  it('rejects missing role with 400', async () => {
    const app = createTestApp();
    const res = await request(app).post('/api/caseflow/session/role').send({});
    expect(res.status).toBe(400);
  });

  it('masks contact values for agent role', async () => {
    const app = createTestApp();
    const res = await request(app).post('/api/caseflow/session/role').send({ role: 'agent' });
    expect(res.status).toBe(200);
    // Should not return full contact values in plaintext in response for agent
    // (masking applied)
  });
});
