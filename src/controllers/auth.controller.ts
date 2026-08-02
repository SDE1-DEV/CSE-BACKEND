import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { MESSAGES, HTTP_STATUS } from '../constants';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput, RefreshTokenInput, ChangePasswordInput, UpdateProfileInput } from '../validators/auth.validator';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/error.middleware';
import { env } from '../config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction(),
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Creates a new user account and immediately returns access and refresh tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already exists
 */
export const register = async (
  req: Request<object, object, RegisterInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { fullName, email, password, phoneNumber } = req.body;
    const result = await authService.register(fullName, email, password, phoneNumber);

    res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

    sendCreated(res, MESSAGES.REGISTER_SUCCESS, {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful, returns tokens and user data
 *       401:
 *         description: Invalid credentials
 */
export const login = async (
  req: Request<object, object, LoginInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

    sendSuccess(res, MESSAGES.LOGIN_SUCCESS, {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout and invalidate refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
export const logout = async (
  req: Request<object, object, RefreshTokenInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const refreshToken = req.body.refreshToken || (req.cookies as Record<string, string>)['refreshToken'];
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', { path: '/api/auth' });
    sendSuccess(res, MESSAGES.LOGOUT_SUCCESS, null);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid or expired refresh token
 */
export const refresh = async (
  req: Request<object, object, RefreshTokenInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const refreshToken = req.body.refreshToken || (req.cookies as Record<string, string>)['refreshToken'];
    if (!refreshToken) {
      res.status(401).json({ success: false, message: MESSAGES.TOKEN_INVALID, data: null, errors: null });
      return;
    }
    const result = await authService.refresh(refreshToken);

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    sendSuccess(res, MESSAGES.TOKEN_REFRESHED, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: OTP sent to email if account exists
 */
export const forgotPassword = async (
  req: Request<object, object, ForgotPasswordInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    sendSuccess(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password using OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired OTP
 */
export const resetPassword = async (
  req: Request<object, object, ResetPasswordInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await authService.resetPassword(email, otp, newPassword);
    sendSuccess(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current authenticated user (always fresh from DB)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data with latest role
 *       401:
 *         description: Unauthorized
 */
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    }
    // Always fetch fresh from DB — never return stale role from JWT
    const result = await authService.getMe(req.user.userId);
    sendSuccess(res, MESSAGES.PROFILE_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/change-password:
 *   patch:
 *     tags: [Authentication]
 *     summary: Change password for authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized or wrong current password
 */
export const changePassword = async (
  req: AuthenticatedRequest & Request<object, object, ChangePasswordInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    }
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.userId, currentPassword, newPassword);
    sendSuccess(res, result.message, null);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/auth/update-profile:
 *   patch:
 *     tags: [Authentication]
 *     summary: Update profile fields for authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
export const updateAuthProfile = async (
  req: AuthenticatedRequest & Request<object, object, UpdateProfileInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
    }
    const result = await authService.updateProfile(req.user.userId, req.body);
    sendSuccess(res, MESSAGES.PROFILE_UPDATED, result);
  } catch (error) {
    next(error);
  }
};