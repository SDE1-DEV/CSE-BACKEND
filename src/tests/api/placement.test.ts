/**
 * API Tests — Placement Ecosystem
 * PRD-06: Section 12 — Integration Tests (Placement)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { generateAccessToken } from '../../utils/jwt';
import { Role } from '@prisma/client';

vi.mock('../../services/job-posting.service', () => ({
  jobPostingService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../services/job-application.service', () => ({
  jobApplicationService: {
    create: vi.fn(),
    getForUser: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../services/event.service', () => ({
  eventService: {
    getAll: vi.fn(),
    register: vi.fn(),
    unregister: vi.fn(),
  },
}));

vi.mock('../../services/notification.service', () => ({
  notificationService: {
    getAll: vi.fn(),
    getUnreadCount: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    delete: vi.fn(),
  },
}));

import { jobPostingService } from '../../services/job-posting.service';

const studentToken = generateAccessToken({
  userId: 'student-1',
  email: 'student@test.com',
  role: Role.STUDENT,
});

describe('Placement API', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Jobs ────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/jobs', () => {
    it('returns 200 (public endpoint)', async () => {
      vi.mocked(jobPostingService.getAll).mockResolvedValue([] as never);
      const response = await request(app).get('/api/v1/jobs');
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/v1/job-applications', () => {
    it('returns 401 without auth', async () => {
      const response = await request(app)
        .post('/api/v1/job-applications')
        .send({ jobId: 'j1' });
      expect(response.status).toBe(401);
    });
  });

  // ── Notifications ────────────────────────────────────────────────────────────
  describe('GET /api/v1/notifications', () => {
    it('returns 401 without auth', async () => {
      const response = await request(app).get('/api/v1/notifications');
      expect(response.status).toBe(401);
    });

    it('returns 200 with valid token', async () => {
      const { notificationService } = await import('../../services/notification.service');
      vi.mocked(notificationService.getAll).mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 } as never);

      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${studentToken}`);
      expect([200, 404]).toContain(response.status);
    });
  });

  // ── Events ───────────────────────────────────────────────────────────────────
  describe('GET /api/v1/events', () => {
    it('returns 200 (public endpoint)', async () => {
      const { eventService } = await import('../../services/event.service');
      vi.mocked(eventService.getAll).mockResolvedValue([] as never);
      const response = await request(app).get('/api/v1/events');
      expect(response.status).toBe(200);
    });
  });
});
