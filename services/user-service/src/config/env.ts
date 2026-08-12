import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('4001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  NATS_URL: z.string(),
  NATS_AUTH_TOKEN: z.string(),
  NATS_TLS_CA_PATH: z.string().optional(),
  JWT_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION_DAYS: z.string().transform((val) => parseInt(val, 10)).default('7'),
});

function validateEnv() {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    if (process.env.NODE_ENV === 'test') {
      return {
        PORT: 4001,
        NODE_ENV: 'test' as const,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/user_service_test?schema=public',
        NATS_URL: 'nats://localhost:4222',
        NATS_AUTH_TOKEN: 'test_token',
        NATS_TLS_CA_PATH: undefined,
        JWT_SECRET: 'super_secret_jwt_key_test_1234567890',
        JWT_ACCESS_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION_DAYS: 7,
      };
    }
    console.error('❌ Invalid User Service Environment Variables:', result.error.format());
    process.exit(1);
  }
  return result.data;
}

export const config = validateEnv();
