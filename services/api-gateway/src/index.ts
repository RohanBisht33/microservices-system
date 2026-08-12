import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { createApp } from './app.js';

async function main() {
  logger.info('Initializing API Gateway...');

  const app = createApp();

  const server = app.listen(config.PORT, () => {
    logger.info(`🚀 API Gateway is running on port ${config.PORT}`);
    logger.info(`📖 OpenAPI documentation available at http://localhost:${config.PORT}/api-docs`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    server.close(() => {
      logger.info('HTTP server closed. Gateway shutdown complete.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced exit due to shutdown timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error during API Gateway startup');
  process.exit(1);
});
