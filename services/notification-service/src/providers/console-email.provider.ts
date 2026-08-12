import { INotificationProvider, NotificationPayload } from './notification-provider.interface.js';
import { logger } from '../utils/logger.js';

export class ConsoleEmailProvider implements INotificationProvider {
  async send(payload: NotificationPayload): Promise<boolean> {
    logger.info(
      {
        to: payload.to,
        subject: payload.subject,
        type: payload.type,
        correlationId: payload.correlationId,
      },
      `Email dispatched [ConsoleProvider] -> To: ${payload.to} | Subject: "${payload.subject}"`
    );
    return true;
  }
}
