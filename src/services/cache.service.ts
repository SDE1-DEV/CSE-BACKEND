/**
 * Centralized Cache Service backed by Redis.
 * Provides graceful fallback when Redis is unavailable.
 * PRD-06: Section 1 — Redis Integration
 */

import { getRedisClient } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const CacheKeys = {
  // Learning
  CATEGORIES_ALL: 'categories:all',
  CATEGORY: (id: string) => `category:${id}`,
  ROADMAPS: (categoryId?: string) => `roadmaps:${categoryId ?? 'all'}`,
  ROADMAP: (slug: string) => `roadmap:${slug}`,

  // Resources
  RESOURCES: (lessonId: string) => `resources:${lessonId}`,

  // Coding
  DAILY_CHALLENGE: () => `daily_challenge:${new Date().toISOString().slice(0, 10)}`,
  CODING_STATS: (userId: string) => `coding_stats:${userId}`,

  // Dashboard
  DASHBOARD_SUMMARY: (userId: string) => `dashboard:${userId}`,
  ADMIN_DASHBOARD: 'admin:dashboard',

  // Notifications
  NOTIFICATION_COUNT: (userId: string) => `notif_count:${userId}`,

  // Search suggestions
  SEARCH_SUGGESTIONS: (query: string) => `search_suggest:${query.toLowerCase().slice(0, 50)}`,

  // Analytics
  USER_ANALYTICS: (userId: string) => `analytics:${userId}`,

  // Rate limiting
  RATE_LIMIT: (key: string) => `rate_limit:${key}`,

  // Session cache
  SESSION: (token: string) => `session:${token}`,

  // Metrics
  METRICS_SNAPSHOT: 'metrics:snapshot',
} as const;

class CacheService {
  private get client() {
    return getRedisClient();
  }

  /**
   * Get a cached value. Returns null on cache miss or Redis unavailability.
   */
  async get<T>(key: string): Promise<T | null> {
    const client = this.client;
    if (!client) return null;

    try {
      const value = await client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (err) {
      logger.warn('Cache GET failed', { key, error: (err as Error).message });
      return null;
    }
  }

  /**
   * Set a cached value with optional TTL in seconds.
   */
  async set<T>(key: string, value: T, ttl: number = env.CACHE_TTL_MEDIUM): Promise<void> {
    const client = this.client;
    if (!client) return;

    try {
      await client.setex(key, ttl, JSON.stringify(value));
    } catch (err) {
      logger.warn('Cache SET failed', { key, error: (err as Error).message });
    }
  }

  /**
   * Delete a cached key or pattern.
   */
  async del(key: string): Promise<void> {
    const client = this.client;
    if (!client) return;

    try {
      await client.del(key);
    } catch (err) {
      logger.warn('Cache DEL failed', { key, error: (err as Error).message });
    }
  }

  /**
   * Delete all keys matching a pattern (uses SCAN for safety).
   */
  async delPattern(pattern: string): Promise<void> {
    const client = this.client;
    if (!client) return;

    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      logger.warn('Cache DEL PATTERN failed', { pattern, error: (err as Error).message });
    }
  }

  /**
   * Wrap a function with cache-aside pattern.
   * Fetches from cache first; on miss, calls fn() and caches the result.
   */
  async wrap<T>(key: string, fn: () => Promise<T>, ttl: number = env.CACHE_TTL_MEDIUM): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  /**
   * Increment a counter (used for rate limiting, stats).
   */
  async incr(key: string, ttl?: number): Promise<number> {
    const client = this.client;
    if (!client) return 0;

    try {
      const value = await client.incr(key);
      if (ttl && value === 1) {
        await client.expire(key, ttl);
      }
      return value;
    } catch (err) {
      logger.warn('Cache INCR failed', { key, error: (err as Error).message });
      return 0;
    }
  }

  /**
   * Get TTL of a key.
   */
  async ttl(key: string): Promise<number> {
    const client = this.client;
    if (!client) return -1;

    try {
      return await client.ttl(key);
    } catch {
      return -1;
    }
  }

  /**
   * Check if Redis is available.
   */
  async ping(): Promise<boolean> {
    const client = this.client;
    if (!client) return false;

    try {
      const result = await client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Get Redis info for health checks.
   */
  async info(): Promise<Record<string, string>> {
    const client = this.client;
    if (!client) return {};

    try {
      const infoStr = await client.info('stats');
      const lines = infoStr.split('\r\n').filter((l) => l.includes(':'));
      return Object.fromEntries(lines.map((l) => l.split(':')));
    } catch {
      return {};
    }
  }
}

export const cacheService = new CacheService();
