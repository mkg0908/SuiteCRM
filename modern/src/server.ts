import 'dotenv/config';
import { createApp } from './app.js';
import { logger } from './observability/logger.js';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

async function main() {
  const app = createApp();

  const server = app.listen(PORT, () => {
    logger.info(`CaseFlow server listening on port ${PORT}`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

main().catch((err) => {
  logger.error('Failed to start server', { message: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
