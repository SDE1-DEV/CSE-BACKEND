import { CodeTemplate, ProgrammingLanguage, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class CodeTemplateRepository {
  async create(data: Prisma.CodeTemplateCreateInput): Promise<CodeTemplate> {
    return prisma.codeTemplate.create({ data });
  }

  async findById(id: string): Promise<CodeTemplate | null> {
    return prisma.codeTemplate.findUnique({ where: { id } });
  }

  async findByProblemId(problemId: string): Promise<CodeTemplate[]> {
    return prisma.codeTemplate.findMany({
      where: { problemId },
      orderBy: { language: 'asc' },
    });
  }

  async findByProblemAndLanguage(
    problemId: string,
    language: ProgrammingLanguage,
  ): Promise<CodeTemplate | null> {
    return prisma.codeTemplate.findUnique({
      where: { problemId_language: { problemId, language } },
    });
  }

  async update(id: string, data: Prisma.CodeTemplateUpdateInput): Promise<CodeTemplate> {
    return prisma.codeTemplate.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.codeTemplate.delete({ where: { id } });
  }

  async existsForLanguage(
    problemId: string,
    language: ProgrammingLanguage,
    excludeId?: string,
  ): Promise<boolean> {
    const where: Prisma.CodeTemplateWhereInput = { problemId, language };
    if (excludeId) where.id = { not: excludeId };
    return (await prisma.codeTemplate.count({ where })) > 0;
  }
}

export const codeTemplateRepository = new CodeTemplateRepository();
