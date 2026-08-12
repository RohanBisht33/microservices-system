import { UserDeletedEvent } from '@microservices/events';
import { NotificationService } from '../../services/notification.service.js';

export async function handleUserDeleted(
  event: UserDeletedEvent,
  notificationService: NotificationService,
  ack: () => Promise<void>,
  nak: () => Promise<void>
) {
  try {
    await notificationService.processEvent(
      event.eventId,
      event.data.userId,
      'account_deleted',
      'email',
      event.correlationId,
      {
        to: `user-${event.data.userId}@deleted.local`,
        subject: 'Account Closed',
        body: 'Your account has been deleted as requested.',
      }
    );
    await ack();
  } catch (err) {
    await nak();
  }
}
