import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { sendError } from '../utils/response';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';

export const requireRole = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
      return;
    }

    next();
  };
};

// ── PRD-08: Final role guards ─────────────────────────────────────────────────

/** Only SUPER_ADMIN can access — ADMIN role is removed per PRD-08 */
export const requireSuperAdmin = requireRole(Role.SUPER_ADMIN);

/** MANAGER or SUPER_ADMIN can access manager routes */
export const requireManager = requireRole(Role.MANAGER, Role.SUPER_ADMIN);

/** Any authenticated user (STUDENT, MENTOR, MANAGER, SUPER_ADMIN) */
export const requireStudent = requireRole(
  Role.STUDENT,
  Role.MENTOR,
  Role.MANAGER,
  Role.SUPER_ADMIN,
);

/** MENTOR or above */
export const requireMentor = requireRole(Role.MENTOR, Role.MANAGER, Role.SUPER_ADMIN);

// ── Legacy aliases (backward compat) ──────────────────────────────────────────
/** @deprecated Use requireSuperAdmin instead. ADMIN role is removed per PRD-08. */
export const requireAdmin = requireRole(Role.SUPER_ADMIN);
