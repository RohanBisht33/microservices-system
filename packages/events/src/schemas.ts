import { z } from 'zod';
import { EVENT_SUBJECTS } from './subjects.js';

export const BaseEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string(),
  occurredAt: z.string().datetime(),
  correlationId: z.string().uuid(),
  version: z.number().int().positive().default(1),
});

export const UserCreatedDataSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

export const UserCreatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal(EVENT_SUBJECTS.USER_CREATED),
  data: UserCreatedDataSchema,
});

export const UserUpdatedDataSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
});

export const UserUpdatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal(EVENT_SUBJECTS.USER_UPDATED),
  data: UserUpdatedDataSchema,
});

export const UserDeletedDataSchema = z.object({
  userId: z.string().uuid(),
});

export const UserDeletedEventSchema = BaseEventSchema.extend({
  eventType: z.literal(EVENT_SUBJECTS.USER_DELETED),
  data: UserDeletedDataSchema,
});

export const PasswordResetRequestedDataSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

export const PasswordResetRequestedEventSchema = BaseEventSchema.extend({
  eventType: z.literal(EVENT_SUBJECTS.PASSWORD_RESET_REQUESTED),
  data: PasswordResetRequestedDataSchema,
});

export const DLQEventSchema = BaseEventSchema.extend({
  eventType: z.literal(EVENT_SUBJECTS.DLQ),
  data: z.object({
    originalSubject: z.string(),
    originalEvent: z.record(z.unknown()),
    failedReason: z.string(),
    redeliveryCount: z.number(),
  }),
});

export const AnyDomainEventSchema = z.discriminatedUnion('eventType', [
  UserCreatedEventSchema,
  UserUpdatedEventSchema,
  UserDeletedEventSchema,
  PasswordResetRequestedEventSchema,
]);
