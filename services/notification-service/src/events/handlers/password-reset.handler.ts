import { PasswordResetRequestedEvent } from '@microservices/events';
import { NotificationService } from '../../services/notification.service.js';

export async function handlePasswordResetRequested(
  event: PasswordResetRequestedEvent,
  notificationService: NotificationService,
  ack: () => Promise<void>,
  nak: () => Promise<void>
) {
  try {
    await notificationService.processEvent(
      event.eventId,
      event.data.userId,
      'password_reset',
      'email',
      event.correlationId,
      {
        to: event.data.email,
        subject: 'Password Reset Request',
        body: `Hi ${event.data.name},\n\nYou requested a password reset. Please use the reset link provided in your portal to reset your password.`,
      }
    );
    await ack();
  } catch (err) {
    await nak();
  }
}
