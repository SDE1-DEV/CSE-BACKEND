import { prisma } from '../config/database';
import { platformSettingRepository } from '../repositories/platform-setting.repository';

export class AdminService {
  async getDashboard() {
    const [
      totalUsers,
      activeUsers,
      publishedRoadmaps,
      codingProblems,
      projects,
      teams,
      jobs,
      events,
      dailyRegistrations,
    ] = await Promise.all([
      prisma.user.count(),

      // Active users: logged in within last 30 days
      prisma.user.count({
        where: {
          lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),

      prisma.roadmap.count({ where: { isPublished: true } }),
      prisma.codingProblem.count({ where: { isPublished: true } }),
      prisma.project.count(),
      prisma.team.count(),
      prisma.jobPosting.count({ where: { isPublished: true } }),
      prisma.event.count({ where: { isPublished: true } }),

      // Daily registrations for past 7 days
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count: { id: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Platform growth: user registrations per day
    const platformGrowth = dailyRegistrations.map((g) => ({
      date: g.createdAt.toISOString().split('T')[0],
      count: g._count.id,
    }));

    return {
      stats: {
        totalUsers,
        activeUsers,
        publishedRoadmaps,
        codingProblems,
        projects,
        teams,
        jobs,
        events,
      },
      platformGrowth,
      dailyRegistrations: platformGrowth,
    };
  }

  async getReports(startDate?: string, endDate?: string) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const userWhere = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const submissionWhere = Object.keys(dateFilter).length > 0 ? { submittedAt: dateFilter } : {};
    const appWhere = Object.keys(dateFilter).length > 0 ? { appliedAt: dateFilter } : {};
    const regWhere = Object.keys(dateFilter).length > 0 ? { registeredAt: dateFilter } : {};

    const [
      newUsers,
      newSubmissions,
      newApplications,
      newEventRegistrations,
      newTeams,
    ] = await Promise.all([
      prisma.user.count({ where: userWhere }),
      prisma.submission.count({ where: submissionWhere }),
      prisma.jobApplication.count({ where: appWhere }),
      prisma.eventRegistration.count({ where: regWhere }),
      prisma.team.count({ where: userWhere }),
    ]);

    return {
      period: { startDate: startDate ?? 'all-time', endDate: endDate ?? 'present' },
      summary: {
        newUsers,
        newSubmissions,
        newJobApplications: newApplications,
        newEventRegistrations,
        newTeams,
      },
    };
  }

  async getSettings() {
    return platformSettingRepository.findAll();
  }

  async updateSettings(settings: { key: string; value: string; description?: string }[]) {
    return platformSettingRepository.updateMany(settings);
  }
}

export const adminService = new AdminService();
