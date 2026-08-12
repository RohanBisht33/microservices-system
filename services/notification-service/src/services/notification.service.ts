import { PrismaClient } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { ProcessedEventRepository } from '../repositories/processed-event.repository.js';
import { INotificationProvider } from '../providers/notification-provider.interface.js';
import { logger } from '../utils/logger.js';

export class NotificationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly notificationRepository: NotificationRepository,
    private readonly processedEventRepository: ProcessedEventRepository,
    private readonly provider: INotificationProvider
  ) {}

  async processEvent(
    eventId: string,
    userId: string,
    type: string,
    channel: string,
    correlationId: string,
    emailDetails: { to: string; subject: string; body: string }
  ): Promise<boolean> {
    // 1. Idempotency Check
    const alreadyProcessed = await this.processedEventRepository.isProcessed(eventId);
    if (alreadyProcessed) {
      logger.info({ eventId, correlationId }, 'Event already processed. Skipping duplicate.');
      return true;
    }

    // 2. Dispatch via NotificationProvider
    let status = 'sent';
    try {
      await this.provider.send({
        to: emailDetails.to,
        subject: emailDetails.subject,
        body: emailDetails.body,
        correlationId,
        type,
      });
    } catch (err) {
      logger.error({ err, eventId }, 'Failed to send notification via provider');
      status = 'failed';
    }

    // 3. Save Notification & ProcessedEvent inside a single transaction
    await this.prisma.$transaction(async (tx: any) => {
      await tx.notification.create({
        data: {
          userId,
          type,
          channel,
          status,
          correlationId,
          eventId,
        },
      });

      await tx.processedEvent.create({
        data: { eventId },
      });
    });

    logger.info({ eventId, userId, type, status }, 'Notification processed and logged successfully');
    return status === 'sent';
  }

  async getUserNotifications(userId: string) {
    return this.notificationRepository.findByUserId(userId);
  }
}
