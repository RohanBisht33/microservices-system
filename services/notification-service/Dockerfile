# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy root workspace configs
COPY package*.json tsconfig.base.json ./
COPY packages/events/package*.json ./packages/events/
COPY services/notification-service/package*.json ./services/notification-service/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/events/ ./packages/events/
COPY services/notification-service/ ./services/notification-service/

# Build shared packages and notification-service
RUN npm run build --workspace=@microservices/events
WORKDIR /app/services/notification-service
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY packages/events/package*.json ./packages/events/
COPY services/notification-service/package*.json ./services/notification-service/
COPY services/notification-service/prisma ./services/notification-service/prisma

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist

WORKDIR /app/services/notification-service

EXPOSE 4002

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
