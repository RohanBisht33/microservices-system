import { UserCreatedEvent } from '@microservices/events';
import { NotificationService } from '../../services/notification.service.js';

export async function handleUserCreated(
  event: UserCreatedEvent,
  notificationService: NotificationService,
  ack: () => Promise<void>,
  nak: () => Promise<void>
) {
  try {
    await notificationService.processEvent(
      event.eventId,
      event.data.userId,
      'welcome',
      'email',
      event.correlationId,
      {
        to: event.data.email,
        subject: `Welcome to our platform, ${event.data.name}!`,
        body: `Hi ${event.data.name},\n\nThank you for signing up. We are thrilled to have you on board!`,
      }
    );
    await ack();
  } catch (err) {
    await nak();
  }
}
