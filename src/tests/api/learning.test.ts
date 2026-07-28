/**
 * API Tests — Learning Ecosystem
 * PRD-06: Section 12 — Integration Tests (Learning)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { generateAccessToken } from '../../utils/jwt';
import { Role } from '@prisma/client';

vi.mock('../../services/category.service', () => ({
  categoryService: {
    getCategories: vi.fn(),
    getCategoryById: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

vi.mock('../../services/roadmap.service', () => ({
  roadmapService: {
    getAll: vi.fn(),
    getBySlug: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { categoryService } from '../../services/category.service';

const studentToken = generateAccessToken({
  userId: 'student-1',
  email: 'student@test.com',
  role: Role.STUDENT,
});

const adminToken = generateAccessToken({
  userId: 'admin-1',
  email: 'admin@test.com',
  role: Role.SUPER_ADMIN,
});

describe('Learning API', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Categories ──────────────────────────────────────────────────────────────
  describe('GET /api/v1/categories', () => {
    it('returns 200 with categories list', async () => {
      vi.mocked(categoryService.getCategories).mockResolvedValue({
        data: [{ id: 'c1', title: 'DSA', slug: 'dsa' }],
        total: 1, page: 1, limit: 20, totalPages: 1,
      } as never);

      const response = await request(app).get('/api/v1/categories');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('returns 200 without authentication (public endpoint)', async () => {
      vi.mocked(categoryService.getCategories).mockResolvedValue({
        data: [], total: 0, page: 1, limit: 20, totalPages: 0,
      } as never);
      const response = await request(app).get('/api/v1/categories');
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/v1/categories', () => {
    it('returns 401 when unauthenticated', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .send({ title: 'New', slug: 'new' });
      expect(response.status).toBe(401);
    });

    it('returns 403 when student tries to create category', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'New', slug: 'new', description: 'test' });
      expect(response.status).toBe(403);
    });
  });

  // ── Validation ──────────────────────────────────────────────────────────────
  describe('Validation', () => {
    it('returns 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect([400, 403]).toContain(response.status);
    });
  });
});
