import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('4002'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  NATS_URL: z.string(),
  NATS_AUTH_TOKEN: z.string(),
  NATS_TLS_CA_PATH: z.string().optional(),
  JWT_SECRET: z.string().min(16),
  NOTIFICATION_PROVIDER: z.enum(['console', 'smtp']).default('console'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

function validateEnv() {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    if (process.env.NODE_ENV === 'test') {
      return {
        PORT: 4002,
        NODE_ENV: 'test' as const,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/notification_service_test?schema=public',
        NATS_URL: 'nats://localhost:4222',
        NATS_AUTH_TOKEN: 'test_token',
        NATS_TLS_CA_PATH: undefined,
        JWT_SECRET: 'super_secret_jwt_key_test_1234567890',
        NOTIFICATION_PROVIDER: 'console' as const,
        SMTP_HOST: undefined,
        SMTP_PORT: undefined,
        SMTP_USER: undefined,
        SMTP_PASS: undefined,
      };
    }
    console.error('❌ Invalid Notification Service Environment Variables:', result.error.format());
    process.exit(1);
  }
  return result.data;
}

export const config = validateEnv();
