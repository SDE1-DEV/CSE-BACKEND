/**
 * FPRD-17 — Production Online Judge Submission Service
 *
 * Handles:
 *   - /run  — Execute code against sample/visible tests, return stdout immediately
 *   - /submit — Full judge run against all test cases (via queue when async)
 *   - Submission history, results, output comparison
 */

import { Submission, SubmissionStatus, ProgrammingLanguage } from '@prisma/client';
import { submissionRepository, SubmissionFilters } from '../repositories/submission.repository';
import { codingProblemRepository } from '../repositories/coding-problem.repository';
import { testCaseRepository } from '../repositories/test-case.repository';
import { executionService } from './execution';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, CODING_MESSAGES } from '../constants';
import { CreateSubmissionInput, GetSubmissionsQuery } from '../validators/submission.validator';
import { buildPaginated } from '../utils/response';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const USE_QUEUE = process.env['EXECUTION_ENGINE'] !== 'mock' && process.env['JUDGE_ASYNC'] !== 'false';

export class SubmissionService {
  /**
   * Phase 5 — Submit Solution
   * Runs hidden test cases, produces full verdict, stores result.
   */
  async submit(userId: string, data: CreateSubmissionInput): Promise<Submission> {
    const problem = await codingProblemRepository.findById(data.problemId);
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    if (!problem.isPublished) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);

    // Create submission record with PENDING status
    const submission = await submissionRepository.create({
      user: { connect: { id: userId } },
      problem: { connect: { id: data.problemId } },
      language: data.language,
      sourceCode: data.sourceCode,
      status: SubmissionStatus.PENDING,
      judgeStatus: 'QUEUED',
      isRun: false,
    });

    if (USE_QUEUE) {
      // Async: enqueue to judge queue
      const { enqueueJudgeJob } = await import('../queues/judge.queue');
      await enqueueJudgeJob({
        submissionId: submission.id,
        problemId: data.problemId,
        sourceCode: data.sourceCode,
        language: data.language,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
      });
    } else {
      // Sync (mock/dev): execute immediately
      await this.executeAndUpdate(submission.id, data.problemId, data.sourceCode, data.language as ProgrammingLanguage, problem.timeLimit, problem.memoryLimit, false);
    }

