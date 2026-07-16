/**
 * Health & Metrics Controllers
 * PRD-06: Section 16 — Health Endpoints
 * PRD-06: Section 8  — Monitoring & Observability
 *
 * Endpoints:
 *   GET /api/v1/health            — overall health
 *   GET /api/v1/health/database   — database health
 *   GET /api/v1/health/cache      — Redis health
 *   GET /api/v1/health/queue      — BullMQ queue health
 *   GET /api/v1/metrics           — Prometheus metrics
 */

import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { MESSAGES } from '../constants';
import { prisma } from '../config/database';
import { cacheService } from '../services/cache.service';
import { metricsService } from '../services/metrics.service';
import { emailQueue } from '../queues/email.queue';
import { notificationQueue } from '../queues/notification.queue';
import { analyticsQueue } from '../queues/analytics.queue';
import { cleanupQueue } from '../queues/cleanup.queue';
import { wsGateway } from '../websocket/gateway';
import { logger } from '../utils/logger';

// ── Overall Health ─────────────────────────────────────────────────────────────
export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  const [dbStatus, cacheStatus] = await Promise.all([checkDatabase(), checkCache()]);

  const overall = dbStatus.status === 'healthy' ? 'healthy' : 'degraded';

  sendSuccess(res, MESSAGES.HEALTH_OK, {
    status: overall,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'],
    version: process.env['npm_package_version'] ?? '1.0.0',
    database: dbStatus,
    cache: cacheStatus,
    connectedSockets: wsGateway.getConnectedCount(),
  });
};

// ── Database Health ─────────────────────────────────────────────────────────────
export const databaseHealthCheck = async (_req: Request, res: Response): Promise<void> => {
  const status = await checkDatabase();
  sendSuccess(res, 'Database health', status);
};

// ── Cache Health ────────────────────────────────────────────────────────────────
export const cacheHealthCheck = async (_req: Request, res: Response): Promise<void> => {
  const status = await checkCache();
  sendSuccess(res, 'Cache health', status);
};

// ── Queue Health ─────────────────────────────────────────────────────────────────
export const queueHealthCheck = async (_req: Request, res: Response): Promise<void> => {
  const status = await checkQueues();
  sendSuccess(res, 'Queue health', status);
};

// ── Prometheus Metrics ──────────────────────────────────────────────────────────
export const prometheusMetrics = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Update socket count gauge before exporting
    metricsService.setConnectedSockets(wsGateway.getConnectedCount());

    res.setHeader('Content-Type', metricsService.getContentType());
    res.end(await metricsService.getMetrics());
  } catch (err) {
    logger.error('Failed to export metrics', { error: (err as Error).message });
    res.status(500).end('# Error collecting metrics');
  }
};

// ── Internal helpers ────────────────────────────────────────────────────────────
const checkDatabase = async () => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      responseTime_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: (err as Error).message,
      responseTime_ms: Date.now() - start,
    };
  }
};

const checkCache = async () => {
  const start = Date.now();
  const available = await cacheService.ping();
  return {
    status: available ? 'healthy' : 'unavailable',
    responseTime_ms: Date.now() - start,
  };
};

const checkQueues = async () => {
  const queues = [emailQueue, notificationQueue, analyticsQueue, cleanupQueue];
  const names = ['email', 'notification', 'analytics', 'cleanup'];
  const results: Record<string, unknown> = {};

  for (let i = 0; i < queues.length; i++) {
    try {
      const counts = await queues[i].getJobCounts('waiting', 'active', 'failed', 'delayed');
      results[names[i]] = { status: 'operational', ...counts };

      // Update queue size metrics
      metricsService.setQueueSize(names[i], (counts.waiting ?? 0) + (counts.delayed ?? 0));
    } catch {
      results[names[i]] = { status: 'unavailable' };
    }
  }

  return results;
};
