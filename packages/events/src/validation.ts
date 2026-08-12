import { AnyDomainEventSchema, BaseEventSchema } from './schemas.js';
import { AnyDomainEvent, BaseEvent } from './types.js';

export function validateDomainEvent(data: unknown): AnyDomainEvent {
  return AnyDomainEventSchema.parse(data);
}

export function validateBaseEvent(data: unknown): BaseEvent {
  return BaseEventSchema.parse(data);
}

export function safeParseDomainEvent(data: unknown) {
  return AnyDomainEventSchema.safeParse(data);
}
