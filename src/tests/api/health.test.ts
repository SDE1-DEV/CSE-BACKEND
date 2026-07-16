/**
 * API Tests — Health Endpoints
 * PRD-06: Section 12 + Section 16
 */

import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../app';

// Mock prisma for health checks
vi.mock('../../config/database', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $on: vi.fn(),
  },
  connectDatabase: vi.fn(),
  disconnectDatabase: vi.fn(),
}));

describe('Health Endpoints', () => {
  describe('GET /api/v1/health', () => {
    it('returns 200 with health data', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/v1/health/database', () => {
    it('returns database status', async () => {
      const response = await request(app).get('/api/v1/health/database');
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('responseTime_ms');
    });
  });

  describe('GET /api/v1/health/cache', () => {
    it('returns cache status', async () => {
      const response = await request(app).get('/api/v1/health/cache');
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('status');
    });
  });

  describe('GET /api/v1/health/queue', () => {
    it('returns queue status', async () => {
      const response = await request(app).get('/api/v1/health/queue');
      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });
});
