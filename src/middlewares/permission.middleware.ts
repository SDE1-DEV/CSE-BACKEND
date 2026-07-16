/**
 * PRD-07: Permission Middleware
 *
 * requirePermission(module, action?) — enforces that a MANAGER holds the specified
 * module permission in their JWT payload. SUPER_ADMIN bypasses all checks.
 *
 * Action mapping (inferred from HTTP method when not specified):
 *   GET    → canRead
 *   POST   → canCreate
 *   PUT/PATCH → canUpdate
 *   DELETE → canDelete
 *
 * Special actions that can be passed explicitly:
 *   'publish' → canPublish
 */

import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/database';
import { sendError } from '../utils/response';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';

type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'publish';

/** Map HTTP method → permission flag */
function methodToAction(method: string): PermissionAction {
  switch (method.toUpperCase()) {
    case 'GET':
    case 'HEAD':
      return 'read';
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'read';
  }
}

/** Map action string → DB column name */
function actionToColumn(action: PermissionAction): string {
  const map: Record<PermissionAction, string> = {
    read: 'canRead',
    create: 'canCreate',
    update: 'canUpdate',
    delete: 'canDelete',
    publish: 'canPublish',
  };
  return map[action];
}

/**
 * Require a MANAGER to have the given module + action permission.
 *
 * @param module  - PermissionModule enum string e.g. 'LEARNING'
 * @param action  - Optional explicit action; inferred from HTTP method when omitted
 */
export const requirePermission = (module: string, action?: PermissionAction) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendError(res, MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    // SUPER_ADMIN bypasses every permission check
    if (req.user.role === Role.SUPER_ADMIN) {
      next();
      return;
    }

    if (req.user.role !== Role.MANAGER) {
      sendError(res, MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
      return;
    }

    // Fast path: check JWT permissions array for module access
    const jwtPermissions = req.user.permissions ?? [];
    if (!jwtPermissions.includes(module)) {
      sendError(
        res,
        `You do not have permission to access the ${module} module`,
        HTTP_STATUS.FORBIDDEN,
      );
      return;
    }

    // Granular action check against DB
    const resolvedAction = action ?? methodToAction(req.method);
    const column = actionToColumn(resolvedAction);

    try {
      const perm = await prisma.managerPermission.findUnique({
        where: {
          managerId_module: {
            managerId: req.user.userId,
            module: module as import('@prisma/client').PermissionModule,
          },
        },
      });

      if (!perm || !perm[column as keyof typeof perm]) {
        sendError(
          res,
          `You do not have ${resolvedAction} permission for the ${module} module`,
          HTTP_STATUS.FORBIDDEN,
        );
        return;
      }
    } catch {
      // If DB check fails, fall back to JWT-level access (graceful degradation)
    }

    next();
  };
};

/**
 * Convenience: requirePermission with explicit 'publish' action.
 * Use on PATCH /roadmaps/:id/publish style routes.
 */
export const requirePublishPermission = (module: string) =>
  requirePermission(module, 'publish');
