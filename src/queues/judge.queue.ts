/**
 * FPRD-17 Phase 1 — Judge Queue
 *
 * BullMQ queue for async code execution.
 * Architecture: Backend API enqueues a job → Worker picks it up →
 *               Sandbox runner executes → Result stored → Frontend polls.
 *
 * Execution NEVER happens inside the main API server.
 */

import { createQueue, createWorker } from './queue.config';
import { prisma } from '../config/database';
import { executionService } from '../services/execution';
import { testCaseRepository } from '../repositories/test-case.repository';
import { logger } from '../utils/logger';
import { SubmissionStatus } from '@prisma/client';

export const JUDGE_QUEUE_NAME = 'judge' as const;

export interface JudgeJobData {
  submissionId: string;
  problemId: string;
  sourceCode: string;
  language: string;
  timeLimit: number;
  memoryLimit: number;
}

// Create the queue
export const judgeQueue = createQueue(JUDGE_QUEUE_NAME as any);

/**
 * Enqueue a submission for async judge execution.
 */
export async function enqueueJudgeJob(data: JudgeJobData): Promise<string> {
  const job = await judgeQueue.add('execute', data, {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
    priority: 1,
  });
  logger.info('[JudgeQueue] Job enqueued', { jobId: job.id, submissionId: data.submissionId });
  return job.id ?? data.submissionId;
}

/**
 * Start the judge worker — processes one submission at a time.
 * Called from worker entry point only (WORKER_ONLY=true container).
 */
export function startJudgeWorker(): void {
  createWorker<JudgeJobData>(
    JUDGE_QUEUE_NAME as any,
    async (job) => {
      const { submissionId, sourceCode, language, timeLimit, memoryLimit, problemId } = job.data;

      logger.info('[JudgeWorker] Processing job', { jobId: job.id, submissionId });

      // Mark as RUNNING
      await prisma.submission.update({
        where: { id: submissionId },
        data: { judgeStatus: 'RUNNING' },
      });

      try {
        const { ProgrammingLanguage } = await import('@prisma/client');
        const testCases = await testCaseRepository.findAllByProblemId(problemId);

        const result = await executionService.execute({
          sourceCode,
          language: language as any,
          testCases: testCases.map((tc) => ({
            id: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            weight: (tc as any).weight ?? 1,
            isHidden: tc.isHidden,
          })),
          timeLimit,
          memoryLimit,
        });

        // Persist per-test-case results
        if (result.testCaseResults.length > 0) {
          await prisma.submissionTestResult.createMany({
            data: result.testCaseResults.map((r) => ({
              submissionId,
              testCaseId: r.testCaseId,
              passed: r.passed,
              actualOutput: r.actualOutput ?? null,
              expectedOutput: r.expectedOutput,
              runtime: r.runtime ?? null,
              memoryUsed: r.memoryUsed ?? null,
              errorMessage: r.error ?? null,
            })),
            skipDuplicates: true,
          });
        }

        // Update submission with final result
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: result.status as SubmissionStatus,
            judgeStatus: 'DONE',
            runtime: result.runtime,
            memoryUsed: result.memoryUsed,
            score: result.score,
            passedTestCases: result.passedTestCases,
            totalTestCases: result.totalTestCases,
            errorMessage: result.compileError ?? null,
            compileOutput: result.compileError ?? null,
          },
        });

        // Update problem stats
        void updateProblemStats(problemId);

        logger.info('[JudgeWorker] Job completed', {
          jobId: job.id,
          submissionId,
          status: result.status,
          passed: `${result.passedTestCases}/${result.totalTestCases}`,
        });
      } catch (err) {
        logger.error('[JudgeWorker] Job failed with error', {
          jobId: job.id,
          submissionId,
          error: (err as Error).message,
        });

        // Mark submission as runtime error
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: SubmissionStatus.RUNTIME_ERROR,
            judgeStatus: 'DONE',
            errorMessage: 'Internal judge error',
          },
        });

        throw err; // Re-throw for BullMQ retry logic
      }
    },
    1, // concurrency = 1 to avoid resource contention
  );

  logger.info('[JudgeWorker] Started');
}

async function updateProblemStats(problemId: string): Promise<void> {
  try {
    const [total, accepted] = await Promise.all([
      prisma.submission.count({ where: { problemId, isRun: false } }),
      prisma.submission.count({ where: { problemId, status: 'ACCEPTED', isRun: false } }),
    ]);
    const rate = total > 0 ? parseFloat(((accepted / total) * 100).toFixed(2)) : 0;
    await prisma.codingProblem.update({
      where: { id: problemId },
      data: {
        submissionCount: total,
        acceptedCount: accepted,
        acceptanceRate: rate,
      },
    });
  } catch (err) {
    logger.warn('[JudgeWorker] Failed to update problem stats', { problemId, error: (err as Error).message });
  }
}
