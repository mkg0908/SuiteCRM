import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { healthzRouter } from './routes/healthzRoutes.js';
import { sessionRouter } from './routes/sessionRoutes.js';
import { caseRouter } from './routes/caseRoutes.js';
import { intakeRouter } from './routes/intakeRoutes.js';
import { dashboardRouter } from './routes/dashboardRoutes.js';
import { openapiRouter } from './routes/openapiRoutes.js';
import { demoRouter } from './routes/demoRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    }),
  );

  const useDemoMode = !process.env.DATABASE_URL;

  if (useDemoMode) {
    // Demo mode: in-memory data, no database required
    app.get('/healthz', (_req, res) => res.json({ status: 'ok', mode: 'demo' }));
    app.use('/api/caseflow', demoRouter);
  } else {
    // Production mode: PostgreSQL via Prisma
    app.use('/', healthzRouter);
    app.use('/api/caseflow/session', sessionRouter);
    app.use('/api/caseflow/cases', caseRouter);
    app.use('/api/caseflow/intake', intakeRouter);
    app.use('/api/caseflow/dashboard', dashboardRouter);
    app.use('/api/caseflow', openapiRouter);
  }

  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/healthz') {
      return next();
    }
    res.sendFile(path.join(publicPath, 'index.html'), err => {
      if (err) next();
    });
  });

  app.use(errorHandler);

  return app;
}
