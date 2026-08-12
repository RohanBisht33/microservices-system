export const EVENT_STREAM_NAME = 'USER_EVENTS';

export const EVENT_SUBJECTS = {
  USER_CREATED: 'user.events.created',
  USER_UPDATED: 'user.events.updated',
  USER_DELETED: 'user.events.deleted',
  PASSWORD_RESET_REQUESTED: 'user.events.password_reset_requested',
  DLQ: 'user.events.dlq',
} as const;

export type EventSubject = typeof EVENT_SUBJECTS[keyof typeof EVENT_SUBJECTS];
