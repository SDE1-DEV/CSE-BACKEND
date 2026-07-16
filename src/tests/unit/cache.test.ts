/**
 * Unit Tests — Cache Service
 * PRD-06: Section 12 — Testing (Unit)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cacheService, CacheKeys } from '../../services/cache.service';

describe('CacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with Redis unavailable (null client)', () => {
    it('get() returns null gracefully', async () => {
      const result = await cacheService.get('test:key');
      expect(result).toBeNull();
    });

    it('set() silently no-ops', async () => {
      await expect(cacheService.set('test:key', { value: 1 })).resolves.toBeUndefined();
    });

    it('del() silently no-ops', async () => {
      await expect(cacheService.del('test:key')).resolves.toBeUndefined();
    });

    it('ping() returns false', async () => {
      const result = await cacheService.ping();
      expect(result).toBe(false);
    });

    it('wrap() calls fn and returns result', async () => {
      const fn = vi.fn().mockResolvedValue({ data: 'hello' });
      const result = await cacheService.wrap('test:key', fn);
      expect(result).toEqual({ data: 'hello' });
      expect(fn).toHaveBeenCalledOnce();
    });
  });

  describe('CacheKeys', () => {
    it('generates correct category key', () => {
      expect(CacheKeys.CATEGORIES_ALL).toBe('categories:all');
    });

    it('generates user-specific keys', () => {
      const userId = 'user-abc';
      expect(CacheKeys.NOTIFICATION_COUNT(userId)).toBe(`notif_count:${userId}`);
      expect(CacheKeys.DASHBOARD_SUMMARY(userId)).toBe(`dashboard:${userId}`);
      expect(CacheKeys.CODING_STATS(userId)).toBe(`coding_stats:${userId}`);
    });

    it('generates daily challenge key for today', () => {
      const today = new Date().toISOString().slice(0, 10);
      expect(CacheKeys.DAILY_CHALLENGE()).toBe(`daily_challenge:${today}`);
    });
  });
});
