/**
 * Express Application
 * PRD-06: Full production hardening applied
 */

import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import hpp from 'hpp';

import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { requestLogger } from './middlewares/logger.middleware';
import { globalErrorHandler, notFound } from './middlewares/error.middleware';
import { sanitizeInput, csrfProtect } from './middlewares/security.middleware';
import { generalLimiter } from './middlewares/rate-limit.middleware';
import routes from './routes';

const app: Application = express();

// ── Security Middlewares ──────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31_536_000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// Build the CORS allowlist from env.
// ALLOWED_ORIGINS can be a comma-separated list set in Render environment variables.
// PRD-FINAL-01 §48: Must allow the exact Vercel frontend origin.
const buildAllowedOrigins = (): string[] => {
  const origins = new Set<string>([
    env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000',
  ]);
  const extra = process.env['ALLOWED_ORIGINS'] ?? '';
  extra.split(',').map((o) => o.trim()).filter(Boolean).forEach((o) => origins.add(o));
  return Array.from(origins);
};

const ALLOWED_ORIGINS = buildAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests with no Origin header
      if (!origin) {
        callback(null, true);
        return;
      }
      if (ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not in allowlist`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
    exposedHeaders: ['x-correlation-id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  }),
);

// ── HTTP Parameter Pollution Prevention ──────────────────────────────────────
app.use(hpp({ whitelist: ['sort', 'fields', 'filter', 'type', 'status', 'difficulty'] }));

// ── Rate Limiting (global in-memory baseline) ──────────────────────────────────
app.use(generalLimiter);

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(env.JWT_SECRET));

// ── Input Sanitization ────────────────────────────────────────────────────────
app.use(sanitizeInput);

// ── CSRF Protection (production only) ─────────────────────────────────────────
app.use(csrfProtect);

// ── Request Logger (with Correlation IDs) ─────────────────────────────────────
app.use(requestLogger);

// ── API Documentation ──────────────────────────────────────────────────────────
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'CAMPUSRANK API',
  }),
);

app.get('/api/docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── API Routes (v1) ────────────────────────────────────────────────────────────
// Both /api and /api/v1 are supported for backwards compatibility
app.use('/api/v1', routes);
app.use('/api', routes);

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use(notFound);

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use(globalErrorHandler);

export default app;
