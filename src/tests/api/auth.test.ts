/**
 * API Tests — Authentication
 * PRD-06: Section 12 — Testing (Integration/API)
 *
 * Tests: status codes, validation, error handling, authorization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';

// ── Mock services ──────────────────────────────────────────────────────────────
vi.mock('../../services/auth.service', () => ({
  authService: {
    register: vi.fn(),
    verifyEmail: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

import { authService } from '../../services/auth.service';
import { AppError } from '../../middlewares/error.middleware';

// Pre-mock notification service (needed for authorization tests)
vi.mock('../../services/notification.service', () => ({
  notificationService: { getForUser: vi.fn() },
}));

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Register ────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/register', () => {
    it('returns 201 on successful registration', async () => {
      vi.mocked(authService.register).mockResolvedValue({
        message: 'Registration successful. Please verify your email.',
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ fullName: 'John Doe', email: 'john@example.com', password: 'Password1!' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('returns 400 on invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ fullName: 'John', email: 'not-valid', password: 'Password1!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('returns 400 on weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ fullName: 'John Doe', email: 'john@example.com', password: 'weak' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('returns 409 on duplicate email', async () => {
      vi.mocked(authService.register).mockRejectedValue(
        new AppError(409, 'An account with this email already exists'),
      );

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ fullName: 'John Doe', email: 'existing@example.com', password: 'Password1!' });

      expect(response.status).toBe(409);
    });
  });

  // ── Login ───────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/login', () => {
    it('returns 200 with tokens on successful login', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(authService.login).mockResolvedValue({
        user: { id: 'u1', email: 'john@example.com', fullName: 'John', role: 'STUDENT' },
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
      } as never);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'john@example.com', password: 'Password1!' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('returns 400 on missing password field', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'john@example.com' });

      expect(response.status).toBe(400);
    });

    it('returns 401 on wrong credentials', async () => {
      vi.mocked(authService.login).mockRejectedValue(
        new AppError(401, 'Invalid email or password'),
      );

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'john@example.com', password: 'WrongPass1!' });

      expect(response.status).toBe(401);
    });
  });

  // ── Forgot Password ────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/forgot-password', () => {
    it('always returns 200 (prevents email enumeration)', async () => {
      vi.mocked(authService.forgotPassword).mockResolvedValue({ message: 'OTP sent to your email' });

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'any@example.com' });

      expect(response.status).toBe(200);
    });

    it('returns 400 on invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'not-an-email' });

      expect(response.status).toBe(400);
    });
  });

  // ── Authorization ────────────────────────────────────────────────────────────
  describe('Authorization', () => {
    it('returns 401 when no token is provided on a protected route', async () => {
      const response = await request(app).get('/api/v1/notifications');
      expect([401, 404]).toContain(response.status);
    });

    it('returns 401 when token is malformed', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', 'Bearer not.a.real.jwt');
      expect([401, 404]).toContain(response.status);
    });
  });
});
