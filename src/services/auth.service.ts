import { User, Role } from '@prisma/client';
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
import { managerPermissionRepository } from '../repositories/admin/manager-permission.repository';
import { IUpdateProfileDto } from '../interfaces/user.interface';

const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days default

const parseExpiry = (_expiry: string): Date => {
  return new Date(Date.now() + REFRESH_EXPIRY_MS);
};

export class AuthService {
  /**
   * Build the JWT payload, including permissions for MANAGER role.
   */
  private async buildTokenPayload(user: User) {
    const base = { userId: user.id, email: user.email, role: user.role };

    if (user.role === Role.SUPER_ADMIN) {
      // SUPER_ADMIN has full access — include wildcard sentinel in JWT
      return { ...base, permissions: ['*'] };
    }

    if (user.role === Role.MANAGER) {
      const permissions = await managerPermissionRepository.getModuleNames(user.id);
      return { ...base, permissions };
    }

    return base;
  }

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

    // Create user
    // When ENABLE_EMAIL_VERIFICATION=false (development), auto-verify on creation.
    // When true (production), set isVerified=false and send OTP.
    const autoVerify = !env.isEmailVerificationEnabled();

    const user = await userRepository.create({
      fullName,
      email,
      passwordHash,
      phoneNumber: phoneNumber ?? null,
      isVerified: autoVerify,
    });

    // Send OTP only if email verification is enabled
    if (env.isEmailVerificationEnabled()) {
      const otp = generateOtp();
      const expiresAt = getOtpExpiry();
      await authRepository.upsertEmailVerification(email, otp, expiresAt);
      try {
        await enqueueEmail({
          type: 'email:verification',
          to: email,
          payload: { otp },
        });
      } catch {
        if (env.isDevelopment()) {
          // eslint-disable-next-line no-console
          console.log(`[DEV] Email verification OTP for ${email}: ${otp}`);
        }
      }
    }

    // Generate tokens — include permissions for MANAGER role (PRD-07)
    const tokenPayload = await this.buildTokenPayload(user);
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

    // When email verification is enabled, require the user to be verified before login
    if (env.isEmailVerificationEnabled() && !user.isVerified) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.EMAIL_NOT_VERIFIED);
    }

    // Generate tokens — include permissions for MANAGER role (PRD-07)
    const tokenPayload = await this.buildTokenPayload(user);
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

    // Include permissions for MANAGER role (PRD-07)
    const tokenPayload = await this.buildTokenPayload(user);

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

  /**
   * PRD-08: GET /api/auth/me
   * Always fetches latest user data from DB — never returns stale role.
   * This is the single source of truth the frontend calls on every reload.
   */
  async getMe(userId: string): Promise<object> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.USER_NOT_FOUND);
    }

    // Build fresh permissions for MANAGER role
    let permissions: string[] = [];
    if (user.role === Role.MANAGER) {
      permissions = await managerPermissionRepository.getModuleNames(user.id);
    }
    // SUPER_ADMIN has full access — return a sentinel so frontend can reflect this
    if (user.role === Role.SUPER_ADMIN) {
      permissions = ['*'];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _pw, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, permissions };
  }

  /**
   * PRD-08: PATCH /api/auth/change-password
   * Verifies current password, then sets new one and rotates all sessions.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.USER_NOT_FOUND);
    }

    const passwordMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Current password is incorrect');
    }

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePassword(userId, passwordHash);

    // Invalidate all refresh tokens — forces re-login everywhere
    await authRepository.deleteAllUserRefreshTokens(userId);

    return { message: MESSAGES.PASSWORD_RESET_SUCCESS };
  }

  /**
   * PRD-08: PATCH /api/auth/update-profile
   * Updates basic profile fields for the authenticated user.
   */
  async updateProfile(userId: string, data: IUpdateProfileDto): Promise<object> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.USER_NOT_FOUND);
    }

    const updated = await userRepository.updateProfile(userId, data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _pw, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
