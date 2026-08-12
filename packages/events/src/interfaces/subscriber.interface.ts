import { BaseEvent } from '../types.js';

export type EventHandler<T extends BaseEvent> = (
  event: T,
  ack: () => Promise<void>,
  nak: () => Promise<void>,
  redeliveryCount?: number
) => Promise<void>;

export interface IEventSubscriber {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe<T extends BaseEvent>(
    subject: string,
    durableName: string,
    handler: EventHandler<T>
  ): Promise<void>;
  isHealthy(): boolean;
}
