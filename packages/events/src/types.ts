import { z } from 'zod';
import {
  BaseEventSchema,
  UserCreatedEventSchema,
  UserUpdatedEventSchema,
  UserDeletedEventSchema,
  PasswordResetRequestedEventSchema,
  DLQEventSchema,
  AnyDomainEventSchema,
} from './schemas.js';

export type BaseEvent = z.infer<typeof BaseEventSchema>;
export type UserCreatedEvent = z.infer<typeof UserCreatedEventSchema>;
export type UserUpdatedEvent = z.infer<typeof UserUpdatedEventSchema>;
export type UserDeletedEvent = z.infer<typeof UserDeletedEventSchema>;
export type PasswordResetRequestedEvent = z.infer<typeof PasswordResetRequestedEventSchema>;
export type DLQEvent = z.infer<typeof DLQEventSchema>;
export type AnyDomainEvent = z.infer<typeof AnyDomainEventSchema>;
