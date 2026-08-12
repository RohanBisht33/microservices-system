# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy root workspace configs
COPY package*.json tsconfig.base.json ./
COPY packages/events/package*.json ./packages/events/
COPY services/user-service/package*.json ./services/user-service/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/events/ ./packages/events/
COPY services/user-service/ ./services/user-service/

# Build shared packages and user-service
RUN npm run build --workspace=@microservices/events
WORKDIR /app/services/user-service
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY packages/events/package*.json ./packages/events/
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY services/user-service/package*.json ./services/user-service/
COPY services/user-service/prisma ./services/user-service/prisma

RUN npm ci --only=production

COPY --from=builder /app/services/user-service/dist ./services/user-service/dist
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

WORKDIR /app/services/user-service

EXPOSE 4001

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
