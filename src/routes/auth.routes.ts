import { Router } from 'express';
import {
  register,
  verifyEmail,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
  updateAuthProfile,
} from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateAuthProfileSchema,
} from '../validators/auth.validator';
import { authenticate } from '../middlewares/authenticate.middleware';
import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../constants';

const router = Router();

const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs,
  max: RATE_LIMITS.AUTH.max,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    data: null,
    errors: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

// ── Public routes ──────────────────────────────────────────────────────────────
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), verifyEmail);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', validate(refreshTokenSchema), logout);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

// ── PRD-08: Protected auth routes ─────────────────────────────────────────────
// GET /me — always fetches latest role/user from DB (never cached)
router.get('/me', authenticate, getMe);
// PATCH /change-password — change password for authenticated user
router.patch('/change-password', authenticate, validate(changePasswordSchema), changePassword);
// PATCH /update-profile — update profile fields for authenticated user
router.patch('/update-profile', authenticate, validate(updateAuthProfileSchema), updateAuthProfile);

export default router;
