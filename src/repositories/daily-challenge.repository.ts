import { DailyChallenge, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class DailyChallengeRepository {
  async create(data: Prisma.DailyChallengeCreateInput): Promise<DailyChallenge> {
    return prisma.dailyChallenge.create({
      data,
      include: {
        problem: {
          include: {
            category: true,
            tags: { include: { tag: true } },
          },
        },
      },
    }) as Promise<DailyChallenge>;
  }

  async findById(id: string): Promise<DailyChallenge | null> {
    return prisma.dailyChallenge.findUnique({
      where: { id },
      include: {
        problem: {
          include: {
            category: true,
            tags: { include: { tag: true } },
          },
        },
      },
    }) as Promise<DailyChallenge | null>;
  }

  async findByDate(date: Date): Promise<DailyChallenge | null> {
    return prisma.dailyChallenge.findUnique({
      where: { challengeDate: date },
      include: {
        problem: {
          include: {
            category: true,
            tags: { include: { tag: true } },
          },
        },
      },
    }) as Promise<DailyChallenge | null>;
  }

  async findToday(): Promise<DailyChallenge | null> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return this.findByDate(today);
  }

  async existsByDate(date: Date, excludeId?: string): Promise<boolean> {
    const where: Prisma.DailyChallengeWhereInput = { challengeDate: date };
    if (excludeId) where.id = { not: excludeId };
    return (await prisma.dailyChallenge.count({ where })) > 0;
  }

  async update(id: string, data: Prisma.DailyChallengeUpdateInput): Promise<DailyChallenge> {
    return prisma.dailyChallenge.update({
      where: { id },
      data,
      include: {
        problem: { include: { category: true, tags: { include: { tag: true } } } },
      },
    }) as Promise<DailyChallenge>;
  }

  async delete(id: string): Promise<void> {
    await prisma.dailyChallenge.delete({ where: { id } });
  }
}

export const dailyChallengeRepository = new DailyChallengeRepository();
