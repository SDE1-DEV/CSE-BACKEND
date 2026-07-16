import { FavoriteProblem } from '@prisma/client';
import { favoriteRepository } from '../repositories/favorite.repository';
import { codingProblemRepository } from '../repositories/coding-problem.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, CODING_MESSAGES } from '../constants';

export class FavoriteService {
  async add(userId: string, problemId: string): Promise<FavoriteProblem> {
    const problem = await codingProblemRepository.findById(problemId);
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);

    const existing = await favoriteRepository.findByUserAndProblem(userId, problemId);
    if (existing) throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.FAVORITE_EXISTS);

    return favoriteRepository.create(userId, problemId);
  }

  async remove(userId: string, problemId: string): Promise<void> {
    const problem = await codingProblemRepository.findById(problemId);
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);

    const existing = await favoriteRepository.findByUserAndProblem(userId, problemId);
    if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.FAVORITE_NOT_FOUND);

    await favoriteRepository.deleteByUserAndProblem(userId, problemId);
  }

  async getAll(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: FavoriteProblem[]; total: number; page: number; limit: number; totalPages: number }> {
    const safeLimit = Math.min(limit, 100);
    const { data, total } = await favoriteRepository.findAllByUser(userId, { page, limit: safeLimit });
    return { data, total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
  }
}

export const favoriteService = new FavoriteService();
