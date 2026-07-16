import { User } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { authRepository } from '../repositories/auth.repository';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateOtp, getOtpExpiry } from '../utils/otp';
import { enqueueEmail } from '../queues/email.queue';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { TokenPair } from '../types';
import { env } from '../config/env';

const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days default

const parseExpiry = (_expiry: string): Date => {
  return new Date(Date.now() + REFRESH_EXPIRY_MS);
};

export class AuthService {
  async register(
    fullName: string,
    email: string,
    password: string,
    phoneNumber?: string,
  ): Promise<{ user: Omit<User, 'passwordHash'>; tokens: TokenPair }> {
    // Check if email already exists
    const exists = await userRepository.existsByEmail(email);
    if (exists) {
      throw new AppError(HTTP_STATUS.CONFLICT, MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user — pre-verified, no email confirmation required
    const user = await userRepository.create({
      fullName,
      email,
      passwordHash,
      phoneNumber: phoneNumber ?? null,
      isVerified: true,
    });

    // Generate tokens
    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const expiresAt = parseExpiry(env.REFRESH_EXPIRY);
    await authRepository.createRefreshToken(user.id, refreshToken, expiresAt);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _pw, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      tokens: { accessToken, refreshToken },
    };
  }

  async verifyEmail(email: string, otp: string): Promise<{ message: string }> {
    const verification = await authRepository.findEmailVerification(email, otp);

    if (!verification) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, MESSAGES.INVALID_OTP);
    }

    // Mark OTP verified
    await authRepository.markEmailVerified(verification.id);

    // Find user and activate account
    const user = await userRepository.findByEmail(email);
    if (user) {
      await userRepository.setVerified(user.id);
    }

    // Cleanup expired OTPs
    await authRepository.deleteExpiredEmailVerifications();

    return { message: MESSAGES.EMAIL_VERIFIED };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: Omit<User, 'passwordHash'>; tokens: TokenPair }> {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_CREDENTIALS);
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_CREDENTIALS);
    }

    // Generate tokens
    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const expiresAt = parseExpiry(env.REFRESH_EXPIRY);
    await authRepository.createRefreshToken(user.id, refreshToken, expiresAt);

    // Record login time
    await userRepository.updateLastLogin(user.id);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _pw, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      tokens: { accessToken, refreshToken },
    };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    await authRepository.deleteRefreshToken(refreshToken);
    return { message: MESSAGES.LOGOUT_SUCCESS };
  }

  /**
   * Refresh token rotation: issues a new refresh token and invalidates the old one.
   * PRD-06: Section 13 — Security Hardening (refresh token rotation)
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const stored = await authRepository.findRefreshToken(refreshToken);

    if (!stored) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.TOKEN_INVALID);
    }

    if (new Date() > stored.expiresAt) {
      await authRepository.deleteRefreshToken(refreshToken);
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.TOKEN_INVALID);
    }

    let payload: ReturnType<typeof verifyRefreshToken>;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      await authRepository.deleteRefreshToken(refreshToken);
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.TOKEN_INVALID);
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.TOKEN_INVALID);
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };

    // Rotate: delete old token, issue new pair
    await authRepository.deleteRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);
    const expiresAt = parseExpiry(env.REFRESH_EXPIRY);
    await authRepository.createRefreshToken(user.id, newRefreshToken, expiresAt);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(email);

    // Always return same message to prevent email enumeration
    if (!user) {
      return { message: MESSAGES.OTP_SENT };
    }

    const otp = generateOtp();
    const expiresAt = getOtpExpiry();
    await authRepository.upsertPasswordReset(email, otp, expiresAt);

    try {
      await enqueueEmail({
        type: 'email:password-reset',
        to: email,
        payload: { otp },
      });
    } catch {
      if (env.isDevelopment()) {
        // eslint-disable-next-line no-console
        console.log(`[DEV] Password reset OTP for ${email}: ${otp}`);
      }
    }

    return { message: MESSAGES.OTP_SENT };
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const resetRecord = await authRepository.findPasswordReset(email, otp);

    if (!resetRecord) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, MESSAGES.INVALID_OTP);
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePassword(user.id, passwordHash);

    // Delete reset record
    await authRepository.deletePasswordReset(resetRecord.id);

    // Invalidate all refresh tokens
    await authRepository.deleteAllUserRefreshTokens(user.id);

    return { message: MESSAGES.PASSWORD_RESET_SUCCESS };
  }
}

export const authService = new AuthService();
