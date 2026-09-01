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

import type { IExecutionService } from './execution.interface';
import { pistonAdapter } from './piston.adapter';
import { mockExecutor } from './mock.executor';

const engine = (process.env['EXECUTION_ENGINE'] ?? 'mock').toLowerCase();

export const executionService: IExecutionService =
  engine === 'piston' ? pistonAdapter : mockExecutor;

export type { IExecutionService, ExecutionRequest, ExecutionResult, TestCaseResult } from './execution.interface';
export { LANGUAGE_CONFIGS } from './language-config';
export type { LanguageConfig } from './language-config';
