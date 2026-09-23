import { createApp } from './app.js';
import { logger } from './observability/logger.js';

const port = parseInt(process.env.PORT || '3000', 10);
const app = createApp();

app.listen(port, () => {
  logger.info(`CaseFlow server listening on port ${port}`);
});
