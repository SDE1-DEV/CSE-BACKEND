import { Submission } from '@prisma/client';
import { submissionRepository, SubmissionFilters } from '../repositories/submission.repository';
import { codingProblemRepository } from '../repositories/coding-problem.repository';
import { testCaseRepository } from '../repositories/test-case.repository';
import { executionService } from './execution';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, CODING_MESSAGES } from '../constants';
import { CreateSubmissionInput, GetSubmissionsQuery } from '../validators/submission.validator';
import { SubmissionStatus } from '@prisma/client';

export class SubmissionService {
  async submit(userId: string, data: CreateSubmissionInput): Promise<Submission> {
    // Verify problem exists and is published
    const problem = await codingProblemRepository.findById(data.problemId);
    if (!problem) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    }
    if (!problem.isPublished) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    }

    // Fetch all test cases (including hidden) for execution
    const testCases = await testCaseRepository.findAllByProblemId(data.problemId);

    // Run through execution service (Mock or real)
    const executionResult = await executionService.execute({
      sourceCode: data.sourceCode,
      language: data.language,
      testCases: testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        weight: tc.weight,
        isHidden: tc.isHidden,
      })),
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
    });

    // Persist submission
    const submission = await submissionRepository.create({
      user: { connect: { id: userId } },
      problem: { connect: { id: data.problemId } },
      language: data.language,
      sourceCode: data.sourceCode,
      status: executionResult.status,
      runtime: executionResult.runtime,
      memoryUsed: executionResult.memoryUsed,
      score: executionResult.score,
      passedTestCases: executionResult.passedTestCases,
      totalTestCases: executionResult.totalTestCases,
    });

    // Update acceptance rate async (fire-and-forget)
    void codingProblemRepository.updateAcceptanceRate(data.problemId);

    return submission;
  }

  async getAll(
    query: GetSubmissionsQuery,
    userId: string,
    isAdmin: boolean,
  ): Promise<{ data: Submission[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const filters: SubmissionFilters = {};

    // Non-admins can only see their own submissions
    if (!isAdmin) {
      filters.userId = userId;
    } else if (query.problemId) {
      filters.problemId = query.problemId;
    }

    if (query.language) filters.language = query.language;
    if (query.status) filters.status = query.status as SubmissionStatus;

    const { data, total } = await submissionRepository.findAll(filters, { page, limit });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string, userId: string, isAdmin: boolean): Promise<Submission> {
    const submission = await submissionRepository.findById(id);
    if (!submission) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.SUBMISSION_NOT_FOUND);
    }
    // Students can only view their own submissions
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
  ): Promise<{ data: Submission[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const problem = await codingProblemRepository.findById(problemId);
    if (!problem) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    }

    const filters: SubmissionFilters = { problemId };
    if (!isAdmin) filters.userId = userId;

    const { data, total } = await submissionRepository.findAll(filters, { page, limit });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCodingStats(userId: string): Promise<unknown> {
    return submissionRepository.getCodingStats(userId);
  }
}

export const submissionService = new SubmissionService();
