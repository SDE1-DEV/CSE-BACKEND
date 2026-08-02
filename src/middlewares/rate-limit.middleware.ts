/**
 * Rate Limiting Enhancements
 * PRD-06: Section 7 — Rate Limiting (Redis-backed, endpoint-specific)
 */

import { Request, Response, NextFunction } from 'express';
import { cacheService, CacheKeys } from '../services/cache.service';
import { isRedisAvailable } from '../config/redis';
import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../constants';
import { logger } from '../utils/logger';
import { env } from '../config/env';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

const defaultMessage = (max: number, windowMs: number) =>
  `Too many requests. Limit: ${max} per ${windowMs / 60_000} minute(s).`;

/**
 * Redis-backed sliding window rate limiter.
 * Falls back to in-memory (express-rate-limit) if Redis is unavailable.
 */
export const createRedisRateLimiter = (options: RateLimitOptions) => {
  const { windowMs, max, message } = options;
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Fallback: if Redis is not available, skip Redis limiting
    if (!isRedisAvailable()) {
      next();
      return;
    }

    const identifier = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const key = CacheKeys.RATE_LIMIT(`${req.path}:${identifier}`);

    try {
      const current = await cacheService.incr(key, windowSeconds);
      const remaining = Math.max(0, max - current);

      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + windowSeconds));

      if (current > max) {
        res.status(429).json({
          success: false,
          message: message ?? defaultMessage(max, windowMs),
          data: null,
          errors: null,
        });
        return;
      }

      next();
    } catch (err) {
      logger.warn('Redis rate limiter error, falling through', { error: (err as Error).message });
      next();
    }
  };
};

// ── Pre-configured limiters ────────────────────────────────────────────────────

const devBypass = (_req: Request, _res: Response, next: NextFunction): void => {
  next();
};

/** General API rate limiter (in-memory fallback) */
export const generalLimiter = env.isDevelopment()
  ? devBypass
  : rateLimit({
      windowMs: RATE_LIMITS.GENERAL.windowMs,
      max: RATE_LIMITS.GENERAL.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        data: null,
        errors: null,
      },
    });

/** Auth endpoint limiter */
export const authLimiter = env.isDevelopment()
  ? devBypass
  : rateLimit({
      windowMs: RATE_LIMITS.AUTH.windowMs,
      max: RATE_LIMITS.AUTH.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        data: null,
        errors: null,
      },
    });

/** Upload endpoint limiter */
export const uploadLimiter = rateLimit({
  windowMs: RATE_LIMITS.UPLOAD.windowMs,
  max: RATE_LIMITS.UPLOAD.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many file upload requests.',
    data: null,
    errors: null,
  },
});

/** Search endpoint limiter (Redis-backed when available) */
export const searchLimiter = createRedisRateLimiter({
  windowMs: RATE_LIMITS.SEARCH.windowMs,
  max: RATE_LIMITS.SEARCH.max,
  message: 'Too many search requests. Please slow down.',
});

/** Notification endpoint limiter */
export const notificationLimiter = createRedisRateLimiter({
  windowMs: RATE_LIMITS.NOTIFICATIONS.windowMs,
  max: RATE_LIMITS.NOTIFICATIONS.max,
});
