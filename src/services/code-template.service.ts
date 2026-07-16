import { CodeTemplate } from '@prisma/client';
import { codeTemplateRepository } from '../repositories/code-template.repository';
import { codingProblemRepository } from '../repositories/coding-problem.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, CODING_MESSAGES } from '../constants';
import { CreateCodeTemplateInput, UpdateCodeTemplateInput } from '../validators/code-template.validator';

export class CodeTemplateService {
  async create(data: CreateCodeTemplateInput): Promise<CodeTemplate> {
    const problem = await codingProblemRepository.findById(data.problemId);
    if (!problem) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    }

    const exists = await codeTemplateRepository.existsForLanguage(data.problemId, data.language);
    if (exists) {
      throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.TEMPLATE_LANGUAGE_EXISTS);
    }

    return codeTemplateRepository.create({
      problem: { connect: { id: data.problemId } },
      language: data.language,
      template: data.template,
    });
  }

  async getByProblemId(problemId: string): Promise<CodeTemplate[]> {
    const problem = await codingProblemRepository.findById(problemId);
    if (!problem) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    }
    return codeTemplateRepository.findByProblemId(problemId);
  }

  async update(id: string, data: UpdateCodeTemplateInput): Promise<CodeTemplate> {
    const template = await codeTemplateRepository.findById(id);
    if (!template) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.TEMPLATE_NOT_FOUND);
    }

    if (data.language && data.language !== template.language) {
      const exists = await codeTemplateRepository.existsForLanguage(
        template.problemId,
        data.language,
        id,
      );
      if (exists) {
        throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.TEMPLATE_LANGUAGE_EXISTS);
      }
    }

    return codeTemplateRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const template = await codeTemplateRepository.findById(id);
    if (!template) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.TEMPLATE_NOT_FOUND);
    }
    await codeTemplateRepository.delete(id);
  }
}

export const codeTemplateService = new CodeTemplateService();
