/**
 * Integration Tests — Auth Service
 * PRD-06: Section 12 — Testing (Integration)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { AppError } from '../../middlewares/error.middleware';

// ── Mock all external dependencies ────────────────────────────────────────────
vi.mock('../../repositories/user.repository', () => ({
  userRepository: {
    existsByEmail: vi.fn(),
    create: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
    setVerified: vi.fn(),
    updateLastLogin: vi.fn(),
    updatePassword: vi.fn(),
  },
}));

vi.mock('../../repositories/auth.repository', () => ({
  authRepository: {
    upsertEmailVerification: vi.fn(),
    findEmailVerification: vi.fn(),
    markEmailVerified: vi.fn(),
    deleteExpiredEmailVerifications: vi.fn(),
    createRefreshToken: vi.fn(),
    findRefreshToken: vi.fn(),
    deleteRefreshToken: vi.fn(),
    deleteAllUserRefreshTokens: vi.fn(),
    upsertPasswordReset: vi.fn(),
    findPasswordReset: vi.fn(),
    deletePasswordReset: vi.fn(),
    deleteAllPasswordResets: vi.fn(),
  },
}));

vi.mock('../../queues/email.queue', () => ({
  enqueueEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../utils/hash', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  comparePassword: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../utils/otp', () => ({
  generateOtp: vi.fn().mockReturnValue('123456'),
  getOtpExpiry: vi.fn().mockReturnValue(new Date(Date.now() + 600_000)),
}));

import { userRepository } from '../../repositories/user.repository';
import { authRepository } from '../../repositories/auth.repository';
import { enqueueEmail } from '../../queues/email.queue';
import { comparePassword } from '../../utils/hash';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  // ── Register ────────────────────────────────────────────────────────────────
  describe('register()', () => {
    it('creates user and enqueues verification email', async () => {
      vi.mocked(userRepository.existsByEmail).mockResolvedValue(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(userRepository.create).mockResolvedValue({} as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(authRepository.upsertEmailVerification).mockResolvedValue({} as any);

      const result = await authService.register('John', 'john@test.com', 'Password1!');

      expect(result.message).toContain('verify your email');
      expect(userRepository.create).toHaveBeenCalledOnce();
      expect(enqueueEmail).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'email:verification', to: 'john@test.com' }),
      );
    });

    it('throws 409 if email already exists', async () => {
      vi.mocked(userRepository.existsByEmail).mockResolvedValue(true);
      await expect(authService.register('John', 'exists@test.com', 'Password1!')).rejects.toThrow(AppError);
    });
  });

  // ── Login ───────────────────────────────────────────────────────────────────
  describe('login()', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockUser: any = {
      id: 'u1',
      email: 'john@test.com',
      passwordHash: 'hashed',
      isVerified: true,
      role: 'STUDENT',
      fullName: 'John',
    };

    it('returns tokens and user on success', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(comparePassword).mockResolvedValue(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(authRepository.createRefreshToken).mockResolvedValue({} as any);
      vi.mocked(userRepository.updateLastLogin).mockResolvedValue(undefined as never);

      const result = await authService.login('john@test.com', 'Password1!');

      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('throws 401 if user not found', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      await expect(authService.login('nobody@test.com', 'pass')).rejects.toThrow(AppError);
    });

    it('throws 401 if password is wrong', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(comparePassword).mockResolvedValue(false);
      await expect(authService.login('john@test.com', 'wrong')).rejects.toThrow(AppError);
    });

    it('throws 401 if email not verified', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({ ...mockUser, isVerified: false });
      vi.mocked(comparePassword).mockResolvedValue(true);
      await expect(authService.login('john@test.com', 'Password1!')).rejects.toThrow(AppError);
    });
  });

  // ── Forgot Password ────────────────────────────────────────────────────────
  describe('forgotPassword()', () => {
    it('enqueues email when user exists', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(userRepository.findByEmail).mockResolvedValue({ id: 'u1', email: 'john@test.com' } as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(authRepository.upsertPasswordReset).mockResolvedValue({} as any);

      const result = await authService.forgotPassword('john@test.com');
      expect(result.message).toBe('OTP sent to your email');
      expect(enqueueEmail).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'email:password-reset' }),
      );
    });

    it('returns same message when user does NOT exist (prevents enumeration)', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      const result = await authService.forgotPassword('unknown@test.com');
      expect(result.message).toBe('OTP sent to your email');
      expect(enqueueEmail).not.toHaveBeenCalled();
    });
  });
});
