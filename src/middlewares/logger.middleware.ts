/**
 * Request Logger Middleware with Correlation IDs
 * PRD-06: Section 9 — Logging Improvements
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { metricsService } from '../services/metrics.service';

export interface RequestWithCorrelation extends Request {
  correlationId?: string;
  startTime?: number;
}

export const requestLogger = (
  req: RequestWithCorrelation,
  res: Response,
  next: NextFunction,
): void => {
  const correlationId =
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    uuidv4();

  req.correlationId = correlationId;
  req.startTime = Date.now();

  // Expose correlation ID to client for tracing
  res.setHeader('x-correlation-id', correlationId);

  res.on('finish', () => {
    const duration = Date.now() - (req.startTime ?? Date.now());
    const { statusCode } = res;
    const { method, originalUrl } = req;
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';

    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger.log(logLevel, `${method} ${originalUrl} ${statusCode} ${duration}ms`, {
      correlationId,
      method,
      url: originalUrl,
      statusCode,
      duration_ms: duration,
      ip,
      userAgent: req.headers['user-agent'],
    });

    // Record metrics
    metricsService.recordHttpRequest(method, originalUrl, statusCode, duration / 1000);
  });

  next();
};
