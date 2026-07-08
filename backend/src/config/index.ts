import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import { envSchema, type EnvConfig } from './env.schema';
import { ZodError } from 'zod';

dotenv.config();

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const zodError = result.error as ZodError<unknown>;
  const errorMessages = zodError.issues.map(
    (e) => `${e.path.map(String).join('.')}: ${e.message}`
  );
  logger.error('Environment validation failed:', { errors: errorMessages });
  process.exit(1);
}

export const config: Readonly<EnvConfig> = Object.freeze(result.data);