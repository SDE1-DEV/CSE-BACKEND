/**
 * Security Hardening Middleware
 * PRD-06: Section 13 — Security Hardening
 *
 * - CSP headers (via helmet)
 * - Input sanitization
 * - HTTP parameter pollution prevention
 * - Secure cookie settings
 * - Audit logging for admin actions
 * - CSRF protection (production only)
 */

import { Request, Response, NextFunction } from 'express';
import { FilterXSS } from 'xss';
import hpp from 'hpp';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';
import { env } from '../config/env';
import crypto from 'crypto';

// XSS filter instance
const xssFilter = new FilterXSS({
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
});

/**
 * Fields that must NOT be XSS-sanitized — raw code sent to the judge.
 * HTML encoding `<`, `>`, `&` in source code breaks compilation.
 */
const CODE_FIELDS = new Set(['sourceCode', 'code', 'template', 'content']);

/**
 * Deep sanitize strings in an object against XSS.
 * Skips fields in CODE_FIELDS to preserve raw source code.
 */
const sanitizeObject = (obj: unknown, parentKey?: string): unknown => {
  if (typeof obj === 'string') {
    // Never XSS-sanitize source code fields
    if (parentKey && CODE_FIELDS.has(parentKey)) return obj;
    return xssFilter.process(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, parentKey));
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k,
        sanitizeObject(v, k),
      ]),
    );
  }
  return obj;
};

/**
 * Input sanitization middleware — strips XSS from body/query/params.
 * Code fields (sourceCode, code, template, content) are preserved as-is.
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) req.body = sanitizeObject(req.body) as typeof req.body;
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

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return false;
  const allowed = [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'];
  return allowed.includes(origin);
};

/**
 * Issues a CSRF double-submit cookie on safe requests when one is missing.
 */
const issueCsrfCookie = (req: Request, res: Response): void => {
  if (!req.cookies || !req.cookies['_csrf']) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('_csrf', token, {
      httpOnly: true,
      secure: env.isProduction(),
      sameSite: 'strict',
      path: '/',
    });
  }
};

/**
 * CSRF Protection middleware.
 *
 * - Development: disabled (pass-through)
 * - Production: double-submit cookie pattern + defence-in-depth checks:
 *   Allows state-changing request if ANY of:
 *   1. X-CSRF-Token header matches the _csrf cookie
 *   2. Bearer Authorization header present (not auto-attached by browsers)
 *   3. X-Requested-With custom header present
 *   4. Origin header is explicitly allowed
 */
export const csrfProtect = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!env.isProduction()) {
    next();
    return;
  }

  if (!STATE_CHANGING_METHODS.has(req.method)) {
    issueCsrfCookie(req, res);
    next();
    return;
  }

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  if (req.headers['x-requested-with']) {
    next();
    return;
  }

  const origin = req.headers['origin'];
  if (isOriginAllowed(origin)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.['_csrf'];
  const headerToken = req.headers['x-csrf-token'] as string | undefined;
  if (cookieToken && headerToken && cookieToken === headerToken) {
    next();
    return;
  }

  logger.warn('CSRF check failed', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    hasAuth: !!authHeader,
    hasXRequestedWith: !!req.headers['x-requested-with'],
    origin,
  });

  res.status(403).json({
    success: false,
    message: 'CSRF validation failed',
    data: null,
    errors: null,
  });
};
