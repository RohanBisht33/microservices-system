import {
  UserCreatedEventSchema,
  UserUpdatedEventSchema,
  UserDeletedEventSchema,
  PasswordResetRequestedEventSchema,
} from './schemas.js';
import { EVENT_SUBJECTS } from './subjects.js';

describe('Event Schemas Validation', () => {
  const validUUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const correlationId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  it('validates UserCreatedEvent accurately', () => {
    const validEvent = {
      eventId: validUUID,
      eventType: EVENT_SUBJECTS.USER_CREATED,
      occurredAt: new Date().toISOString(),
      correlationId,
      version: 1,
      data: {
        userId: validUUID,
        email: 'jane@example.com',
        name: 'Jane Doe',
      },
    };

    const parsed = UserCreatedEventSchema.safeParse(validEvent);
    expect(parsed.success).toBe(true);
  });

  it('rejects UserCreatedEvent with invalid email', () => {
    const invalidEvent = {
      eventId: validUUID,
      eventType: EVENT_SUBJECTS.USER_CREATED,
      occurredAt: new Date().toISOString(),
      correlationId,
      version: 1,
      data: {
        userId: validUUID,
        email: 'not-an-email',
        name: 'Jane Doe',
      },
    };

    const parsed = UserCreatedEventSchema.safeParse(invalidEvent);
    expect(parsed.success).toBe(false);
  });

  it('validates UserUpdatedEvent', () => {
    const validEvent = {
      eventId: validUUID,
      eventType: EVENT_SUBJECTS.USER_UPDATED,
      occurredAt: new Date().toISOString(),
      correlationId,
      version: 1,
      data: {
        userId: validUUID,
        name: 'Jane Smith',
      },
    };

    const parsed = UserUpdatedEventSchema.safeParse(validEvent);
    expect(parsed.success).toBe(true);
  });

  it('validates UserDeletedEvent', () => {
    const validEvent = {
      eventId: validUUID,
      eventType: EVENT_SUBJECTS.USER_DELETED,
      occurredAt: new Date().toISOString(),
      correlationId,
      version: 1,
      data: {
        userId: validUUID,
      },
    };

    const parsed = UserDeletedEventSchema.safeParse(validEvent);
    expect(parsed.success).toBe(true);
  });

  it('validates PasswordResetRequestedEvent', () => {
    const validEvent = {
      eventId: validUUID,
      eventType: EVENT_SUBJECTS.PASSWORD_RESET_REQUESTED,
      occurredAt: new Date().toISOString(),
      correlationId,
      version: 1,
      data: {
        userId: validUUID,
        email: 'user@example.com',
        name: 'Jane Doe',
      },
    };

    const parsed = PasswordResetRequestedEventSchema.safeParse(validEvent);
    expect(parsed.success).toBe(true);
  });
});
