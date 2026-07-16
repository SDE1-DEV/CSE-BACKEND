/**
 * Vitest Global Test Setup
 * PRD-06: Section 12 — Testing
 */

import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Set test environment
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'test-jwt-secret-for-testing';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-for-testing';
process.env['DATABASE_URL'] = process.env['DATABASE_URL'] ?? 'postgresql://test:test@localhost:5432/test_db';
process.env['DIRECT_URL'] = process.env['DIRECT_URL'] ?? 'postgresql://test:test@localhost:5432/test_db';
process.env['REDIS_HOST'] = 'localhost';
process.env['REDIS_PORT'] = '6379';
process.env['SMTP_USER'] = '';
process.env['CLIENT_URL'] = 'http://localhost:5173';
process.env['SUPABASE_URL'] = 'https://placeholder.supabase.co';
process.env['SUPABASE_ANON_KEY'] = 'placeholder';
process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'placeholder';

// Mock Redis to avoid real connections in unit tests
vi.mock('../config/redis', () => ({
  getRedisClient: vi.fn(() => null),
  isRedisAvailable: vi.fn(() => false),
  disconnectRedis: vi.fn(),
  createRedisConnection: vi.fn(() => ({
    on: vi.fn(),
    quit: vi.fn(),
  })),
}));

// Mock BullMQ queues
vi.mock('../queues/email.queue', () => ({
  emailQueue: { add: vi.fn(), getJobCounts: vi.fn(() => ({})) },
  enqueueEmail: vi.fn(),
  startEmailWorker: vi.fn(),
}));

vi.mock('../queues/notification.queue', () => ({
  notificationQueue: { add: vi.fn(), getJobCounts: vi.fn(() => ({})) },
  enqueueNotification: vi.fn(),
  startNotificationWorker: vi.fn(),
}));

vi.mock('../queues/analytics.queue', () => ({
  analyticsQueue: { add: vi.fn(), getJobCounts: vi.fn(() => ({})) },
  enqueueAnalytics: vi.fn(),
  startAnalyticsWorker: vi.fn(),
}));

vi.mock('../queues/cleanup.queue', () => ({
  cleanupQueue: { add: vi.fn(), getJobCounts: vi.fn(() => ({})) },
  enqueueCleanup: vi.fn(),
  startCleanupWorker: vi.fn(),
}));

// Mock WebSocket gateway
vi.mock('../websocket/gateway', () => ({
  wsGateway: {
    initialize: vi.fn(),
    emitToUser: vi.fn(),
    emitToTeam: vi.fn(),
    broadcast: vi.fn(),
    getConnectedCount: vi.fn(() => 0),
    getServer: vi.fn(() => null),
  },
}));

// Mock metrics service to avoid prometheus registration issues in tests
vi.mock('../services/metrics.service', () => ({
  metricsService: {
    recordHttpRequest: vi.fn(),
    recordDbQuery: vi.fn(),
    setDbConnections: vi.fn(),
    recordCacheHit: vi.fn(),
    recordCacheMiss: vi.fn(),
    recordQueueJob: vi.fn(),
    setQueueSize: vi.fn(),
    setActiveUsers: vi.fn(),
    setConnectedSockets: vi.fn(),
    getMetrics: vi.fn(() => ''),
    getMetricsJson: vi.fn(() => []),
    getContentType: vi.fn(() => 'text/plain'),
  },
}));

beforeAll(async () => {
  // Any global setup
});

afterAll(async () => {
  // Clean up
});

afterEach(() => {
  vi.clearAllMocks();
});
