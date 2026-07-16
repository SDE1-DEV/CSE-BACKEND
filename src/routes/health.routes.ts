/**
 * Health & Metrics Routes
 * PRD-06: Section 16 — Health Endpoints
 *
 * GET /api/v1/health
 * GET /api/v1/health/database
 * GET /api/v1/health/cache
 * GET /api/v1/health/queue
 */

import { Router } from 'express';
import {
  healthCheck,
  databaseHealthCheck,
  cacheHealthCheck,
  queueHealthCheck,
  prometheusMetrics,
} from '../controllers/health.controller';

const router = Router();

router.get('/', healthCheck);
router.get('/database', databaseHealthCheck);
router.get('/cache', cacheHealthCheck);
router.get('/queue', queueHealthCheck);
router.get('/metrics', prometheusMetrics);

export default router;
