import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { correlationIdMiddleware } from './middleware/correlation-id.js';
import { errorHandlerMiddleware } from './middleware/error-handler.js';
import { authenticateJWT } from './middleware/auth.middleware.js';
import { NotificationRepository } from './repositories/notification.repository.js';
import { ProcessedEventRepository } from './repositories/processed-event.repository.js';
import { NotificationService } from './services/notification.service.js';
import { NotificationController } from './controllers/notification.controller.js';
import { HealthController } from './controllers/health.controller.js';
import { INotificationProvider } from './providers/notification-provider.interface.js';
import { IEventSubscriber } from '@microservices/events';

export function createApp(
  prisma: PrismaClient,
  subscriber: IEventSubscriber,
  provider: INotificationProvider
) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(correlationIdMiddleware);

  const notificationRepository = new NotificationRepository(prisma);
  const processedEventRepository = new ProcessedEventRepository(prisma);

  const notificationService = new NotificationService(
    prisma,
    notificationRepository,
    processedEventRepository,
    provider
  );

  const notificationController = new NotificationController(notificationService);
  const healthController = new HealthController(prisma, subscriber);

  // Health checks
  app.get('/health', healthController.getHealth);
  app.get('/ready', healthController.getReady);

  // Internal notification query endpoint (JWT protected)
  app.get('/internal/notifications', authenticateJWT, notificationController.getUserNotifications);

  // Centralized Error Handler
  app.use(errorHandlerMiddleware);

  return { app, notificationService };
}
