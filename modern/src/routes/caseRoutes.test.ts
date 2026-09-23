import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';
import { TransitionConflictError } from '../domain/cases/status.js';
import { NoActiveAgentsError } from '../domain/assignment/assignmentService.js';

// Mock services
vi.mock('../services/caseService.js', () => ({
  getCases: vi.fn().mockResolvedValue({
    items: [
      {
        id: 'uuid-1',
        caseNumber: 'CF-1001',
        subject: 'Test case',
        priority: 'P1',
        status: 'Open_New',
        state: 'Open',
        channel: 'Email',
        isAtRisk: false,
        isBreached: false,
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        customerEmail: null,
        customerPhone: null,
      }
    ],
    total: 1,
    page: 1,
    pageSize: 25,
  }),
  getCaseDetail: vi.fn().mockImplementation((caseNumber: string) => {
    if (caseNumber === 'CF-1001') {
      return Promise.resolve({
        id: 'uuid-1',
        caseNumber: 'CF-1001',
        subject: 'Test case',
        priority: 'P1',
        status: 'Open_New',
        state: 'Open',
        channel: 'Email',
        isAtRisk: false,
        isBreached: false,
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        updates: [],
        auditEvents: [],
        customerEmail: 'priya@riverahotels.com',
        customerPhone: '415-555-0142',
      });
    }
    return Promise.resolve(null);
  }),
  createNewCase: vi.fn().mockResolvedValue({
    id: 'uuid-2',
    caseNumber: 'CF-1002',
    subject: 'New case',
    priority: 'P2',
    status: 'Open_New',
    state: 'Open',
    channel: 'Manual',
    isAtRisk: false,
    isBreached: false,
    dateCreated: new Date().toISOString(),
    dateModified: new Date().toISOString(),
  }),
  editCase: vi.fn().mockResolvedValue({ caseNumber: 'CF-1001', subject: 'Updated' }),
  transitionCaseStatus: vi.fn().mockImplementation((caseNumber: string, status: string) => {
    if (status === 'Open_Pending Input') {
      throw new TransitionConflictError('Open_New', 'Open_Pending Input');
    }
    return Promise.resolve({ caseNumber, status });
  }),
  addCaseUpdate: vi.fn().mockResolvedValue({
    id: 'update-1',
    caseId: 'uuid-1',
    author: 'Agent',
    text: 'Update text',
    timestamp: new Date().toISOString(),
    internal: false,
  }),
}));

vi.mock('../domain/privacy/privacyMapper.js', () => ({
  applyContactMasking: vi.fn((data: Record<string, unknown>, role: string) => {
    if (role === 'agent') {
      return {
        ...data,
        customerEmail: data.customerEmail ? 'p•••@riverahotels.com' : data.customerEmail,
        customerPhone: data.customerPhone ? '415-555-••••' : data.customerPhone,
      };
    }
    return data;
  }),
  maskContactsForRole: vi.fn((items: unknown[], _role: string) => items),
}));

import caseRoutes from './caseRoutes.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as unknown as { session: Record<string, unknown> }).session = { role: 'agent' };
    next();
  });
  app.use('/api/caseflow', caseRoutes);
  // Error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof TransitionConflictError) {
      return res.status(409).json({ error: 'transition_conflict', message: err.message });
    }
    return res.status(500).json({ error: 'internal_error' });
  });
  return app;
}

describe('GET /api/caseflow/cases', () => {
  it('returns case list with default pagination', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/caseflow/cases');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.pageSize).toBe(25);
  });

  it('respects pageSize parameter up to 100', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/caseflow/cases?pageSize=50');
    expect(res.status).toBe(200);
  });

  it('rejects pageSize > 100', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/caseflow/cases?pageSize=200');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/caseflow/cases/CF-1001', () => {
  it('returns case detail', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/caseflow/cases/CF-1001');
    expect(res.status).toBe(200);
    expect(res.body.caseNumber).toBe('CF-1001');
  });

  it('returns 404 for unknown case', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/caseflow/cases/CF-9999');
    expect(res.status).toBe(404);
  });

  it('masks email/phone for agent role', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/caseflow/cases/CF-1001');
    expect(res.status).toBe(200);
    expect(res.body.customerEmail).toBe('p•••@riverahotels.com');
    expect(res.body.customerPhone).toBe('415-555-••••');
  });
});

describe('POST /api/caseflow/cases', () => {
  it('creates a case and returns 201', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/caseflow/cases')
      .send({ subject: 'Test', priority: 'P2', channel: 'Email' });
    expect(res.status).toBe(201);
    expect(res.body.caseNumber).toBeTruthy();
  });

  it('rejects missing subject with 400', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/caseflow/cases')
      .send({ priority: 'P2' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/caseflow/cases/CF-1001/status', () => {
  it('returns 409 for Open_New to Open_Pending Input transition', async () => {
    const app = createTestApp();
    const res = await request(app)
      .patch('/api/caseflow/cases/CF-1001/status')
      .send({ status: 'Open_Pending Input', userId: 'user-1' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('transition_conflict');
  });
});

describe('POST /api/caseflow/cases/CF-1001/updates', () => {
  it('creates a threaded update', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/caseflow/cases/CF-1001/updates')
      .send({ author: 'Agent Smith', text: 'Update text', internal: false });
    expect(res.status).toBe(201);
    expect(res.body.author).toBe('Agent');
  });
});
