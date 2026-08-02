/**
 * FPRD-17: Execution Service Factory
 *
 * Architecture: Frontend → Backend API → Judge Queue → Sandbox Runner → Result
 * Execution NEVER happens inside the main API server.
 *
 * Active executor is chosen based on EXECUTION_ENGINE env var:
 *   - "piston"  → PistonAdapter (real execution, self-hostable, default)
 *   - "mock"    → MockExecutor (development stub, no Docker needed)
 *
 * Set EXECUTION_ENGINE=mock in .env to use the stub locally without Piston.
 * Set EXECUTION_ENGINE=piston + PISTON_API_URL for real judge execution.
 */

import { env } from '../../config/env';

const engine = (process.env['EXECUTION_ENGINE'] ?? 'mock').toLowerCase();

let _executionService: import('./execution.interface').IExecutionService;

if (engine === 'piston') {
  const { pistonAdapter } = require('./piston.adapter');
  _executionService = pistonAdapter;
} else {
  const { mockExecutor } = require('./mock.executor');
  _executionService = mockExecutor;
}

export const executionService = _executionService;

export type { IExecutionService, ExecutionRequest, ExecutionResult, TestCaseResult } from './execution.interface';
export { LANGUAGE_CONFIGS } from './language-config';
export type { LanguageConfig } from './language-config';
