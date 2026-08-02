/**
 * FPRD-17 Phase 1 — Judge Queue
 * FPRD-19 Part 10/12/15 — Submit Bug Fix + Transaction Safety + Logging
 *
 * BullMQ queue for async code execution.
 * Architecture: Backend API enqueues a job → Worker picks it up →
 *               Sandbox runner executes → Result stored → Frontend polls.
 *
 * Execution NEVER happens inside the main API server.
 * No step fails silently — every stage is logged.
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

      logger.info('[JudgeWorker] Stage 1: Job received', { jobId: job.id, submissionId, language });

      // Stage 2: Language normalization — FPRD-19 Part 11
      const normalizedLanguage = (typeof language === 'string'
        ? language.toUpperCase()
        : language) as any;
      logger.info('[JudgeWorker] Stage 2: Language normalized', { original: language, normalized: normalizedLanguage });

      // Stage 3: Mark as RUNNING
      try {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { judgeStatus: 'RUNNING' },
        });
        logger.info('[JudgeWorker] Stage 3: Submission marked RUNNING', { submissionId });
      } catch (err) {
        logger.error('[JudgeWorker] Stage 3 FAILED: Cannot mark RUNNING', {
          submissionId,
          error: (err as Error).message,
        });
        throw err;
      }

      try {
        // Stage 4: Hidden test retrieval (submit runs ALL test cases)
        const testCases = await testCaseRepository.findAllByProblemId(problemId);
        logger.info('[JudgeWorker] Stage 4: Test cases loaded', {
          submissionId,
          total: testCases.length,
          hidden: testCases.filter((tc) => tc.isHidden).length,
          visible: testCases.filter((tc) => !tc.isHidden).length,
        });

        if (testCases.length === 0) {
          logger.warn('[JudgeWorker] Stage 4: No test cases for problem', { problemId, submissionId });
        }

        // Stage 5: Template loading + Enum validation
        const { LANGUAGE_CONFIGS } = await import('../services/execution');
        const config = LANGUAGE_CONFIGS[normalizedLanguage as keyof typeof LANGUAGE_CONFIGS];
        if (!config) {
          logger.error('[JudgeWorker] Stage 5 FAILED: Unsupported language enum', {
            submissionId,
            language: normalizedLanguage,
            supportedLanguages: Object.keys(LANGUAGE_CONFIGS),
          });
          await prisma.submission.update({
            where: { id: submissionId },
            data: {
              status: SubmissionStatus.COMPILE_ERROR,
              judgeStatus: 'DONE',
              errorMessage: `Unsupported language: ${normalizedLanguage}. Supported: ${Object.keys(LANGUAGE_CONFIGS).join(', ')}`,
            },
          });
          return;
        }
        logger.info('[JudgeWorker] Stage 5: Language config validated', {
          language: normalizedLanguage,
          runtime: config.runtime,
        });

        // Stage 6: Worker execution
        logger.info('[JudgeWorker] Stage 6: Starting code execution', { submissionId, testCount: testCases.length });
        const result = await executionService.execute({
          sourceCode,
          language: normalizedLanguage,
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

        logger.info('[JudgeWorker] Stage 6: Execution complete', {
          submissionId,
          status: result.status,
          passed: `${result.passedTestCases}/${result.totalTestCases}`,
          runtime: result.runtime,
          memoryUsed: result.memoryUsed,
        });

        // Stage 7: Store per-test-case results (hidden test execution)
        if (result.testCaseResults.length > 0) {
          try {
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
            logger.info('[JudgeWorker] Stage 7: Test results stored', {
              submissionId,
              count: result.testCaseResults.length,
            });
          } catch (err) {
            logger.warn('[JudgeWorker] Stage 7: Test results persist warning (non-critical)', {
              submissionId,
              error: (err as Error).message,
            });
          }
        }

        // Stage 8: Submission update (verdict calculation)
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
            errorMessage: result.compileError ?? result.stderr ?? null,
            compileOutput: result.compileError ?? null,
            stderr: result.stderr ?? null,
          },
        });
        logger.info('[JudgeWorker] Stage 8: Submission updated', { submissionId, verdict: result.status });

        // Stage 9: Analytics (problem stats + platform metric)
        void updateProblemStats(problemId);
        void updatePlatformMetric();

        logger.info('[JudgeWorker] Job completed successfully', {
          jobId: job.id,
          submissionId,
          status: result.status,
          passed: `${result.passedTestCases}/${result.totalTestCases}`,
        });
      } catch (err) {
        logger.error('[JudgeWorker] Job FAILED at execution stage', {
          jobId: job.id,
          submissionId,
          error: (err as Error).message,
          stack: (err as Error).stack?.split('\n').slice(0, 5).join(' | '),
        });

        // Stage: Mark as runtime error with error details — no silent failure
        try {
          await prisma.submission.update({
            where: { id: submissionId },
            data: {
              status: SubmissionStatus.RUNTIME_ERROR,
              judgeStatus: 'DONE',
              errorMessage: `Judge internal error: ${(err as Error).message}`,
            },
          });
        } catch (updateErr) {
          logger.error('[JudgeWorker] CRITICAL: Cannot update submission after failure', {
            submissionId,
            error: (updateErr as Error).message,
          });
        }

        throw err; // Re-throw for BullMQ retry logic
      }
    },
    1, // concurrency = 1 to avoid resource contention
  );

  logger.info('[JudgeWorker] Started and listening for jobs');
}

// ─── Helper: Update problem acceptance stats ─────────────────────────────────
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
    logger.info('[JudgeWorker] Problem stats updated', { problemId, total, accepted, rate });
  } catch (err) {
    logger.warn('[JudgeWorker] Failed to update problem stats', {
      problemId,
      error: (err as Error).message,
    });
  }
}

// ─── Helper: Update platform-level coding metric ─────────────────────────────
async function updatePlatformMetric(): Promise<void> {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await prisma.platformMetric.upsert({
      where: { date: today },
      create: { date: today, codingSubmissions: 1 },
      update: { codingSubmissions: { increment: 1 } },
    });
  } catch (err) {
    logger.warn('[JudgeWorker] Failed to update platform metric', { error: (err as Error).message });
  }
}
