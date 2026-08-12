import { JetStreamClient, StringCodec, RetentionPolicy } from 'nats';
import { IEventPublisher, BaseEvent, EVENT_STREAM_NAME, EVENT_SUBJECTS } from '@microservices/events';
import { NatsClientSingleton } from './nats-client.js';
import { logger } from '../utils/logger.js';

export class NatsEventPublisher implements IEventPublisher {
  private js: JetStreamClient | null = null;
  private sc = StringCodec();

  async connect(): Promise<void> {
    const nc = await NatsClientSingleton.getInstance();
    const jsm = await nc.jetstreamManager();

    // Ensure Stream exists
    try {
      await jsm.streams.info(EVENT_STREAM_NAME);
    } catch {
      logger.info({ stream: EVENT_STREAM_NAME }, 'Stream not found, creating stream...');
      await jsm.streams.add({
        name: EVENT_STREAM_NAME,
        subjects: ['user.events.>'],
        retention: RetentionPolicy.Limits,
        max_age: 7 * 24 * 60 * 60 * 1000 * 1000 * 1000, // 7 days in nanoseconds
      });
      logger.info({ stream: EVENT_STREAM_NAME }, 'Stream created successfully');
    }

    this.js = nc.jetstream();
  }

  async disconnect(): Promise<void> {
    await NatsClientSingleton.close();
    this.js = null;
  }

  isHealthy(): boolean {
    return NatsClientSingleton.isConnected() && this.js !== null;
  }

  async publish<T extends BaseEvent>(subject: string, event: T): Promise<void> {
    if (!this.js) {
      await this.connect();
    }

    const payload = JSON.stringify(event);
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        logger.info(
          { subject, eventId: event.eventId, correlationId: event.correlationId, attempt: attempts },
          `Publishing event to NATS JetStream...`
        );
        const ack = await this.js!.publish(subject, this.sc.encode(payload));
        logger.info(
          { subject, eventId: event.eventId, seq: ack.seq, stream: ack.stream },
          'Successfully received NATS publish confirmation'
        );
        return;
      } catch (err) {
        logger.error(
          { err, subject, eventId: event.eventId, attempt: attempts },
          `Failed publish attempt ${attempts} to NATS`
        );
        if (attempts >= maxAttempts) {
          throw err;
        }
        await new Promise((res) => setTimeout(res, 500 * attempts));
      }
    }
  }
}
