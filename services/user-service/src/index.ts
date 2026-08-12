import { PrismaClient } from '@prisma/client';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { createApp } from './app.js';
import { NatsEventPublisher } from './events/nats-publisher.js';

const prisma = new PrismaClient();
const publisher = new NatsEventPublisher();

async function main() {
  logger.info('Initializing User Service dependencies...');

  // Connect database
  await prisma.$connect();
  logger.info('Database connection established');

  // Connect NATS Event Publisher
  try {
    await publisher.connect();
    logger.info('NATS Event Publisher connected');
  } catch (err) {
    logger.warn({ err }, 'NATS connection pending; publisher will retry on demand');
  }

  const app = createApp(prisma, publisher);

  const server = app.listen(config.PORT, () => {
    logger.info(`User Service is running on port ${config.PORT}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        await publisher.disconnect();
        logger.info('NATS publisher disconnected');
      } catch (err) {
        logger.error({ err }, 'Error disconnecting NATS publisher');
      }

      try {
        await prisma.$disconnect();
        logger.info('Database connection closed');
      } catch (err) {
        logger.error({ err }, 'Error disconnecting database');
      }

      logger.info('Graceful shutdown completed');
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
  logger.error({ err }, 'Fatal error during User Service startup');
  process.exit(1);
});
