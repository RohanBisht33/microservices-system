import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  USER_SERVICE_URL: z.string().url(),
  NOTIFICATION_SERVICE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
});

function validateEnv() {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    if (process.env.NODE_ENV === 'test') {
      return {
        PORT: 3000,
        NODE_ENV: 'test' as const,
        USER_SERVICE_URL: 'http://localhost:4001',
        NOTIFICATION_SERVICE_URL: 'http://localhost:4002',
        JWT_SECRET: 'super_secret_jwt_key_test_1234567890',
      };
    }
    console.error('❌ Invalid API Gateway Environment Variables:', result.error.format());
    process.exit(1);
  }
  return result.data;
}

export const config = validateEnv();
