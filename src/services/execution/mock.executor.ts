import { SubmissionStatus } from '@prisma/client';
import { IExecutionService, ExecutionRequest, ExecutionResult, TestCaseResult } from './execution.interface';
import { logger } from '../../utils/logger';

/**
 * MockExecutor — Development/stub implementation of IExecutionService.
 *
 * Simulates code execution without actually running any code.
 * Replace with Judge0Adapter, PistonAdapter, or DockerSandboxAdapter
 * when integrating a real execution engine.
 */
export class MockExecutor implements IExecutionService {
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    logger.info('[MockExecutor] Simulating code execution', {
      language: request.language,
      testCaseCount: request.testCases.length,
    });

    // Simulate processing delay
    await this.simulateDelay(50, 200);

    const testCaseResults: TestCaseResult[] = request.testCases.map((tc) => {
      const runtime = this.randomInt(50, request.timeLimit * 0.8);
      const memoryUsed = this.randomInt(16, request.memoryLimit * 0.5);

      // Mock: treat non-empty source code as passing all sample test cases
      const passed = request.sourceCode.trim().length > 0;

      return {
        testCaseId: tc.id,
        passed,
        actualOutput: passed ? tc.expectedOutput : '',
        expectedOutput: tc.expectedOutput,
        runtime,
        memoryUsed,
      };
    });

    const passedCount = testCaseResults.filter((r) => r.passed).length;
    const totalCount = testCaseResults.length;
    const totalWeight = request.testCases.reduce((sum, tc) => sum + tc.weight, 0);
    const passedWeight = request.testCases
      .filter((_, i) => testCaseResults[i]?.passed)
      .reduce((sum, tc) => sum + tc.weight, 0);

    const score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;
    const avgRuntime = testCaseResults.reduce((s, r) => s + (r.runtime ?? 0), 0) / (totalCount || 1);
    const maxMemory = Math.max(...testCaseResults.map((r) => r.memoryUsed ?? 0), 0);

    let status: SubmissionStatus;
    if (passedCount === totalCount && totalCount > 0) {
      status = SubmissionStatus.ACCEPTED;
    } else if (passedCount > 0) {
      status = SubmissionStatus.WRONG_ANSWER;
    } else {
      status = SubmissionStatus.WRONG_ANSWER;
    }

    return {
      status,
      runtime: Math.round(avgRuntime),
      memoryUsed: maxMemory,
      score,
      passedTestCases: passedCount,
      totalTestCases: totalCount,
      testCaseResults,
      compileError: undefined,
      stderr: undefined,
    };
  }

  private simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = this.randomInt(minMs, maxMs);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export const mockExecutor = new MockExecutor();
