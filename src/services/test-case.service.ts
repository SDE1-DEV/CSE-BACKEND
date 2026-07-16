import { TestCase } from '@prisma/client';
import { testCaseRepository } from '../repositories/test-case.repository';
import { codingProblemRepository } from '../repositories/coding-problem.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, CODING_MESSAGES } from '../constants';
import { CreateTestCaseInput, UpdateTestCaseInput } from '../validators/test-case.validator';

export class TestCaseService {
  async create(data: CreateTestCaseInput): Promise<TestCase> {
    const problem = await codingProblemRepository.findById(data.problemId);
    if (!problem) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    }

    return testCaseRepository.create({
      problem: { connect: { id: data.problemId } },
      input: data.input,
      expectedOutput: data.expectedOutput,
      isSample: data.isSample ?? false,
      isHidden: data.isHidden ?? false,
      weight: data.weight ?? 1,
    });
  }

  async getByProblemId(problemId: string, isAdmin: boolean): Promise<TestCase[]> {
    const problem = await codingProblemRepository.findById(problemId);
    if (!problem) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    }
    return testCaseRepository.findByProblemId(problemId, isAdmin);
  }

  async update(id: string, data: UpdateTestCaseInput): Promise<TestCase> {
    const testCase = await testCaseRepository.findById(id);
    if (!testCase) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.TEST_CASE_NOT_FOUND);
    }
    return testCaseRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const testCase = await testCaseRepository.findById(id);
    if (!testCase) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.TEST_CASE_NOT_FOUND);
    }
    await testCaseRepository.delete(id);
  }
}

export const testCaseService = new TestCaseService();
