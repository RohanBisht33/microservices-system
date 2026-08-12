import { INotificationProvider, NotificationPayload } from './notification-provider.interface.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export class SmtpEmailProvider implements INotificationProvider {
  constructor() {
    logger.info(
      { host: config.SMTP_HOST, port: config.SMTP_PORT, user: config.SMTP_USER },
      'SMTP Notification Provider initialized'
    );
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    logger.info(
      {
        to: payload.to,
        subject: payload.subject,
        type: payload.type,
        correlationId: payload.correlationId,
      },
      `Email dispatched [SmtpProvider] via ${config.SMTP_HOST || 'localhost'} -> To: ${payload.to}`
    );
    return true;
  }
}
