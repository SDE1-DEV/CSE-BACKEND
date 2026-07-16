/**
 * PRD-07: Audit Middleware
 *
 * auditAction(action, module, entity?) — records every privileged action to AuditLog.
 * Used as a post-response middleware that still fires even on errors.
 */

import { Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';

interface AuditOptions {
  action: string;
  module?: string;
  entity?: string;
  getEntityId?: (req: AuthenticatedRequest) => string | undefined;
}

/**
 * Builds an Express middleware that writes an AuditLog row after the handler
 * runs (response is already sent). Errors in audit writing are silently logged
 * so they never break the main request.
 */
export const auditAction = (opts: AuditOptions) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Hook into `res.json` to capture the response and fire audit after send
    const originalJson = res.json.bind(res);

    res.json = (body: unknown) => {
      // Write audit asynchronously — do not await
      writeAudit(req, opts, body).catch((err) =>
        logger.error('Audit write failed', { error: err }),
      );
      return originalJson(body);
    };

    next();
  };
};

async function writeAudit(
  req: AuthenticatedRequest,
  opts: AuditOptions,
  _responseBody: unknown,
): Promise<void> {
  if (!req.user) return;

  const entityId = opts.getEntityId ? opts.getEntityId(req) : req.params['id'];
  const newValueData =
    req.method !== 'GET' ? (req.body as Prisma.InputJsonValue) : Prisma.JsonNull;

  await prisma.auditLog.create({
    data: {
      performedBy: req.user.userId,
      targetUser: (req.body?.userId as string | undefined) ?? req.params['id'] ?? null,
      role: req.user.role,
      action: opts.action,
      module: opts.module ?? null,
      entity: opts.entity ?? null,
      entityId: entityId ?? null,
      oldValue: Prisma.JsonNull,
      newValue: newValueData,
      ipAddress: req.ip ?? req.socket?.remoteAddress ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    },
  });
}
