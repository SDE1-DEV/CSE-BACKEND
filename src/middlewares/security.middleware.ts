/**
 * Security Hardening Middleware
 * PRD-06: Section 13 — Security Hardening
 *
 * - CSP headers (via helmet)
 * - Input sanitization
 * - HTTP parameter pollution prevention
 * - Secure cookie settings
 * - Audit logging for admin actions
 */

import { Request, Response, NextFunction } from 'express';
import { FilterXSS } from 'xss';
import hpp from 'hpp';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

// XSS filter instance
const xssFilter = new FilterXSS({
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
});

/**
 * Deep sanitize strings in an object against XSS.
 */
const sanitizeObject = (obj: unknown): unknown => {
  if (typeof obj === 'string') {
    return xssFilter.process(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, sanitizeObject(v)]),
    );
  }
  return obj;
};

/**
 * Input sanitization middleware — strips XSS from body/query/params.
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query) as typeof req.query;
  if (req.params) req.params = sanitizeObject(req.params) as typeof req.params;
  next();
};

/**
 * HTTP Parameter Pollution prevention.
 * Keeps the last value for listed params, first for others.
 */
export const preventParamPollution = hpp({
  whitelist: ['sort', 'fields', 'filter', 'type', 'status', 'difficulty'],
});

/**
 * Audit logging for admin actions.
 */
export const auditLog = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const userId = req.user?.userId ?? 'anonymous';
  const role = req.user?.role ?? 'UNKNOWN';

  logger.info('Admin action', {
    userId,
    role,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    body: req.method !== 'GET' ? JSON.stringify(req.body).slice(0, 500) : undefined,
    correlationId: (req as { correlationId?: string }).correlationId,
  });

  next();
};

/**
 * File upload validation — type and size guard.
 */
export const validateFileUpload = (
  allowedTypes: string[],
  maxSizeBytes: number,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const file = req.file;
    if (!file) {
      next();
      return;
    }

    if (!allowedTypes.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: `File type not allowed. Permitted: ${allowedTypes.join(', ')}`,
        data: null,
        errors: null,
      });
      return;
    }

    if (file.size > maxSizeBytes) {
      res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${(maxSizeBytes / 1024 / 1024).toFixed(1)} MB`,
        data: null,
        errors: null,
      });
      return;
    }

    next();
  };
};
