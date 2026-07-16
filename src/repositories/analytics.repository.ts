import { UserAnalytics, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class AnalyticsRepository {
  async findByUserId(userId: string): Promise<UserAnalytics | null> {
    return prisma.userAnalytics.findUnique({ where: { userId } });
  }

  async upsert(userId: string, data: Prisma.UserAnalyticsUpdateInput): Promise<UserAnalytics> {
    return prisma.userAnalytics.upsert({
      where: { userId },
      update: data,
      create: {
        user: { connect: { id: userId } },
        totalStudyMinutes: (data.totalStudyMinutes as number) ?? 0,
        currentLearningStreak: (data.currentLearningStreak as number) ?? 0,
        longestLearningStreak: (data.longestLearningStreak as number) ?? 0,
        lastLogin: data.lastLogin as Date | null | undefined,
      },
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await prisma.userAnalytics.upsert({
      where: { userId },
      update: { lastLogin: new Date() },
      create: { userId, lastLogin: new Date() },
    });
  }
}

export const analyticsRepository = new AnalyticsRepository();
