# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configs
COPY package*.json tsconfig.base.json ./
COPY services/api-gateway/package*.json ./services/api-gateway/

# Install dependencies
RUN npm ci

# Copy gateway source code
COPY services/api-gateway/ ./services/api-gateway/

# Build gateway
WORKDIR /app/services/api-gateway
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY services/api-gateway/package*.json ./services/api-gateway/
COPY docs/api/openapi.yaml ./docs/api/openapi.yaml

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist

WORKDIR /app/services/api-gateway

EXPOSE 3000

CMD ["node", "dist/index.js"]
