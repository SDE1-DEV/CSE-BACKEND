import { Router } from 'express';
import {
  register,
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
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateAuthProfileSchema,
} from '../validators/auth.validator';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

// ── Public routes ──────────────────────────────────────────────────────────────
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', validate(refreshTokenSchema), logout);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

// ── PRD-08: Protected auth routes ─────────────────────────────────────────────
router.get('/me', authenticate, getMe);
router.patch('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.patch('/update-profile', authenticate, validate(updateAuthProfileSchema), updateAuthProfile);

export default router;
