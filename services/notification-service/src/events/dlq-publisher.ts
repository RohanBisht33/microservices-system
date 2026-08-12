import { StringCodec } from 'nats';
import { EVENT_SUBJECTS, DLQEvent } from '@microservices/events';
import { NatsClientSingleton } from './nats-client.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

export class DLQPublisher {
  private sc = StringCodec();

  async publishToDLQ(
    originalSubject: string,
    rawPayload: Record<string, unknown>,
    failedReason: string,
    redeliveryCount: number,
    correlationId: string
  ): Promise<void> {
    try {
      const nc = await NatsClientSingleton.getInstance();
      const js = nc.jetstream();

      const dlqEvent: DLQEvent = {
        eventId: randomUUID(),
        eventType: EVENT_SUBJECTS.DLQ,
        occurredAt: new Date().toISOString(),
        correlationId: correlationId || randomUUID(),
        version: 1,
        data: {
          originalSubject,
          originalEvent: rawPayload,
          failedReason,
          redeliveryCount,
        },
      };

      await js.publish(EVENT_SUBJECTS.DLQ, this.sc.encode(JSON.stringify(dlqEvent)));
      logger.warn(
        { originalSubject, correlationId, redeliveryCount },
        '⚠️ Event exceeded max delivery attempts. Successfully routed to user.events.dlq'
      );
    } catch (err) {
      logger.error({ err, originalSubject }, 'Failed to publish message to DLQ');
    }
  }
}
