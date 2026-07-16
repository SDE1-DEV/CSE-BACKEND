import { TestCase, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class TestCaseRepository {
  async create(data: Prisma.TestCaseCreateInput): Promise<TestCase> {
    return prisma.testCase.create({ data });
  }

  async findById(id: string): Promise<TestCase | null> {
    return prisma.testCase.findUnique({ where: { id } });
  }

  async findByProblemId(problemId: string, includeHidden: boolean): Promise<TestCase[]> {
    const where: Prisma.TestCaseWhereInput = { problemId };
    if (!includeHidden) {
      where.isHidden = false;
    }
    return prisma.testCase.findMany({
      where,
      orderBy: [{ isSample: 'desc' }, { id: 'asc' }],
    });
  }

  async findAllByProblemId(problemId: string): Promise<TestCase[]> {
    return prisma.testCase.findMany({
      where: { problemId },
      orderBy: [{ isSample: 'desc' }, { id: 'asc' }],
    });
  }

  async update(id: string, data: Prisma.TestCaseUpdateInput): Promise<TestCase> {
    return prisma.testCase.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.testCase.delete({ where: { id } });
  }
}

export const testCaseRepository = new TestCaseRepository();
