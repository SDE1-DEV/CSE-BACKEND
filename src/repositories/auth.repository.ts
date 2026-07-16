import { RefreshToken, EmailVerification, PasswordReset } from '@prisma/client';
import { prisma } from '../config/database';

export class AuthRepository {
  // ── Refresh Tokens ──────────────────────────────────────────────────────────

  async createRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { token } });
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async deleteExpiredRefreshTokens(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  // ── Email Verification ──────────────────────────────────────────────────────

  async upsertEmailVerification(email: string, otp: string, expiresAt: Date): Promise<EmailVerification> {
    // Delete existing OTPs for this email first
    await prisma.emailVerification.deleteMany({ where: { email } });
    return prisma.emailVerification.create({
      data: { email, otp, expiresAt, verified: false },
    });
  }

  async findEmailVerification(email: string, otp: string): Promise<EmailVerification | null> {
    return prisma.emailVerification.findFirst({
      where: {
        email,
        otp,
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async markEmailVerified(id: string): Promise<void> {
    await prisma.emailVerification.update({
      where: { id },
      data: { verified: true },
    });
  }

  async deleteExpiredEmailVerifications(): Promise<void> {
    await prisma.emailVerification.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  // ── Password Reset ───────────────────────────────────────────────────────────

  async upsertPasswordReset(email: string, otp: string, expiresAt: Date): Promise<PasswordReset> {
    await prisma.passwordReset.deleteMany({ where: { email } });
    return prisma.passwordReset.create({
      data: { email, otp, expiresAt },
    });
  }

  async findPasswordReset(email: string, otp: string): Promise<PasswordReset | null> {
    return prisma.passwordReset.findFirst({
      where: {
        email,
        otp,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async deletePasswordReset(id: string): Promise<void> {
    await prisma.passwordReset.delete({ where: { id } });
  }

  async deleteAllPasswordResets(email: string): Promise<void> {
    await prisma.passwordReset.deleteMany({ where: { email } });
  }
}

export const authRepository = new AuthRepository();
