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

// ── Legacy roles (backward compat) ────────────────────────────────────────────
export const requireAdmin = requireRole(Role.ADMIN, Role.SUPER_ADMIN);
export const requireMentor = requireRole(Role.MENTOR, Role.ADMIN, Role.SUPER_ADMIN);
export const requireStudent = requireRole(
  Role.STUDENT,
  Role.MENTOR,
  Role.ADMIN,
  Role.MANAGER,
  Role.SUPER_ADMIN,
);

// ── PRD-07: New role guards ────────────────────────────────────────────────────

/** Only SUPER_ADMIN can access */
export const requireSuperAdmin = requireRole(Role.SUPER_ADMIN);

/** MANAGER or SUPER_ADMIN can access manager routes */
export const requireManager = requireRole(Role.MANAGER, Role.SUPER_ADMIN);
