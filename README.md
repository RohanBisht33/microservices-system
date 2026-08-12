# Microservices System (User Service + Notification Service + API Gateway)

A distributed microservices architecture built with **Node.js 20+**, **TypeScript**, **Express**, **Prisma**, **PostgreSQL**, and **NATS JetStream**.

---

## 1. Architecture Overview

```
                        ┌─────────────────────┐
        Client  ──────► │     API Gateway      │  (public, port 3000)
                        │  - JWT verification  │
                        │  - rate limiting      │
                        │  - request routing    │
                        │  - request validation │
                        └─────────┬────────────┘
                                  │ REST (internal, service-to-service HTTP)
                                  ▼
                        ┌─────────────────────┐
                        │   User Service        │  (internal, port 4001)
                        │  - signup/login       │
                        │  - CRUD users         │
                        │  - issues JWTs        │
                        │  - publishes events ─┐│
                        └───────────────────────┘
                                                │
                                   NATS JetStream (TLS, authenticated)
                                   subject: user.events.*
                                                │
                        ┌───────────────────────┘
                        ▼
                ┌─────────────────────┐
                │ Notification Service │  (internal, port 4002)
                │  - subscribes to     │
                │    durable consumer  │
                │  - sends email/log   │
                │  - retry + DLQ       │
                │  - exposes /health   │
                │    and /notifications│
                │    read API to       │
                │    Gateway (REST)    │
                └─────────────────────┘
```

### Key Architectural Principles
- **Asynchronous Event-Driven Communication:** User Service and Notification Service communicate exclusively via NATS JetStream (never directly via REST).
- **Interface/Adapter Pluggability:** Event producers and consumers depend on `IEventPublisher` and `IEventSubscriber` interfaces from `@microservices/events`, making it straightforward to swap NATS for RabbitMQ or SQS.
- **Idempotent Consumers:** The Notification Service checks `ProcessedEvent` records before executing handlers to prevent duplicate notifications on redeliveries.
- **Explicit Ack & DLQ:** JetStream consumers use manual acknowledgement (`AckPolicy.Explicit`). Events reaching max deliver count (5) are published to `user.events.dlq`.

---

## 2. Prerequisites & Pre-Flight Checks

Before starting, make sure you have:
- **Node.js**: v20+ (`node -v`)
- **Docker & Docker Compose**: Docker V2 plugin (`docker compose`) or standalone binary (`docker-compose`).
- **OpenSSL**: Installed on host for TLS certificate generation.

### ⚠️ Common Host Setup Gotcha: Port 5432 Conflict
If you have a local PostgreSQL server running on your host machine, port `5432` will be in use. Stop local Postgres before launching Docker containers:

```bash
# Stop host PostgreSQL service to free port 5432
sudo systemctl stop postgresql
```

---

## 3. Installation & Quick Start Guide

Follow these exact steps from the project root directory:

```bash
# Step 1: Generate dev self-signed TLS certificates for NATS
npm run gen-certs

# Step 2: Create environment configuration file
cp .env.example .env

# Step 3: Build and launch the container stack in detached mode
docker compose up --build -d

# Step 4: Verify that all containers report healthy
docker compose ps
```

All 5 containers (`postgres`, `nats`, `user-service`, `notification-service`, `api-gateway`) will report `healthy`.

---

## 4. Manual Usage & Testing Guide (Verification Flow)

Once the containers are running, test the complete end-to-end flow using `curl`:

### 1. User Signup (Triggers `user.events.created` NATS event)
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "name": "Demo User",
    "password": "SecurePassword123!"
  }'
```
**Response (201 Created):** Returns user object, `accessToken`, and `refreshToken`.

---

### 2. User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "SecurePassword123!"
  }'
```

---

### 3. Fetch User Notifications (Verifies Event-Driven Flow)
Using the `accessToken` returned from signup/login:

```bash
curl http://localhost:3000/api/notifications \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

**Response (200 OK):**
```json
[
  {
    "id": "0140140d-bc5c-4f6d-9eca-076689d10c36",
    "userId": "6dad1604-10fb-4e64-9faf-6e4040b34843",
    "type": "welcome",
    "channel": "email",
    "status": "sent",
    "correlationId": "b72736d3-b1ef-44dc-865e-f6ad5674e987",
    "eventId": "877221ce-40c5-4c4a-bfb1-d73e07e9d0b8",
    "createdAt": "2026-08-12T16:34:08.585Z"
  }
]
```

---

## 5. Live OpenAPI / Swagger Documentation

Interactive OpenAPI 3.0 documentation is served live via Swagger UI:
👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

The underlying spec file is located at `docs/api/openapi.yaml`.

---

## 6. Running Tests

Execute the monorepo unit and integration test suite:

```bash
# Install local workspace dependencies
npm install

# Run Jest tests across all workspaces
npm test
```

---

## 7. Useful Operational Commands

```bash
# View aggregated service logs
docker compose logs -f

# View logs for a specific service (e.g. User Service)
docker compose logs -f user-service

# Restart a specific service
docker compose restart notification-service

# Stop all containers
docker compose down
```

---

## 8. Environment Variables Reference (`.env`)

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Environment mode |
| `POSTGRES_USER` | `postgres` | PostgreSQL admin username |
| `POSTGRES_PASSWORD` | `postgres_dev_password` | PostgreSQL admin password |
| `GATEWAY_PORT` | `3000` | API Gateway external HTTP port |
| `USER_SERVICE_PORT` | `4001` | User Service internal HTTP port |
| `NOTIFICATION_SERVICE_PORT` | `4002` | Notification Service internal HTTP port |
| `NATS_AUTH_TOKEN` | `dev_nats_token_sec_123` | NATS client authentication token |
| `JWT_SECRET` | `super_secret_jwt_key...` | Secret key for signing/verifying JWT access tokens |
