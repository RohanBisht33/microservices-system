# NATS JetStream Event Contracts & Specification

## 1. Stream Configuration

- **Stream Name:** `USER_EVENTS`
- **Subjects:** `user.events.created`, `user.events.updated`, `user.events.deleted`, `user.events.password_reset_requested`, `user.events.dlq`
- **Retention Policy:** `Limits` (Messages retained up to `max_age` or stream limits)
- **Max Age:** 7 Days (`604,800` seconds)
- **Storage:** File-backed persistent storage

---

## 2. Consumer & Reliability Rules

- **Durable Consumer Name:** `notification-service-durable`
- **Ack Policy:** `Explicit` (Consumer calls `msg.ack()` after DB transaction completes)
- **Max Delivery Attempts:** 5 attempts
- **Backoff Strategy:** Exponential backoff (`1000ms * 2^attempt`)
- **Dead-Letter Queue (DLQ):** After 5 failed delivery attempts, the consumer publishes the failed payload envelope to `user.events.dlq` and sends `ack()` to clear the message from the main stream.

---

## 3. Event Envelopes & Schemas

### Standard Base Event Envelope

All events share the base structural envelope:

```json
{
  "eventId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "eventType": "user.events.created",
  "occurredAt": "2026-08-12T10:00:00.000Z",
  "correlationId": "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
  "version": 1,
  "data": {}
}
```

### Event Specifications

#### 3.1 `user.events.created`
Published when a new user registers.

```json
{
  "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "eventType": "user.events.created",
  "occurredAt": "2026-08-12T12:00:00.000Z",
  "correlationId": "d3b07384-d113-40a4-a719-33829fe73070",
  "version": 1,
  "data": {
    "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "email": "jane.doe@example.com",
    "name": "Jane Doe"
  }
}
```

#### 3.2 `user.events.updated`
Published when profile attributes change.

```json
{
  "eventId": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
  "eventType": "user.events.updated",
  "occurredAt": "2026-08-12T12:05:00.000Z",
  "correlationId": "e3b07384-d113-40a4-a719-33829fe73071",
  "version": 1,
  "data": {
    "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "name": "Jane Smith"
  }
}
```

#### 3.3 `user.events.deleted`
Published on soft deletion of a user account.

```json
{
  "eventId": "5fa85f64-5717-4562-b3fc-2c963f66afa8",
  "eventType": "user.events.deleted",
  "occurredAt": "2026-08-12T12:10:00.000Z",
  "correlationId": "f3b07384-d113-40a4-a719-33829fe73072",
  "version": 1,
  "data": {
    "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
}
```

#### 3.4 `user.events.password_reset_requested`
Published when a user requests a password reset.

```json
{
  "eventId": "6fa85f64-5717-4562-b3fc-2c963f66afa9",
  "eventType": "user.events.password_reset_requested",
  "occurredAt": "2026-08-12T12:15:00.000Z",
  "correlationId": "a3b07384-d113-40a4-a719-33829fe73073",
  "version": 1,
  "data": {
    "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "email": "jane.doe@example.com",
    "name": "Jane Doe"
  }
}
```

#### 3.5 `user.events.dlq`
Published when processing an event fails after 5 retries.

```json
{
  "eventId": "7fa85f64-5717-4562-b3fc-2c963f66afb0",
  "eventType": "user.events.dlq",
  "occurredAt": "2026-08-12T12:20:00.000Z",
  "correlationId": "b3b07384-d113-40a4-a719-33829fe73074",
  "version": 1,
  "data": {
    "originalSubject": "user.events.created",
    "originalEvent": {},
    "failedReason": "Provider timeout",
    "redeliveryCount": 5
  }
}
```
