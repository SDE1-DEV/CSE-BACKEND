/**
 * Metrics Service — Prometheus-compatible metrics
 * PRD-06: Section 8 — Monitoring & Observability
 *
 * Tracks:
 * - Request count
 * - Response times
 * - Error rates
 * - Database query duration
 * - Cache hit/miss ratio
 * - Queue sizes
 * - Active users
 * - Memory usage
 */

import * as promClient from 'prom-client';
import { logger } from '../utils/logger';

class MetricsService {
  private register: promClient.Registry;

  // HTTP metrics
  private httpRequestDuration: promClient.Histogram<string>;
  private httpRequestTotal: promClient.Counter<string>;
  private httpErrorTotal: promClient.Counter<string>;

  // Database metrics
  private dbQueryDuration: promClient.Histogram<string>;
  private dbConnectionsActive: promClient.Gauge<string>;

  // Cache metrics
  private cacheHits: promClient.Counter<string>;
  private cacheMisses: promClient.Counter<string>;

  // Queue metrics
  private queueJobsTotal: promClient.Counter<string>;
  private queueSize: promClient.Gauge<string>;

  // App metrics
  private activeUsersGauge: promClient.Gauge<string>;
  private connectedSocketsGauge: promClient.Gauge<string>;

  constructor() {
    this.register = new promClient.Registry();

    // Collect default Node.js metrics (memory, CPU, etc.)
    promClient.collectDefaultMetrics({
      register: this.register,
      prefix: 'cse_platform_',
    });

    // HTTP metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'cse_platform_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
      registers: [this.register],
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'cse_platform_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.httpErrorTotal = new promClient.Counter({
      name: 'cse_platform_http_errors_total',
      help: 'Total number of HTTP errors (4xx/5xx)',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    // DB metrics
    this.dbQueryDuration = new promClient.Histogram({
      name: 'cse_platform_db_query_duration_ms',
      help: 'Duration of database queries in milliseconds',
      labelNames: ['operation'],
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
      registers: [this.register],
    });

    this.dbConnectionsActive = new promClient.Gauge({
      name: 'cse_platform_db_connections_active',
      help: 'Number of active database connections',
      registers: [this.register],
    });

    // Cache metrics
    this.cacheHits = new promClient.Counter({
      name: 'cse_platform_cache_hits_total',
      help: 'Total cache hits',
      labelNames: ['cache_key_prefix'],
      registers: [this.register],
    });

    this.cacheMisses = new promClient.Counter({
      name: 'cse_platform_cache_misses_total',
      help: 'Total cache misses',
      labelNames: ['cache_key_prefix'],
      registers: [this.register],
    });

    // Queue metrics
    this.queueJobsTotal = new promClient.Counter({
      name: 'cse_platform_queue_jobs_total',
      help: 'Total jobs processed by queue workers',
      labelNames: ['queue', 'status'],
      registers: [this.register],
    });

    this.queueSize = new promClient.Gauge({
      name: 'cse_platform_queue_size',
      help: 'Current number of jobs in queue',
      labelNames: ['queue'],
      registers: [this.register],
    });

    // App metrics
    this.activeUsersGauge = new promClient.Gauge({
      name: 'cse_platform_active_users',
      help: 'Number of currently active users (within last 5 min)',
      registers: [this.register],
    });

    this.connectedSocketsGauge = new promClient.Gauge({
      name: 'cse_platform_connected_sockets',
      help: 'Number of currently connected WebSocket clients',
      registers: [this.register],
    });

    logger.info('Metrics service initialized');
  }

  // HTTP
  recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number): void {
    const normalizedRoute = this.normalizeRoute(route);
    const labels = { method, route: normalizedRoute, status_code: String(statusCode) };
    this.httpRequestDuration.observe(labels, durationSeconds);
    this.httpRequestTotal.inc(labels);
    if (statusCode >= 400) {
      this.httpErrorTotal.inc(labels);
    }
  }

  // Database
  recordDbQuery(operation: string, durationMs: number): void {
    this.dbQueryDuration.observe({ operation }, durationMs);
  }

  setDbConnections(count: number): void {
    this.dbConnectionsActive.set(count);
  }

  // Cache
  recordCacheHit(keyPrefix: string): void {
    this.cacheHits.inc({ cache_key_prefix: keyPrefix });
  }

  recordCacheMiss(keyPrefix: string): void {
    this.cacheMisses.inc({ cache_key_prefix: keyPrefix });
  }

  // Queue
  recordQueueJob(queue: string, status: 'completed' | 'failed'): void {
    this.queueJobsTotal.inc({ queue, status });
  }

  setQueueSize(queue: string, size: number): void {
    this.queueSize.set({ queue }, size);
  }

  // App
  setActiveUsers(count: number): void {
    this.activeUsersGauge.set(count);
  }

  setConnectedSockets(count: number): void {
    this.connectedSocketsGauge.set(count);
  }

  /**
   * Get metrics in Prometheus text format.
   */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Get metrics as JSON object.
   */
  async getMetricsJson(): Promise<promClient.Metric[]> {
    return this.register.getMetricsAsJSON() as unknown as promClient.Metric[];
  }

  getContentType(): string {
    return this.register.contentType;
  }

  /**
   * Normalize route path to avoid high-cardinality label explosion.
   * e.g. /api/v1/users/abc123 → /api/v1/users/:id
   */
  private normalizeRoute(route: string): string {
    return route
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .split('?')[0]
      .slice(0, 100);
  }
}

export const metricsService = new MetricsService();
