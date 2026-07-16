/**
 * PRD-07: Super Admin Service
 *
 * Handles all SUPER_ADMIN operations:
 * - Dashboard
 * - User management (list, get, update, delete, promote, demote)
 * - Manager permission management
 * - Platform analytics
 * - Platform settings
 * - Audit logs
 * - Reports
 * - System logs
 */

import crypto from 'crypto';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { getRedisClient, isRedisAvailable } from '../../config/redis';
import { auditLogRepository } from '../../repositories/admin/audit-log.repository';
import { managerPermissionRepository } from '../../repositories/admin/manager-permission.repository';
import { roleHistoryRepository } from '../../repositories/admin/role-history.repository';
import { platformMetricRepository } from '../../repositories/admin/platform-metric.repository';
import { platformSettingRepository } from '../../repositories/platform-setting.repository';

const DASHBOARD_CACHE_KEY = 'super_admin:dashboard';
const DASHBOARD_TTL = 300; // 5 minutes

export class SuperAdminService {
  // ── Dashboard ──────────────────────────────────────────────────────────────

  async getDashboard() {
    const redis = getRedisClient();

    if (isRedisAvailable() && redis) {
      const cached = await redis.get(DASHBOARD_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    }

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      managers,
      students,
      activeSessions,
      totalRoadmaps,
      totalProblems,
      totalProjects,
      totalJobs,
      totalEvents,
      newUsersToday,
      newUsersThisMonth,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.MANAGER } }),
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { lastLoginAt: { gte: today } } }),
      prisma.roadmap.count({ where: { isPublished: true } }),
      prisma.codingProblem.count({ where: { isPublished: true } }),
      prisma.project.count({ where: { isPublished: true } }),
      prisma.jobPosting.count({ where: { isPublished: true } }),
      prisma.event.count({ where: { isPublished: true } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
      auditLogRepository.findAll({ limit: 10 }),
    ]);

    const dashboard = {
      users: {
        total: totalUsers,
        managers,
        students,
        activeSessions,
        newToday: newUsersToday,
        newThisMonth: newUsersThisMonth,
      },
      content: {
        roadmaps: totalRoadmaps,
        problems: totalProblems,
        projects: totalProjects,
        jobs: totalJobs,
        events: totalEvents,
      },
      recentActivity: recentActivity.data,
    };

    if (isRedisAvailable() && redis) {
      await redis.setex(DASHBOARD_CACHE_KEY, DASHBOARD_TTL, JSON.stringify(dashboard));
    }

    return dashboard;
  }

  // ── User Management ────────────────────────────────────────────────────────

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
    const where: Record<string, unknown> = {};
    if (search) {
      where['OR'] = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where['role'] = role.toUpperCase();

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isVerified: true,
          profileImage: true,
          collegeName: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { data: users, total, page, limit };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        managerPermissions: true,
        roleHistories: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateUser(id: string, data: { fullName?: string; isVerified?: boolean }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    if (user.role === Role.SUPER_ADMIN) throw new Error('Cannot modify the Super Admin account');

    return prisma.user.update({ where: { id }, data });
  }

  async deleteUser(id: string, performedBy: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    if (user.role === Role.SUPER_ADMIN) throw new Error('Cannot delete the Super Admin account');

    await prisma.user.delete({ where: { id } });

    await auditLogRepository.create({
      performedBy,
      targetUser: id,
      role: Role.SUPER_ADMIN,
      action: 'USER_DELETED',
      entity: 'User',
      entityId: id,
      oldValue: { email: user.email, role: user.role },
    });
  }

  async updateUserStatus(id: string, isVerified: boolean, performedBy: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    if (user.role === Role.SUPER_ADMIN) throw new Error('Cannot modify the Super Admin account');

    const updated = await prisma.user.update({ where: { id }, data: { isVerified } });

    await auditLogRepository.create({
      performedBy,
      targetUser: id,
      role: Role.SUPER_ADMIN,
      action: isVerified ? 'USER_VERIFIED' : 'USER_UNVERIFIED',
      entity: 'User',
      entityId: id,
    });

    return updated;
  }

  // ── Promote / Demote ───────────────────────────────────────────────────────

  async promoteUser(
    id: string,
    performedBy: string,
    reason?: string,
    modules?: Partial<Record<string, boolean>>,
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    if (user.role === Role.SUPER_ADMIN) throw new Error('Cannot promote/demote the Super Admin account');
    if (user.role === Role.MANAGER) throw new Error('User is already a Manager');

    const updated = await prisma.user.update({
      where: { id },
      data: { role: Role.MANAGER },
    });

    // Set default permissions (all enabled) or from provided modules
    const defaultModules = {
      learning: true,
      coding: true,
      projects: true,
      placements: true,
      events: true,
      notifications: true,
      reports: true,
    };
    await managerPermissionRepository.upsertPermissions(id, modules ?? defaultModules);

    await roleHistoryRepository.create({
      userId: id,
      oldRole: user.role,
      newRole: Role.MANAGER,
      reason,
      changedBy: performedBy,
    });

    await auditLogRepository.create({
      performedBy,
      targetUser: id,
      role: Role.SUPER_ADMIN,
      action: 'USER_PROMOTED',
      entity: 'User',
      entityId: id,
      oldValue: { role: user.role },
      newValue: { role: Role.MANAGER },
    });

    return updated;
  }

  async demoteUser(id: string, performedBy: string, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    if (user.role === Role.SUPER_ADMIN) throw new Error('Cannot promote/demote the Super Admin account');
    if (user.role !== Role.MANAGER) throw new Error('User is not a Manager');

    const updated = await prisma.user.update({
      where: { id },
      data: { role: Role.STUDENT },
    });

    // Remove all permissions
    await managerPermissionRepository.deleteByManager(id);

    await roleHistoryRepository.create({
      userId: id,
      oldRole: Role.MANAGER,
      newRole: Role.STUDENT,
      reason,
      changedBy: performedBy,
    });

    await auditLogRepository.create({
      performedBy,
      targetUser: id,
      role: Role.SUPER_ADMIN,
      action: 'USER_DEMOTED',
      entity: 'User',
      entityId: id,
      oldValue: { role: Role.MANAGER },
      newValue: { role: Role.STUDENT },
    });

    return updated;
  }

  // ── Manager Permissions ────────────────────────────────────────────────────

  async getManagers({ page = 1, limit = 20 }: { page?: number; limit?: number }) {
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: Role.MANAGER },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { managerPermissions: true },
      }),
      prisma.user.count({ where: { role: Role.MANAGER } }),
    ]);
    return { data, total, page, limit };
  }

  async getManagerById(id: string) {
    const manager = await prisma.user.findFirst({
      where: { id, role: Role.MANAGER },
      include: { managerPermissions: true },
    });
    if (!manager) throw new Error('Manager not found');
    return manager;
  }

  async updateManagerPermissions(
    managerId: string,
    permissions: Partial<Record<string, boolean>>,
    performedBy: string,
  ) {
    const manager = await prisma.user.findFirst({ where: { id: managerId, role: Role.MANAGER } });
    if (!manager) throw new Error('Manager not found');

    const result = await managerPermissionRepository.upsertPermissions(managerId, permissions);

    await auditLogRepository.create({
      performedBy,
      targetUser: managerId,
      role: Role.SUPER_ADMIN,
      action: 'PERMISSION_UPDATED',
      entity: 'ManagerPermission',
      entityId: managerId,
      newValue: permissions as object,
    });

    return result;
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  async getPlatformAnalytics() {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      // Learning
      totalLessons,
      publishedLessons,
      totalRoadmaps,

      // Coding
      totalProblems,
      totalSubmissions,
      acceptedSubmissions,

      // Projects
      totalProjects,
      totalTeams,

      // Users
      totalUsers,
      newUsersLast7Days,
      newUsersLast30Days,

      // Applications
      totalApplications,
      totalEvents,
      totalRegistrations,

      // Recent metrics
      recentMetrics,
    ] = await Promise.all([
      prisma.lesson.count(),
      prisma.lesson.count({ where: { isPublished: true } }),
      prisma.roadmap.count(),

      prisma.codingProblem.count(),
      prisma.submission.count(),
      prisma.submission.count({ where: { status: 'ACCEPTED' } }),

      prisma.project.count(),
      prisma.team.count(),

      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.user.count({ where: { createdAt: { gte: last30Days } } }),

      prisma.jobApplication.count(),
      prisma.event.count(),
      prisma.eventRegistration.count(),

      platformMetricRepository.findLatest(30),
    ]);

    return {
      learning: { totalLessons, publishedLessons, totalRoadmaps },
      coding: {
        totalProblems,
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate: totalSubmissions > 0 ? (acceptedSubmissions / totalSubmissions) * 100 : 0,
      },
      projects: { totalProjects, totalTeams },
      users: { totalUsers, newUsersLast7Days, newUsersLast30Days },
      placements: { totalApplications, totalEvents, totalRegistrations },
      metrics: recentMetrics,
    };
  }

  // ── Platform Settings ──────────────────────────────────────────────────────

  async getSettings() {
    const settings = await platformSettingRepository.findAll();
    const result: Record<string, unknown> = {};
    settings.forEach((s: { key: string; value: string }) => {
      try {
        result[s.key] = JSON.parse(s.value);
      } catch {
        result[s.key] = s.value;
      }
    });
    return result;
  }

  async updateSettings(
    settings: Record<string, unknown>,
    performedBy: string,
  ) {
    const entries = Object.entries(settings).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }));

    const result = await platformSettingRepository.updateMany(entries);

    await auditLogRepository.create({
      performedBy,
      role: Role.SUPER_ADMIN,
      action: 'SETTINGS_CHANGED',
      entity: 'PlatformSetting',
      newValue: settings as object,
    });

    return result;
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────────

  async getAuditLogs(filters: {
    role?: string;
    action?: string;
    module?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    return auditLogRepository.findAll(filters);
  }

  // ── Reports ────────────────────────────────────────────────────────────────

  async getReports({ startDate, endDate }: { startDate?: string; endDate?: string }) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const [newUsers, newSubmissions, newApplications, newEventRegistrations, newTeams] =
      await Promise.all([
        prisma.user.count({ where: hasDateFilter ? { createdAt: dateFilter } : {} }),
        prisma.submission.count({ where: hasDateFilter ? { submittedAt: dateFilter } : {} }),
        prisma.jobApplication.count({ where: hasDateFilter ? { appliedAt: dateFilter } : {} }),
        prisma.eventRegistration.count({ where: hasDateFilter ? { registeredAt: dateFilter } : {} }),
        prisma.team.count({ where: hasDateFilter ? { createdAt: dateFilter } : {} }),
      ]);

    return {
      period: { startDate: startDate ?? 'all-time', endDate: endDate ?? 'present' },
      summary: { newUsers, newSubmissions, newApplications: newApplications, newEventRegistrations, newTeams },
      generatedAt: new Date().toISOString(),
      reportId: crypto.randomUUID(),
    };
  }

  // ── Daily Metric Snapshot ──────────────────────────────────────────────────

  async createDailySnapshot() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalUsers, activeUsers, newUsers, codingSubmissions, projectsCreated, applications, eventsRegistered] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { lastLoginAt: { gte: today } } }),
        prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma.submission.count({ where: { submittedAt: { gte: today } } }),
        prisma.project.count({ where: { createdAt: { gte: today } } }),
        prisma.jobApplication.count({ where: { appliedAt: { gte: today } } }),
        prisma.eventRegistration.count({ where: { registeredAt: { gte: today } } }),
      ]);

    return platformMetricRepository.upsertToday({
      totalUsers,
      activeUsers,
      newUsers,
      codingSubmissions,
      projectsCreated,
      applications,
      eventsRegistered,
    });
  }

  // ── System Logs ────────────────────────────────────────────────────────────

  async getSystemLogs(filters: {
    level?: string;
    module?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { systemLogRepository } = await import('../../repositories/admin/system-log.repository');
    return systemLogRepository.findAll(filters);
  }

  // ── Manager Invitations ────────────────────────────────────────────────────

  async sendManagerInvitation(email: string, invitedBy: string) {
    const crypto = await import('crypto');
    const token = crypto.default.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Revoke any existing pending invitations for this email
    await prisma.managerInvitation.updateMany({
      where: { email, status: 'PENDING' },
      data: { status: 'REVOKED' },
    });

    const invitation = await prisma.managerInvitation.create({
      data: { email, token, invitedBy, expiresAt, status: 'PENDING' },
    });

    await auditLogRepository.create({
      performedBy: invitedBy,
      role: Role.SUPER_ADMIN,
      action: 'MANAGER_INVITATION_SENT',
      module: null,
      entity: 'ManagerInvitation',
      entityId: invitation.id,
      newValue: { email } as object,
    });

    return { id: invitation.id, email, token, expiresAt };
  }

  async acceptManagerInvitation(token: string, userId: string, userEmail: string) {
    const invitation = await prisma.managerInvitation.findUnique({ where: { token } });

    if (!invitation) throw new Error('Invalid or expired invitation token');
    if (invitation.status !== 'PENDING') throw new Error('This invitation has already been used');
    if (new Date() > invitation.expiresAt) {
      await prisma.managerInvitation.update({
        where: { token },
        data: { status: 'EXPIRED' },
      });
      throw new Error('Invalid or expired invitation token');
    }
    if (invitation.email !== userEmail) {
      throw new Error('This invitation is not for your email address');
    }

    // Promote user to manager
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if (user.role === Role.SUPER_ADMIN) throw new Error('Cannot modify the Super Admin account');

    await prisma.user.update({ where: { id: userId }, data: { role: Role.MANAGER } });

    // Grant all module permissions
    const defaultModules = {
      learning: true,
      coding: true,
      projects: true,
      placements: true,
      events: true,
      notifications: true,
      reports: true,
    };
    await managerPermissionRepository.upsertPermissions(userId, defaultModules);

    // Mark invitation accepted
    await prisma.managerInvitation.update({
      where: { token },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    await roleHistoryRepository.create({
      userId,
      oldRole: user.role,
      newRole: Role.MANAGER,
      reason: 'Accepted manager invitation',
      changedBy: invitation.invitedBy,
    });

    await auditLogRepository.create({
      performedBy: invitation.invitedBy,
      targetUser: userId,
      role: Role.SUPER_ADMIN,
      action: 'USER_PROMOTED',
      entity: 'User',
      entityId: userId,
      oldValue: { role: user.role },
      newValue: { role: Role.MANAGER },
    });

    return { message: 'Invitation accepted. You are now a Manager.', userId };
  }

  // ── Role History ───────────────────────────────────────────────────────────

  async getUserRoleHistory(userId: string) {
    return roleHistoryRepository.findByUser(userId);
  }
}

export const superAdminService = new SuperAdminService();