    return submission;
  }

  /**
   * Phase 4 — Run Code (sample tests only, custom input support)
   */
  async run(
    userId: string,
    problemId: string,
    language: ProgrammingLanguage,
    sourceCode: string,
    customInput?: string,
  ): Promise<Submission> {
    const problem = await codingProblemRepository.findById(problemId);
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    if (!problem.isPublished) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);

    // Create "run" submission record
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        language,
        sourceCode,
        status: SubmissionStatus.PENDING,
        judgeStatus: 'QUEUED',
        isRun: true,
      },
    });

    // Get sample/visible test cases only (or custom input)
    let testCases: Array<{ id: string; input: string; expectedOutput: string; weight: number; isHidden: boolean }>;

    if (customInput !== undefined) {
      // Custom input: create a synthetic test case
      testCases = [{
        id: `custom-${submission.id}`,
        input: customInput,
        expectedOutput: '',  // no expected output for custom
        weight: 1,
        isHidden: false,
      }];
    } else {
      const all = await testCaseRepository.findAllByProblemId(problemId);
      // Only sample (visible) test cases for run
      const sampleCases = all.filter((tc) => tc.isSample || !tc.isHidden);
      testCases = (sampleCases.length > 0 ? sampleCases : all.slice(0, 3)).map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        weight: (tc as any).weight ?? 1,
        isHidden: false,
      }));
    }

    // Execute synchronously for /run (user waits for result)
    try {
      const result = await executionService.execute({
        sourceCode,
        language,
        testCases,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
      });

      // Store per-test-case results (skip synthetic custom-input ids)
      const realResults = result.testCaseResults.filter((r) => !r.testCaseId.startsWith('custom-'));
      if (realResults.length > 0) {
        await prisma.submissionTestResult.createMany({
          data: realResults.map((r) => ({
            submissionId: submission.id,
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

      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: result.status,
          judgeStatus: 'DONE',
          runtime: result.runtime,
          memoryUsed: result.memoryUsed,
          score: result.score,
          passedTestCases: result.passedTestCases,
          totalTestCases: result.totalTestCases,
          errorMessage: result.compileError ?? null,
          compileOutput: result.compileError ?? null,
          stderr: result.stderr ?? null,
        },
      });
    } catch (err) {
      logger.error('[SubmissionService] Run execution failed', { error: (err as Error).message });
      await prisma.submission.update({
        where: { id: submission.id },
        data: { status: SubmissionStatus.RUNTIME_ERROR, judgeStatus: 'DONE' },
      });
    }

    return prisma.submission.findUnique({ where: { id: submission.id } }) as Promise<Submission>;
  }

  /**
   * Internal: execute code and update submission record.
   */
  private async executeAndUpdate(
    submissionId: string,
    problemId: string,
    sourceCode: string,
    language: ProgrammingLanguage,
    timeLimit: number,
    memoryLimit: number,
    isRun: boolean,
  ): Promise<void> {
    try {
      const testCases = await testCaseRepository.findAllByProblemId(problemId);

      const result = await executionService.execute({
        sourceCode,
        language,
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

      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: result.status,
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

      if (!isRun) {
        void this.updateProblemStats(problemId);
      }
    } catch (err) {
      logger.error('[SubmissionService] executeAndUpdate failed', { error: (err as Error).message });
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: SubmissionStatus.RUNTIME_ERROR, judgeStatus: 'DONE' },
      });
    }
  }

  private async updateProblemStats(problemId: string): Promise<void> {
    try {
      const [total, accepted] = await Promise.all([
        prisma.submission.count({ where: { problemId, isRun: false } }),
        prisma.submission.count({ where: { problemId, status: 'ACCEPTED', isRun: false } }),
      ]);
      const rate = total > 0 ? parseFloat(((accepted / total) * 100).toFixed(2)) : 0;
      await prisma.codingProblem.update({
        where: { id: problemId },
        data: { submissionCount: total, acceptedCount: accepted, acceptanceRate: rate },
      });
    } catch (err) {
      logger.warn('[SubmissionService] updateProblemStats failed', { problemId });
    }
  }

  async getAll(
    query: GetSubmissionsQuery,
    userId: string,
    isAdmin: boolean,
  ): Promise<{ data: Submission[]; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const filters: SubmissionFilters = {};

    if (!isAdmin) {
      filters.userId = userId;
    } else if (query.problemId) {
      filters.problemId = query.problemId;
    }

    if (query.language) filters.language = query.language;
    if (query.status) filters.status = query.status as SubmissionStatus;

    const { data, total } = await submissionRepository.findAll(filters, { page, limit });
    return buildPaginated(data as Submission[], total, page, limit);
  }

  async getById(id: string, userId: string, isAdmin: boolean): Promise<any> {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        problem: { select: { id: true, title: true, slug: true, difficulty: true } },
        user: { select: { id: true, fullName: true, email: true } },
        testResults: {
          select: {
            id: true,
            testCaseId: true,
            passed: true,
            actualOutput: true,
            expectedOutput: true,
            runtime: true,
            memoryUsed: true,
            errorMessage: true,
          },
        },
      },
    });

    if (!submission) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.SUBMISSION_NOT_FOUND);
    if (!isAdmin && submission.userId !== userId) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, CODING_MESSAGES.SUBMISSION_NOT_FOUND);
    }

    return submission;
  }

  async getByProblemId(
    problemId: string,
    query: GetSubmissionsQuery,
    userId: string,
    isAdmin: boolean,
  ): Promise<{ data: Submission[]; total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const problem = await codingProblemRepository.findById(problemId);
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);

    const filters: SubmissionFilters = { problemId };
    if (!isAdmin) filters.userId = userId;

    const { data, total } = await submissionRepository.findAll(filters, { page, limit });
    return buildPaginated(data as Submission[], total, page, limit);
  }

  /**
   * Phase 8 — Submission History for a user on a specific problem
   */
  async getHistoryByProblem(problemId: string, userId: string): Promise<any[]> {
    const submissions = await prisma.submission.findMany({
      where: { userId, problemId, isRun: false },
      orderBy: { submittedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        language: true,
        runtime: true,
        memoryUsed: true,
        score: true,
        passedTestCases: true,
        totalTestCases: true,
        submittedAt: true,
        sourceCode: true,
      },
    });

    return submissions.map((s) => ({
      ...s,
      status: this.mapStatus(s.status),
    }));
  }

  /**
   * Phase 13 — Analytics
   */
  async getCodingStats(userId: string): Promise<unknown> {
    const [solved, totalSubs, runtimeAgg, langGroups, streakData, langBreakdown] = await Promise.all([
      prisma.submission.findMany({
        where: { userId, status: 'ACCEPTED', isRun: false },
        distinct: ['problemId'],
        select: { problemId: true, problem: { select: { difficulty: true } } },
      }),
      prisma.submission.count({ where: { userId, isRun: false } }),
      prisma.submission.aggregate({
        where: { userId, status: 'ACCEPTED', runtime: { not: null }, isRun: false },
        _avg: { runtime: true },
      }),
      prisma.submission.groupBy({
        by: ['language'],
        where: { userId, isRun: false },
        _count: { language: true },
        orderBy: { _count: { language: 'desc' } },
      }),
      prisma.submission.findMany({
        where: { userId, status: 'ACCEPTED', isRun: false },
        select: { submittedAt: true },
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.submission.groupBy({
        by: ['language'],
        where: { userId, status: 'ACCEPTED', isRun: false },
        _count: { language: true },
      }),
    ]);

    const totalSolved = solved.length;
    let easySolved = 0, mediumSolved = 0, hardSolved = 0;
    for (const s of solved) {
      const diff = (s as any).problem?.difficulty;
      if (diff === 'EASY') easySolved++;
      else if (diff === 'MEDIUM') mediumSolved++;
      else if (diff === 'HARD') hardSolved++;
    }

    const acceptedSubCount = await prisma.submission.count({ where: { userId, status: 'ACCEPTED', isRun: false } });
    const acceptanceRate = totalSubs > 0 ? parseFloat(((acceptedSubCount / totalSubs) * 100).toFixed(2)) : 0;
    const averageRuntime = parseFloat((runtimeAgg._avg.runtime ?? 0).toFixed(2));
    const favoriteLanguage = langGroups.length > 0 ? String(langGroups[0]!.language) : null;

    // Compute streaks
    const distinctDates = [...new Set(
      streakData.map((s) => s.submittedAt.toISOString().slice(0, 10)),
    )].sort((a, b) => (a > b ? -1 : 1));

    let currentStreak = 0, longestStreak = 0, tempStreak = 0;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    for (let i = 0; i < distinctDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(distinctDates[i - 1]!);
        const curr = new Date(distinctDates[i]!);
        const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
        tempStreak = diffDays === 1 ? tempStreak + 1 : 1;
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
      if (i === 0 && (distinctDates[0] === today || distinctDates[0] === yesterday)) {
        currentStreak = tempStreak;
      } else if (currentStreak > 0) {
        currentStreak = tempStreak;
      }
    }

    return {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      totalSubmissions: totalSubs,
      acceptedSubmissions: acceptedSubCount,
      acceptanceRate,
      averageRuntime,
      favoriteLanguage,
      currentStreak,
      longestStreak,
      languageUsage: langBreakdown.map((l) => ({
        language: l.language,
        count: (l._count as any).language,
      })),
    };
  }

  /**
   * Phase 4 — Custom test: run code against user-provided input
   */
  async customTest(
    userId: string,
    problemId: string,
    language: ProgrammingLanguage,
    sourceCode: string,
    customInput: string,
  ): Promise<{ stdout: string; stderr: string; exitCode: number; runtime: number; status: string }> {
    const problem = await codingProblemRepository.findById(problemId);
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);

    const result = await executionService.execute({
      sourceCode,
      language,
      testCases: [{
        id: 'custom',
        input: customInput,
        expectedOutput: '',
        weight: 1,
        isHidden: false,
      }],
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
    });

    const tc = result.testCaseResults[0];
    return {
      stdout: tc?.actualOutput ?? '',
      stderr: result.stderr ?? tc?.error ?? '',
      exitCode: result.status === SubmissionStatus.ACCEPTED ? 0 : 1,
      runtime: result.runtime,
      status: this.mapStatus(result.status),
    };
  }

  private mapStatus(status: SubmissionStatus): string {
    const map: Record<string, string> = {
      PENDING: 'pending',
      ACCEPTED: 'accepted',
      WRONG_ANSWER: 'wrong_answer',
      TIME_LIMIT_EXCEEDED: 'time_limit_exceeded',
      MEMORY_LIMIT_EXCEEDED: 'memory_limit_exceeded',
      RUNTIME_ERROR: 'runtime_error',
      COMPILE_ERROR: 'compile_error',
    };
    return map[status] ?? status.toLowerCase();
  }
}

export const submissionService = new SubmissionService();
