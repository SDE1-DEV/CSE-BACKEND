import { DailyChallenge } from '@prisma/client';
import { dailyChallengeRepository } from '../repositories/daily-challenge.repository';
import { codingProblemRepository } from '../repositories/coding-problem.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, CODING_MESSAGES } from '../constants';
import { CreateDailyChallengeInput, UpdateDailyChallengeInput } from '../validators/daily-challenge.validator';
import { cacheService, CacheKeys } from './cache.service';
import { env } from '../config/env';

export class DailyChallengeService {
  async create(data: CreateDailyChallengeInput): Promise<DailyChallenge> {
    const problem = await codingProblemRepository.findById(data.problemId);
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);

    const date = this.parseDate(data.challengeDate);
    const exists = await dailyChallengeRepository.existsByDate(date);
    if (exists) throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.DAILY_CHALLENGE_DATE_EXISTS);

    return dailyChallengeRepository.create({
      problem: { connect: { id: data.problemId } },
      challengeDate: date,
      bonusXP: data.bonusXP ?? 50,
    });
  }

  async getToday(): Promise<DailyChallenge> {
    return cacheService.wrap(
      CacheKeys.DAILY_CHALLENGE(),
      async () => {
        const challenge = await dailyChallengeRepository.findToday();
        if (!challenge) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.DAILY_CHALLENGE_NOT_FOUND);
        return challenge;
      },
      env.CACHE_TTL_LONG, // cache for 24h — changes at midnight via cron
    );
  }

  async update(id: string, data: UpdateDailyChallengeInput): Promise<DailyChallenge> {
    const challenge = await dailyChallengeRepository.findById(id);
    if (!challenge) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.DAILY_CHALLENGE_NOT_FOUND);

    const updateData: Record<string, unknown> = {};

    if (data.problemId) {
      const problem = await codingProblemRepository.findById(data.problemId);
      if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
      updateData.problem = { connect: { id: data.problemId } };
    }

    if (data.challengeDate) {
      const date = this.parseDate(data.challengeDate);
      const exists = await dailyChallengeRepository.existsByDate(date, id);
      if (exists) throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.DAILY_CHALLENGE_DATE_EXISTS);
      updateData.challengeDate = date;
    }

    if (data.bonusXP !== undefined) updateData.bonusXP = data.bonusXP;

    const updated = await dailyChallengeRepository.update(id, updateData);
    await cacheService.del(CacheKeys.DAILY_CHALLENGE());
    return updated;
  }

  async delete(id: string): Promise<void> {
    const challenge = await dailyChallengeRepository.findById(id);
    if (!challenge) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.DAILY_CHALLENGE_NOT_FOUND);
    await dailyChallengeRepository.delete(id);
    await cacheService.del(CacheKeys.DAILY_CHALLENGE());
  }

  private parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year!, month! - 1, day!));
    return d;
  }
}

export const dailyChallengeService = new DailyChallengeService();
