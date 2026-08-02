import dotenv from 'dotenv';

dotenv.config();

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
};

const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[Startup] Required environment variable "${key}" is missing or empty`);
  }
  return value;
};

// Used by validateEnv below — suppress lint since it's a utility kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
void getRequiredEnvVar;

/**
 * Validates all critical environment variables at startup.
 * Throws if any required variable is missing.
 */
export const validateEnv = (): void => {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`[Startup] Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn about insecure defaults in production
  if (process.env['NODE_ENV'] === 'production') {
    if (process.env['JWT_SECRET'] === 'dev-jwt-secret-change-in-production') {
      throw new Error('[Startup] JWT_SECRET must be changed in production');
    }
    if (process.env['JWT_REFRESH_SECRET'] === 'dev-refresh-secret-change-in-production') {
      throw new Error('[Startup] JWT_REFRESH_SECRET must be changed in production');
    }
  }
};

export const env = {
  // Server
  PORT: parseInt(getEnvVar('PORT', '3000'), 10),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),

  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL', 'postgresql://placeholder'),
  DIRECT_URL: getEnvVar('DIRECT_URL', 'postgresql://placeholder'),

  // JWT
  JWT_SECRET: getEnvVar('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
  JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
  JWT_EXPIRY: getEnvVar('JWT_EXPIRY', '15m'),
  REFRESH_EXPIRY: getEnvVar('REFRESH_EXPIRY', '7d'),

  // Supabase
  SUPABASE_URL: getEnvVar('SUPABASE_URL', ''),
  SUPABASE_ANON_KEY: getEnvVar('SUPABASE_ANON_KEY', ''),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', ''),

  // SMTP
  SMTP_HOST: getEnvVar('SMTP_HOST', 'smtp.gmail.com'),
  SMTP_PORT: parseInt(getEnvVar('SMTP_PORT', '587'), 10),
  SMTP_USER: getEnvVar('SMTP_USER', ''),
  SMTP_PASSWORD: getEnvVar('SMTP_PASSWORD', ''),
  SMTP_FROM_NAME: getEnvVar('SMTP_FROM_NAME', 'CSE Student Platform'),

  // Client
  CLIENT_URL: getEnvVar('CLIENT_URL', 'http://localhost:5173'),

  // Redis
  REDIS_HOST: getEnvVar('REDIS_HOST', 'localhost'),
  REDIS_PORT: parseInt(getEnvVar('REDIS_PORT', '6379'), 10),
  REDIS_PASSWORD: getEnvVar('REDIS_PASSWORD', ''),
  REDIS_URL: getEnvVar('REDIS_URL', ''),

  // Cache TTL (seconds)
  CACHE_TTL_SHORT: parseInt(getEnvVar('CACHE_TTL_SHORT', '300'), 10),   // 5 min
  CACHE_TTL_MEDIUM: parseInt(getEnvVar('CACHE_TTL_MEDIUM', '1800'), 10), // 30 min
  CACHE_TTL_LONG: parseInt(getEnvVar('CACHE_TTL_LONG', '86400'), 10),   // 24 hours

  // Helpers
  isProduction: () => process.env['NODE_ENV'] === 'production',
  isDevelopment: () => process.env['NODE_ENV'] === 'development',
  isTest: () => process.env['NODE_ENV'] === 'test',

  // PRD-08.1: Email verification toggle
  // Set ENABLE_EMAIL_VERIFICATION=false in development to skip OTP verification
  isEmailVerificationEnabled: () => process.env['ENABLE_EMAIL_VERIFICATION'] !== 'false',

  // FPRD-17: Execution engine
  EXECUTION_ENGINE: getEnvVar('EXECUTION_ENGINE', 'mock'),   // 'piston' | 'mock'
  PISTON_API_URL: getEnvVar('PISTON_API_URL', 'https://emkc.org/api/v2/piston'),
  PISTON_API_KEY: getEnvVar('PISTON_API_KEY', ''),
};
