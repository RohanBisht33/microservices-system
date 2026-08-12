import { PrismaClient } from '@prisma/client';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { createApp } from './app.js';
import { NatsEventSubscriber } from './events/nats-subscriber.js';
import { ConsoleEmailProvider } from './providers/console-email.provider.js';
import { SmtpEmailProvider } from './providers/smtp-email.provider.js';
import { EVENT_SUBJECTS } from '@microservices/events';
import { handleUserCreated } from './events/handlers/user-created.handler.js';
import { handleUserUpdated } from './events/handlers/user-updated.handler.js';
import { handleUserDeleted } from './events/handlers/user-deleted.handler.js';
import { handlePasswordResetRequested } from './events/handlers/password-reset.handler.js';

const prisma = new PrismaClient();
const subscriber = new NatsEventSubscriber();

const provider =
  config.NOTIFICATION_PROVIDER === 'smtp'
    ? new SmtpEmailProvider()
    : new ConsoleEmailProvider();

async function main() {
  logger.info('Initializing Notification Service dependencies...');

  // Connect database
  await prisma.$connect();
  logger.info('Database connection established');

  const { app, notificationService } = createApp(prisma, subscriber, provider);

  // Connect NATS Subscriber and bind handlers to durable consumer
  try {
    await subscriber.connect();
    logger.info('NATS Event Subscriber connected');

    await subscriber.subscribe(
      EVENT_SUBJECTS.USER_CREATED,
      'notification-service-created',
      (event: any, ack, nak) => handleUserCreated(event, notificationService, ack, nak)
    );

    await subscriber.subscribe(
      EVENT_SUBJECTS.USER_UPDATED,
      'notification-service-updated',
      (event: any, ack, nak) => handleUserUpdated(event, notificationService, ack, nak)
    );

    await subscriber.subscribe(
      EVENT_SUBJECTS.USER_DELETED,
      'notification-service-deleted',
      (event: any, ack, nak) => handleUserDeleted(event, notificationService, ack, nak)
    );

    await subscriber.subscribe(
      EVENT_SUBJECTS.PASSWORD_RESET_REQUESTED,
      'notification-service-reset',
      (event: any, ack, nak) => handlePasswordResetRequested(event, notificationService, ack, nak)
    );

    logger.info('All NATS event subscriptions bound successfully');
  } catch (err) {
    logger.warn({ err }, 'NATS connection error during startup; subscriber will retry');
  }

  const server = app.listen(config.PORT, () => {
    logger.info(`Notification Service is running on port ${config.PORT}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        await subscriber.disconnect();
        logger.info('NATS subscriber disconnected');
      } catch (err) {
        logger.error({ err }, 'Error disconnecting NATS subscriber');
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
  logger.error({ err }, 'Fatal error during Notification Service startup');
  process.exit(1);
});
