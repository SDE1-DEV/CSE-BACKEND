import { prisma } from '../config/database';
import { platformSettingRepository } from '../repositories/platform-setting.repository';

// Map resource names to Prisma models
const RESOURCE_MODEL_MAP: Record<string, any> = {
  roadmaps: prisma.roadmap,
  problems: prisma.codingProblem,
  projects: prisma.project,
  jobs: prisma.jobPosting,
  events: prisma.event,
};

export class AdminService {
  // Get stats for dashboard (matches /admin/stats)
  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      totalRoadmaps,
      totalProblems,
      totalProjects,
      totalTeams,
      totalJobs,
      totalEvents,
      newUsersThisMonth,
      activeUsersToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.roadmap.count(),
      prisma.codingProblem.count(),
      prisma.project.count(),
      prisma.team.count(),
      prisma.jobPosting.count(),
      prisma.event.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: startOfToday } } }),
    ]);

    return {
      totalUsers,
      totalRoadmaps,
      totalProblems,
      totalProjects,
      totalTeams,
      totalJobs,
      totalEvents,
      newUsersThisMonth,
      activeUsersToday,
    };
  }

  // User management
  async getUsers({
    search,
    role,
    page = 1,
    limit = 20,
  }: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role.toUpperCase();
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Transform role to lowercase to match frontend
    const transformedUsers = users.map((user) => ({
      ...user,
      role: user.role.toLowerCase(),
      college: user.collegeName,
      lastActiveAt: user.lastLoginAt,
    }));

    return { data: transformedUsers, total, page, limit };
  }

  async updateUserRole(id: string, role: string) {
    // PRD-07: Guard against modifying SUPER_ADMIN
    const existing = await prisma.user.findUnique({ where: { id } });
    if (existing?.role === 'SUPER_ADMIN') {
      throw new Error('Cannot modify the Super Admin account');
    }
    const user = await prisma.user.update({
      where: { id },
      data: { role: role.toUpperCase() as any },
    });
    return {
      ...user,
      role: user.role.toLowerCase(),
      college: user.collegeName,
      lastActiveAt: user.lastLoginAt,
    };
  }

  async deleteUser(id: string) {
    // PRD-08.1: Guard against deleting SUPER_ADMIN
    const existing = await prisma.user.findUnique({ where: { id } });
    if (existing?.role === 'SUPER_ADMIN') {
      throw new Error('Cannot delete the Super Admin account');
    }
    await prisma.user.delete({ where: { id } });
  }

  // Report management
  private reports: Array<{
    id: string;
    type: string;
    generatedBy: string;
    createdAt: Date;
    data: any;
  }> = [];

  async getReports({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) {
    // In a real app, this would be from DB
    return {
      data: this.reports.slice((page - 1) * limit, page * limit),
      total: this.reports.length,
      page,
      limit,
    };
  }

  async generateReport(type: string, userId: string) {
    const report = {
      id: crypto.randomUUID(),
      type,
      generatedBy: userId,
      createdAt: new Date(),
      data: {},
    };
    this.reports.unshift(report);
    return report;
  }

  // Generic resource management
  async getResource(
    resource: string,
    { search, page = 1, limit = 20 }: { search?: string; page?: number; limit?: number } = {},
  ) {
    const model = RESOURCE_MODEL_MAP[resource];
    if (!model) throw new Error(`Unknown resource: ${resource}`);

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      model.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      model.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createResource(resource: string, data: any) {
    const model = RESOURCE_MODEL_MAP[resource];
    if (!model) throw new Error(`Unknown resource: ${resource}`);
    return model.create({ data });
  }

  async updateResource(resource: string, id: string, data: any) {
    const model = RESOURCE_MODEL_MAP[resource];
    if (!model) throw new Error(`Unknown resource: ${resource}`);
    return model.update({ where: { id }, data });
  }

  async deleteResource(resource: string, id: string) {
    const model = RESOURCE_MODEL_MAP[resource];
    if (!model) throw new Error(`Unknown resource: ${resource}`);
    await model.delete({ where: { id } });
  }

  async bulkDeleteResource(resource: string, ids: string[]) {
    const model = RESOURCE_MODEL_MAP[resource];
    if (!model) throw new Error(`Unknown resource: ${resource}`);
    await model.deleteMany({ where: { id: { in: ids } } });
  }

  // Backward compatibility
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

      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count: { id: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

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

  async getReportsLegacy(startDate?: string, endDate?: string) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const userWhere = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const submissionWhere = Object.keys(dateFilter).length > 0 ? { submittedAt: dateFilter } : {};
    const appWhere = Object.keys(dateFilter).length > 0 ? { appliedAt: dateFilter } : {};
    const regWhere = Object.keys(dateFilter).length > 0 ? { registeredAt: dateFilter } : {};

    const [newUsers, newSubmissions, newApplications, newEventRegistrations, newTeams] =
      await Promise.all([
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
    const settings = await platformSettingRepository.findAll();
    // Transform to platform settings object expected by frontend
    const settingsObj: any = {
      platformName: 'CSE Student Platform',
      supportEmail: 'support@example.com',
      maxUploadSize: 10,
      maintenanceMode: false,
      registrationEnabled: true,
    };
    settings.forEach((s: any) => {
      try {
        settingsObj[s.key] = JSON.parse(s.value);
      } catch {
        settingsObj[s.key] = s.value;
      }
    });
    return settingsObj;
  }

  async updateSettings(settings: Record<string, any>) {
    const settingsToUpdate = Object.entries(settings).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }));
    return platformSettingRepository.updateMany(settingsToUpdate);
  }
}

export const adminService = new AdminService();
