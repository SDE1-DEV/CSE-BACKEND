import { ProblemDiscussion } from '@prisma/client';
import { discussionRepository } from '../repositories/discussion.repository';
import { codingProblemRepository } from '../repositories/coding-problem.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, CODING_MESSAGES } from '../constants';
import { CreateDiscussionInput, UpdateDiscussionInput, GetDiscussionsQuery } from '../validators/discussion.validator';

import { buildPaginated } from '../utils/response';

export class DiscussionService {
  async create(
    userId: string,
    problemId: string,
    data: CreateDiscussionInput,
  ): Promise<ProblemDiscussion> {
    const problem = await codingProblemRepository.findById(problemId);
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);

    return discussionRepository.create({
      user: { connect: { id: userId } },
      problem: { connect: { id: problemId } },
      content: data.content,
    });
  }

  async getByProblemId(
    problemId: string,
    query: GetDiscussionsQuery,
  ): Promise<{ data: ProblemDiscussion[]; total: number; page: number; limit: number; totalPages: number }> {
    const problem = await codingProblemRepository.findById(problemId);
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const { data, total } = await discussionRepository.findByProblemId(problemId, { page, limit });
    return buildPaginated(data, total, page, limit);
  }

  async update(
    id: string,
    userId: string,
    data: UpdateDiscussionInput,
    isAdminOrMentor: boolean,
  ): Promise<ProblemDiscussion> {
    const discussion = await discussionRepository.findById(id);
    if (!discussion) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.DISCUSSION_NOT_FOUND);

    // Students can only edit their own discussions; mentors/admins can moderate
    if (!isAdminOrMentor && discussion.userId !== userId) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, CODING_MESSAGES.DISCUSSION_FORBIDDEN);
    }

    return discussionRepository.update(id, data.content);
  }

  async delete(id: string, userId: string, isAdminOrMentor: boolean): Promise<void> {
    const discussion = await discussionRepository.findById(id);
    if (!discussion) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.DISCUSSION_NOT_FOUND);

    if (!isAdminOrMentor && discussion.userId !== userId) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, CODING_MESSAGES.DISCUSSION_FORBIDDEN);
    }

    await discussionRepository.delete(id);
  }
}

export const discussionService = new DiscussionService();
