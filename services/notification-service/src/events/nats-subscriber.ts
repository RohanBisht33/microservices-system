import { StringCodec, AckPolicy, DeliverPolicy, RetentionPolicy } from 'nats';
import {
  IEventSubscriber,
  EventHandler,
  BaseEvent,
  EVENT_STREAM_NAME,
} from '@microservices/events';
import { NatsClientSingleton } from './nats-client.js';
import { DLQPublisher } from './dlq-publisher.js';
import { logger } from '../utils/logger.js';

export class NatsEventSubscriber implements IEventSubscriber {
  private sc = StringCodec();
  private dlqPublisher = new DLQPublisher();
  private MAX_DELIVERIES = 5;

  async connect(): Promise<void> {
    await NatsClientSingleton.getInstance();
  }

  async disconnect(): Promise<void> {
    await NatsClientSingleton.close();
  }

  isHealthy(): boolean {
    return NatsClientSingleton.isConnected();
  }

  async subscribe<T extends BaseEvent>(
    subject: string,
    durableName: string,
    handler: EventHandler<T>
  ): Promise<void> {
    const nc = await NatsClientSingleton.getInstance();
    const jsm = await nc.jetstreamManager();

    // Ensure Stream exists
    try {
      await jsm.streams.info(EVENT_STREAM_NAME);
    } catch {
      await jsm.streams.add({
        name: EVENT_STREAM_NAME,
        subjects: ['user.events.>'],
        retention: RetentionPolicy.Limits,
        max_age: 7 * 24 * 60 * 60 * 1000 * 1000 * 1000,
      });
    }

    // Add or update durable consumer
    await jsm.consumers.add(EVENT_STREAM_NAME, {
      durable_name: durableName,
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      filter_subject: subject,
      max_deliver: this.MAX_DELIVERIES,
    });

    const js = nc.jetstream();
    const consumer = await js.consumers.get(EVENT_STREAM_NAME, durableName);
    const iter = await consumer.consume();

    logger.info({ subject, durableName }, 'Started JetStream durable consumer subscription');

    (async () => {
      for await (const msg of iter) {
        const redeliveryCount = msg.info.redeliveryCount;
        let parsedPayload: any = null;

        try {
          parsedPayload = JSON.parse(this.sc.decode(msg.data));

          if (redeliveryCount >= this.MAX_DELIVERIES) {
            logger.warn(
              { subject, redeliveryCount, eventId: parsedPayload?.eventId },
              'Max delivery threshold reached in JetStream consumer. Routing to DLQ...'
            );
            await this.dlqPublisher.publishToDLQ(
              subject,
              parsedPayload,
              'Exceeded max delivery attempts (5)',
              redeliveryCount,
              parsedPayload?.correlationId || ''
            );
            msg.ack();
            continue;
          }

          const ackFn = async () => msg.ack();
          const nakFn = async () => msg.nak(1000 * Math.pow(2, redeliveryCount)); // Exponential backoff

          await handler(parsedPayload as T, ackFn, nakFn, redeliveryCount);
        } catch (err: any) {
          logger.error({ err, subject, redeliveryCount }, 'Consumer handler execution failed');
          if (redeliveryCount >= this.MAX_DELIVERIES) {
            await this.dlqPublisher.publishToDLQ(
              subject,
              parsedPayload || { raw: this.sc.decode(msg.data) },
              err.message || 'Unknown handler failure',
              redeliveryCount,
              parsedPayload?.correlationId || ''
            );
            msg.ack();
          } else {
            msg.nak(1000 * Math.pow(2, redeliveryCount));
          }
        }
      }
    })();
  }
}
