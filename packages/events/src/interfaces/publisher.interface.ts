import { BaseEvent } from '../types.js';

export interface IEventPublisher {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish<T extends BaseEvent>(subject: string, event: T): Promise<void>;
  isHealthy(): boolean;
}
