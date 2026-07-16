import { prisma } from '../../config/database';

export class PlatformMetricRepository {
  async findByDateRange(startDate: Date, endDate: Date) {
    return prisma.platformMetric.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    });
  }

  async findLatest(limit = 30) {
    return prisma.platformMetric.findMany({
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async upsertToday(data: Partial<{
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    learningHours: number;
    codingSubmissions: number;
    projectsCreated: number;
    applications: number;
    eventsRegistered: number;
    avgSessionTime: number;
    storageUsed: number;
    apiRequests: number;
  }>) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return prisma.platformMetric.upsert({
      where: { date: today },
      update: data,
      create: { date: today, ...data },
    });
  }
}

export const platformMetricRepository = new PlatformMetricRepository();
