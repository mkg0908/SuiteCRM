import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';

vi.mock('../services/intakeService.js', () => ({
  processEmailIntake: vi.fn().mockResolvedValue({
    casesCreated: 1,
    subject: 'Test Subject',
    channel: 'Email',
    caseNumber: 'CF-1001',
    maskedEmail: 'p•••@riverahotels.com',
    maskedPhone: null,
  }),
  processWhatsAppIntake: vi.fn().mockResolvedValue({
    messagesRead: 10,
    casesCreated: 3,
    updatesAttached: 1,
    chatterSkipped: 2,
    spamHeld: 1,
    piiMasked: 2,
  }),
}));

import intakeRoutes from './intakeRoutes.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as unknown as { session: Record<string, unknown> }).session = { role: 'agent' };
    next();
  });
  app.use('/api/caseflow', intakeRoutes);
  return app;
}

describe('POST /api/caseflow/intake/email', () => {
  it('processes email text content', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/caseflow/intake/email')
      .send({ content: 'Subject: Test Subject\n\nBody content here' });
    expect(res.status).toBe(200);
    expect(res.body.casesCreated).toBe(1);
    expect(res.body.channel).toBe('Email');
  });

  it('returns 400 for empty content', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/caseflow/intake/email')
      .send({ content: '' });
    expect(res.status).toBe(400);
  });

  it('returns masked contact in summary for agent role', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/caseflow/intake/email')
      .send({ content: 'Subject: Test\n\nFrom: priya@riverahotels.com\nBody' });
    expect(res.status).toBe(200);
    expect(res.body.maskedEmail).toBe('p•••@riverahotels.com');
  });
});

describe('POST /api/caseflow/intake/whatsapp', () => {
  it('processes WhatsApp text', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/caseflow/intake/whatsapp')
      .send({ content: '[01/15/2024, 10:00:00] Sofia Reyes: My order is urgent!' });
    expect(res.status).toBe(200);
    expect(res.body.messagesRead).toBe(10);
    expect(res.body.casesCreated).toBe(3);
    expect(res.body.spamHeld).toBe(1);
  });

  it('returns 400 for empty content', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/caseflow/intake/whatsapp')
      .send({ content: '   ' });
    expect(res.status).toBe(400);
  });
});
