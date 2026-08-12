import { UserUpdatedEvent } from '@microservices/events';
import { NotificationService } from '../../services/notification.service.js';

export async function handleUserUpdated(
  event: UserUpdatedEvent,
  notificationService: NotificationService,
  ack: () => Promise<void>,
  nak: () => Promise<void>
) {
  try {
    if (event.data.email) {
      await notificationService.processEvent(
        event.eventId,
        event.data.userId,
        'account_updated',
        'email',
        event.correlationId,
        {
          to: event.data.email,
          subject: 'Account Profile Updated',
          body: `Your profile information has been updated successfully.`,
        }
      );
    }
    await ack();
  } catch (err) {
    await nak();
  }
}
