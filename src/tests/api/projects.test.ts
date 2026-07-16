/**
 * API Tests — Project Hub & Team Collaboration
 * PRD-06: Section 12 — Integration Tests (Projects)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { generateAccessToken } from '../../utils/jwt';
import { Role } from '@prisma/client';

vi.mock('../../services/project.service', () => ({
  projectService: {
    getAll: vi.fn(),
    getBySlug: vi.fn(),
    create: vi.fn(),
    getProjects: vi.fn(),
  },
}));

vi.mock('../../services/team.service', () => ({
  teamService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    getMyTeams: vi.fn(),
  },
}));

vi.mock('../../services/task.service', () => ({
  taskService: {
    getForTeam: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { projectService } from '../../services/project.service';

const studentToken = generateAccessToken({
  userId: 'student-1',
  email: 'student@test.com',
  role: Role.STUDENT,
});

describe('Projects API', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('GET /api/v1/projects', () => {
    it('returns 200 (public endpoint)', async () => {
      vi.mocked(projectService.getProjects).mockResolvedValue({
        data: [], total: 0, page: 1, limit: 20, totalPages: 0,
      } as never);
      const response = await request(app).get('/api/v1/projects');
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/v1/teams', () => {
    it('returns 401 without auth', async () => {
      const response = await request(app)
        .post('/api/v1/teams')
        .send({ projectId: 'p1', name: 'Team Alpha' });
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/my-teams', () => {
    it('returns 401 without auth', async () => {
      const response = await request(app).get('/api/v1/my-teams');
      expect(response.status).toBe(401);
    });

    it('accepts valid auth token', async () => {
      const { teamService } = await import('../../services/team.service');
      vi.mocked(teamService.getMyTeams).mockResolvedValue([] as never);

      const response = await request(app)
        .get('/api/v1/my-teams')
        .set('Authorization', `Bearer ${studentToken}`);
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /api/v1/tasks', () => {
    it('returns 401 without auth', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .send({ teamId: 't1', title: 'Task 1' });
      expect(response.status).toBe(401);
    });
  });
});
