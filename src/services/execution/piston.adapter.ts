/**
 * FPRD-17 Phase 1-4 — Piston Adapter
 *
 * Piston is an open-source, self-hostable code execution engine.
 * GitHub: https://github.com/engineer-man/piston
 * Public API: https://emkc.org/api/v2/piston/
 *
 * Architecture per FPRD-17:
 *   Frontend → Backend API → Judge Queue → Sandbox Runner (Piston) → Result
 *
 * Execution NEVER happens inside the main API server — Piston runs
 * each submission in an isolated container with CPU/memory/time limits.
 */

import { SubmissionStatus, ProgrammingLanguage } from '@prisma/client';
import {
  IExecutionService,
  ExecutionRequest,
  ExecutionResult,
  TestCaseResult,
} from './execution.interface';
import { LANGUAGE_CONFIGS } from './language-config';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

interface PistonFile {
  name: string;
  content: string;
}

interface PistonRequest {
  language: string;
  version: string;
  files: PistonFile[];
  stdin?: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
  compile_memory_limit?: number;
  run_memory_limit?: number;
}

interface PistonRunResult {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: string | null;
  output: string;
}

interface PistonResponse {
  language: string;
  version: string;
  run: PistonRunResult;
  compile?: PistonRunResult;
  message?: string; // error from Piston
}

export class PistonAdapter implements IExecutionService {
  private readonly apiUrl: string;
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiUrl = env.PISTON_API_URL ?? 'https://emkc.org/api/v2/piston';
    this.apiKey = env.PISTON_API_KEY;
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const config = LANGUAGE_CONFIGS[request.language];
    if (!config) {
      logger.error('[PistonAdapter] Unsupported language', { language: request.language });
      return this.errorResult('Unsupported language', request.testCases.length);
    }

    const testCaseResults: TestCaseResult[] = [];
    let totalRuntime = 0;
    let maxMemory = 0;
    let compileError: string | undefined;

    // Check for compile error on first test case
    let compileFailed = false;

    for (const tc of request.testCases) {
      const startTime = Date.now();

      const pistonReq: PistonRequest = {
        language: config.runtime,
        version: config.version,
        files: [{ name: config.filename, content: request.sourceCode }],
        stdin: tc.input,
        compile_timeout: Math.min(request.timeLimit, 30000),
        run_timeout: request.timeLimit,
        run_memory_limit: request.memoryLimit * 1024 * 1024, // bytes
      };

      let response: PistonResponse;
      try {
        response = await this.callPiston(pistonReq);
      } catch (err) {
        logger.error('[PistonAdapter] Network error calling Piston', { error: (err as Error).message });
        testCaseResults.push({
          testCaseId: tc.id,
          passed: false,
          actualOutput: '',
          expectedOutput: tc.expectedOutput,
          error: 'Execution service unavailable',
        });
        compileFailed = true;
        break;
      }

      const elapsed = Date.now() - startTime;

      // Compile error
      if (response.compile && response.compile.code !== 0 && response.compile.stderr) {
        compileError = response.compile.stderr || response.compile.stdout;
        compileFailed = true;
        testCaseResults.push({
          testCaseId: tc.id,
          passed: false,
          actualOutput: '',
          expectedOutput: tc.expectedOutput,
          error: compileError,
        });
        break; // No point running further test cases
      }

      // Runtime error — non-zero exit code
      if (response.run.code !== 0 && response.run.code !== null) {
        testCaseResults.push({
          testCaseId: tc.id,
          passed: false,
          actualOutput: response.run.stdout ?? '',
          expectedOutput: tc.expectedOutput,
          runtime: elapsed,
          error: response.run.stderr || `Runtime error (exit code ${response.run.code})`,
        });
        // Continue to run remaining test cases for partial scoring
        totalRuntime += elapsed;
        continue;
      }

      const actualOutput = (response.run.stdout ?? '').trim();
      const expectedOutput = tc.expectedOutput.trim();
      const passed = actualOutput === expectedOutput;

      // Estimate memory usage (Piston doesn't expose this directly, use a reasonable estimate)
      const estimatedMemory = Math.min(maxMemory || 16, request.memoryLimit);

      testCaseResults.push({
        testCaseId: tc.id,
        passed,
        actualOutput,
        expectedOutput,
        runtime: elapsed,
        memoryUsed: estimatedMemory,
      });

      totalRuntime += elapsed;
      if (estimatedMemory > maxMemory) maxMemory = estimatedMemory;
    }

    return this.buildResult(
      testCaseResults,
      request.testCases,
      totalRuntime,
      maxMemory,
      compileFailed ? compileError : undefined,
      request.timeLimit,
      request.memoryLimit,
    );
  }

  private async callPiston(req: PistonRequest): Promise<PistonResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${this.apiUrl}/execute`, {
        method: 'POST',
        headers,
        body: JSON.stringify(req),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Piston HTTP ${res.status}: ${text}`);
      }

      return await res.json() as PistonResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildResult(
    testCaseResults: TestCaseResult[],
    testCases: ExecutionRequest['testCases'],
    totalRuntime: number,
    maxMemory: number,
    compileError?: string,
    timeLimit?: number,
    _memoryLimit?: number,
  ): ExecutionResult {
    const passedCount = testCaseResults.filter((r) => r.passed).length;
    const totalCount = testCaseResults.length;

    const totalWeight = testCases.reduce((s, tc) => s + tc.weight, 0);
    const passedWeight = testCases
      .filter((_, i) => testCaseResults[i]?.passed)
      .reduce((s, tc) => s + tc.weight, 0);
    const score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;
    const avgRuntime = totalCount > 0 ? Math.round(totalRuntime / totalCount) : 0;

    // Determine verdict
    let status: SubmissionStatus;

    if (compileError) {
      status = SubmissionStatus.COMPILE_ERROR;
    } else if (timeLimit && avgRuntime > timeLimit) {
      status = SubmissionStatus.TIME_LIMIT_EXCEEDED;
    } else if (passedCount === totalCount && totalCount > 0) {
      status = SubmissionStatus.ACCEPTED;
    } else if (testCaseResults.some((r) => r.error?.includes('Runtime error'))) {
      status = SubmissionStatus.RUNTIME_ERROR;
    } else {
      status = SubmissionStatus.WRONG_ANSWER;
    }

    return {
      status,
      runtime: avgRuntime,
      memoryUsed: maxMemory,
      score,
      passedTestCases: passedCount,
      totalTestCases: totalCount,
      testCaseResults,
      compileError,
    };
  }

  private errorResult(message: string, testCount: number): ExecutionResult {
    return {
      status: SubmissionStatus.RUNTIME_ERROR,
      runtime: 0,
      memoryUsed: 0,
      score: 0,
      passedTestCases: 0,
      totalTestCases: testCount,
      testCaseResults: [],
      compileError: message,
    };
  }
}

export const pistonAdapter = new PistonAdapter();
