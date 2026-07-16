/**
 * Enhanced Logger
 * PRD-06: Section 9 — Logging Improvements
 * - Structured JSON logs
 * - Correlation IDs support
 * - Request tracing
 * - Queue/cache/DB slow-query logs
 * - Environment-specific log levels
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Human-readable format for dev console
const devFormat = printf(({ level, message, timestamp: ts, correlationId, stack, ...meta }) => {
  const cid = correlationId ? ` [${correlationId as string}]` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${ts as string}]${cid} ${level}: ${(stack as string) || (message as string)}${metaStr}`;
});

// Structured JSON format for production / file transports
const jsonFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  devFormat,
);

const nodeEnv = process.env['NODE_ENV'] ?? 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

export const logger = winston.createLogger({
  level: isProduction ? 'info' : isTest ? 'silent' : 'debug',
  defaultMeta: { service: 'cse-platform' },
  format: jsonFormat,
  transports: [
    // Console — dev and staging only
    ...(!isProduction && !isTest
      ? [
          new winston.transports.Console({
            format: consoleFormat,
          }),
        ]
      : []),

    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5_242_880, // 5 MB
      maxFiles: 5,
      format: jsonFormat,
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5_242_880,
      maxFiles: 10,
      format: jsonFormat,
    }),

    // Warn log file
    new winston.transports.File({
      filename: path.join(logsDir, 'warn.log'),
      level: 'warn',
      maxsize: 5_242_880,
      maxFiles: 5,
      format: jsonFormat,
    }),
  ],
});

// ── Slow Query Logger ─────────────────────────────────────────────────────────
export const logSlowQuery = (query: string, duration: number, threshold = 200): void => {
  if (duration > threshold) {
    logger.warn('Slow database query detected', {
      query: query.slice(0, 200),
      duration_ms: duration,
      threshold_ms: threshold,
    });
  }
};

// ── Cache Logger ──────────────────────────────────────────────────────────────
export const logCacheEvent = (event: 'hit' | 'miss' | 'set' | 'del', key: string): void => {
  logger.debug(`Cache ${event}`, { key, cache_event: event });
};

// ── Queue Logger ──────────────────────────────────────────────────────────────
export const logQueueEvent = (
  queue: string,
  event: 'enqueued' | 'completed' | 'failed',
  jobId?: string,
): void => {
  logger.info(`Queue event`, { queue, event, jobId });
};
