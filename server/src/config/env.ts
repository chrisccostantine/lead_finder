import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  DATABASE_URL: z.string().url().refine((value) => value.startsWith('postgresql://') || value.startsWith('postgres://'), 'DATABASE_URL must be a PostgreSQL URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CLIENT_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  GOOGLE_PLACES_API_KEY: z.preprocess((value) => value || undefined, z.string().min(1).optional()),
  ENABLE_GOOGLE_PLACES: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  ENABLE_MOCK_PROVIDER: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
  GOOGLE_PAGESPEED_API_KEY: z.preprocess((value) => value || undefined, z.string().min(1).optional()),
  ENABLE_PAGESPEED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  AUDIT_FETCH_TIMEOUT_MS: z.coerce.number().int().min(3000).max(30000).default(10000),
  AUDIT_MAX_RESPONSE_BYTES: z.coerce.number().int().min(100000).max(5000000).default(1500000),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;
