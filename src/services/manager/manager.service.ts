/**
 * PRD-07: Manager Service
 *
 * Handles all MANAGER content management operations.
 * Managers can only access modules they have permission for.
 */

import { prisma } from '../../config/database';
import { getRedisClient, isRedisAvailable } from '../../config/redis';
import { auditLogRepository } from '../../repositories/admin/audit-log.repository';
import { Role } from '@prisma/client';

const MANAGER_DASHBOARD_TTL = 300; // 5 minutes

export class ManagerService {
  // ── Dashboard ──────────────────────────────────────────────────────────────

  async getDashboard(managerId: string) {
    const redis = getRedisClient();
    const cacheKey = `manager:dashboard:${managerId}`;

    if (isRedisAvailable() && redis) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const [
      publishedRoadmaps,
      draftRoadmaps,
      publishedProblems,
      draftProblems,
      publishedProjects,
      publishedJobs,
      totalEvents,
    ] = await Promise.all([
      prisma.roadmap.count({ where: { isPublished: true } }),
      prisma.roadmap.count({ where: { isPublished: false } }),
      prisma.codingProblem.count({ where: { isPublished: true } }),
      prisma.codingProblem.count({ where: { isPublished: false } }),
      prisma.project.count({ where: { isPublished: true } }),
      prisma.jobPosting.count({ where: { isPublished: true } }),
      prisma.event.count(),
    ]);

    const dashboard = {
      publishedRoadmaps,
      drafts: draftRoadmaps + draftProblems,
      problems: { published: publishedProblems, draft: draftProblems },
      projects: publishedProjects,
      events: totalEvents,
      jobs: publishedJobs,
    };

    if (isRedisAvailable() && redis) {
      await redis.setex(cacheKey, MANAGER_DASHBOARD_TTL, JSON.stringify(dashboard));
    }

    return dashboard;
  }

  // ── Learning: Categories ───────────────────────────────────────────────────

  async createCategory(data: {
    title: string;
    slug: string;
    description?: string;
    icon?: string;
    displayOrder?: number;
  }) {
    return prisma.category.create({ data });
  }

  async updateCategory(id: string, data: Partial<{ title: string; description: string; icon: string; isActive: boolean }>) {
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) throw new Error('Category not found');
    return prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) throw new Error('Category not found');
    await prisma.category.delete({ where: { id } });
  }

  // ── Learning: Roadmaps ─────────────────────────────────────────────────────

  async createRoadmap(
    data: {
      categoryId: string;
      title: string;
      slug: string;
      description?: string;
      difficulty?: string;
      estimatedHours?: number;
    },
    managerId: string,
  ) {
    const roadmap = await prisma.roadmap.create({ data: data as Parameters<typeof prisma.roadmap.create>[0]['data'] });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'ROADMAP_CREATED',
      module: 'LEARNING',
      entity: 'Roadmap',
      entityId: roadmap.id,
      newValue: data as object,
    });
    return roadmap;
  }

  async updateRoadmap(id: string, data: Record<string, unknown>, managerId: string) {
    const roadmap = await prisma.roadmap.findUnique({ where: { id } });
    if (!roadmap) throw new Error('Roadmap not found');
    const updated = await prisma.roadmap.update({ where: { id }, data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'ROADMAP_UPDATED',
      module: 'LEARNING',
      entity: 'Roadmap',
      entityId: id,
    });
    return updated;
  }

  async deleteRoadmap(id: string, managerId: string) {
    const roadmap = await prisma.roadmap.findUnique({ where: { id } });
    if (!roadmap) throw new Error('Roadmap not found');
    await prisma.roadmap.delete({ where: { id } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'ROADMAP_DELETED',
      module: 'LEARNING',
      entity: 'Roadmap',
      entityId: id,
      oldValue: { title: roadmap.title } as object,
    });
  }

  async publishRoadmap(id: string, managerId: string) {
    const roadmap = await prisma.roadmap.findUnique({ where: { id } });
    if (!roadmap) throw new Error('Roadmap not found');
    const updated = await prisma.roadmap.update({ where: { id }, data: { isPublished: true } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CONTENT_PUBLISHED',
      module: 'LEARNING',
      entity: 'Roadmap',
      entityId: id,
    });
    return updated;
  }

  async archiveRoadmap(id: string, managerId: string) {
    const roadmap = await prisma.roadmap.findUnique({ where: { id } });
    if (!roadmap) throw new Error('Roadmap not found');
    const updated = await prisma.roadmap.update({ where: { id }, data: { isPublished: false } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CONTENT_ARCHIVED',
      module: 'LEARNING',
      entity: 'Roadmap',
      entityId: id,
    });
    return updated;
  }

  // ── Learning: Sections ─────────────────────────────────────────────────────

  async createSection(data: { roadmapId: string; title: string; description?: string; order?: number }) {
    return prisma.roadmapSection.create({ data });
  }

  async updateSection(id: string, data: Partial<{ title: string; description: string; order: number }>) {
    const section = await prisma.roadmapSection.findUnique({ where: { id } });
    if (!section) throw new Error('Section not found');
    return prisma.roadmapSection.update({ where: { id }, data });
  }

  async deleteSection(id: string) {
    const section = await prisma.roadmapSection.findUnique({ where: { id } });
    if (!section) throw new Error('Section not found');
    await prisma.roadmapSection.delete({ where: { id } });
  }

  // ── Learning: Lessons ──────────────────────────────────────────────────────

  async createLesson(
    data: { sectionId: string; title: string; slug: string; contentType?: string; estimatedMinutes?: number; order?: number },
    managerId: string,
  ) {
    const lesson = await prisma.lesson.create({ data: data as Parameters<typeof prisma.lesson.create>[0]['data'] });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'LESSON_CREATED',
      module: 'LEARNING',
      entity: 'Lesson',
      entityId: lesson.id,
    });
    return lesson;
  }

  async updateLesson(id: string, data: Record<string, unknown>, managerId: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new Error('Lesson not found');
    const updated = await prisma.lesson.update({ where: { id }, data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'LESSON_UPDATED',
      module: 'LEARNING',
      entity: 'Lesson',
      entityId: id,
    });
    return updated;
  }

  async deleteLesson(id: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new Error('Lesson not found');
    await prisma.lesson.delete({ where: { id } });
  }

  // ── Learning: Resources ────────────────────────────────────────────────────

  async createResource(data: { lessonId: string; type: string; title: string; url: string; duration?: number; author?: string }) {
    return prisma.learningResource.create({ data: data as Parameters<typeof prisma.learningResource.create>[0]['data'] });
  }

  async updateResource(id: string, data: Record<string, unknown>) {
    const resource = await prisma.learningResource.findUnique({ where: { id } });
    if (!resource) throw new Error('Resource not found');
    return prisma.learningResource.update({ where: { id }, data });
  }

  async deleteResource(id: string) {
    const resource = await prisma.learningResource.findUnique({ where: { id } });
    if (!resource) throw new Error('Resource not found');
    await prisma.learningResource.delete({ where: { id } });
  }

  // ── Coding: Problems ───────────────────────────────────────────────────────

  async createProblem(data: Record<string, unknown>, managerId: string) {
    const problem = await prisma.codingProblem.create({ data: data as Parameters<typeof prisma.codingProblem.create>[0]['data'] });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CODING_PROBLEM_CREATED',
      module: 'CODING',
      entity: 'CodingProblem',
      entityId: problem.id,
    });
    return problem;
  }

  async updateProblem(id: string, data: Record<string, unknown>, managerId: string) {
    const problem = await prisma.codingProblem.findUnique({ where: { id } });
    if (!problem) throw new Error('Problem not found');
    const updated = await prisma.codingProblem.update({ where: { id }, data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CODING_PROBLEM_UPDATED',
      module: 'CODING',
      entity: 'CodingProblem',
      entityId: id,
    });
    return updated;
  }

  async deleteProblem(id: string, managerId: string) {
    const problem = await prisma.codingProblem.findUnique({ where: { id } });
    if (!problem) throw new Error('Problem not found');
    await prisma.codingProblem.delete({ where: { id } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CODING_PROBLEM_DELETED',
      module: 'CODING',
      entity: 'CodingProblem',
      entityId: id,
      oldValue: { title: problem.title } as object,
    });
  }

  async publishProblem(id: string, managerId: string) {
    const problem = await prisma.codingProblem.findUnique({ where: { id } });
    if (!problem) throw new Error('Problem not found');
    const updated = await prisma.codingProblem.update({ where: { id }, data: { isPublished: true } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CONTENT_PUBLISHED',
      module: 'CODING',
      entity: 'CodingProblem',
      entityId: id,
    });
    return updated;
  }

  async archiveProblem(id: string, managerId: string) {
    const problem = await prisma.codingProblem.findUnique({ where: { id } });
    if (!problem) throw new Error('Problem not found');
    const updated = await prisma.codingProblem.update({ where: { id }, data: { isPublished: false } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CONTENT_ARCHIVED',
      module: 'CODING',
      entity: 'CodingProblem',
      entityId: id,
    });
    return updated;
  }

  // ── Projects ───────────────────────────────────────────────────────────────

  async createProject(data: Record<string, unknown>, managerId: string) {
    const project = await prisma.project.create({ data: data as Parameters<typeof prisma.project.create>[0]['data'] });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'PROJECT_CREATED',
      module: 'PROJECTS',
      entity: 'Project',
      entityId: project.id,
    });
    return project;
  }

  async updateProject(id: string, data: Record<string, unknown>, managerId: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new Error('Project not found');
    const updated = await prisma.project.update({ where: { id }, data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'PROJECT_UPDATED',
      module: 'PROJECTS',
      entity: 'Project',
      entityId: id,
    });
    return updated;
  }

  async deleteProject(id: string, managerId: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new Error('Project not found');
    await prisma.project.delete({ where: { id } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'PROJECT_DELETED',
      module: 'PROJECTS',
      entity: 'Project',
      entityId: id,
    });
  }

  // ── Placements ─────────────────────────────────────────────────────────────

  async createCompany(data: { name: string; slug: string; description?: string; industry?: string }, managerId: string) {
    const company = await prisma.company.create({ data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'COMPANY_ADDED',
      module: 'PLACEMENTS',
      entity: 'Company',
      entityId: company.id,
    });
    return company;
  }

  async updateCompany(id: string, data: Record<string, unknown>) {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) throw new Error('Company not found');
    return prisma.company.update({ where: { id }, data });
  }

  async deleteCompany(id: string) {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) throw new Error('Company not found');
    await prisma.company.delete({ where: { id } });
  }

  async createJob(data: Record<string, unknown>, managerId: string) {
    const job = await prisma.jobPosting.create({ data: data as Parameters<typeof prisma.jobPosting.create>[0]['data'] });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'JOB_POSTED',
      module: 'PLACEMENTS',
      entity: 'JobPosting',
      entityId: job.id,
    });
    return job;
  }

  async updateJob(id: string, data: Record<string, unknown>) {
    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) throw new Error('Job not found');
    return prisma.jobPosting.update({ where: { id }, data });
  }

  async deleteJob(id: string) {
    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) throw new Error('Job not found');
    await prisma.jobPosting.delete({ where: { id } });
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  async createEvent(data: Record<string, unknown>, managerId: string) {
    const event = await prisma.event.create({ data: data as Parameters<typeof prisma.event.create>[0]['data'] });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'EVENT_CREATED',
      module: 'EVENTS',
      entity: 'Event',
      entityId: event.id,
    });
    return event;
  }

  async updateEvent(id: string, data: Record<string, unknown>) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found');
    return prisma.event.update({ where: { id }, data });
  }

  async deleteEvent(id: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found');
    await prisma.event.delete({ where: { id } });
  }

  async getEventRegistrations(eventId: string) {
    return prisma.eventRegistration.findMany({
      where: { eventId },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  async createNotification(data: { userId: string; title: string; message: string; type: string }, managerId: string) {
    const notification = await prisma.notification.create({
      data: data as Parameters<typeof prisma.notification.create>[0]['data'],
    });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'NOTIFICATION_SENT',
      module: 'NOTIFICATIONS',
      entity: 'Notification',
      entityId: notification.id,
    });
    return notification;
  }

  async broadcastNotification(
    data: { title: string; message: string; type: string },
    targetRole: string | undefined,
    managerId: string,
  ) {
    const users = await prisma.user.findMany({
      where: targetRole ? { role: targetRole.toUpperCase() as Role } : {},
      select: { id: true },
    });

    const notifications = await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title: data.title,
        message: data.message,
        type: (data.type ?? 'SYSTEM') as Parameters<typeof prisma.notification.create>[0]['data']['type'],
      })),
    });

    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'NOTIFICATION_SENT',
      module: 'NOTIFICATIONS',
      newValue: { ...data, recipientCount: users.length } as object,
    });

    return { sent: notifications.count };
  }

  async updateNotification(id: string, data: Record<string, unknown>) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new Error('Notification not found');
    return prisma.notification.update({ where: { id }, data });
  }

  async deleteNotification(id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new Error('Notification not found');
    await prisma.notification.delete({ where: { id } });
  }

  // ── Manager Reports ────────────────────────────────────────────────────────

  async getManagerReports(managerId: string) {
    const [
      totalRoadmaps,
      publishedRoadmaps,
      totalProblems,
      publishedProblems,
      totalProjects,
      totalJobs,
      totalEvents,
    ] = await Promise.all([
      prisma.roadmap.count(),
      prisma.roadmap.count({ where: { isPublished: true } }),
      prisma.codingProblem.count(),
      prisma.codingProblem.count({ where: { isPublished: true } }),
      prisma.project.count(),
      prisma.jobPosting.count(),
      prisma.event.count(),
    ]);

    return {
      managerId,
      learning: { totalRoadmaps, publishedRoadmaps, draftRoadmaps: totalRoadmaps - publishedRoadmaps },
      coding: { totalProblems, publishedProblems, draftProblems: totalProblems - publishedProblems },
      projects: { totalProjects },
      placements: { totalJobs },
      events: { totalEvents },
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Bulk Actions ───────────────────────────────────────────────────────────

  async bulkPublish(entity: string, ids: string[], managerId: string) {
    const model = this._getModel(entity);
    await model.updateMany({ where: { id: { in: ids } }, data: { isPublished: true } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'BULK_PUBLISHED',
      entity,
      newValue: { ids } as object,
    });
    return { updated: ids.length };
  }

  async bulkArchive(entity: string, ids: string[], managerId: string) {
    const model = this._getModel(entity);
    await model.updateMany({ where: { id: { in: ids } }, data: { isPublished: false } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'BULK_ARCHIVED',
      entity,
      newValue: { ids } as object,
    });
    return { updated: ids.length };
  }

  async bulkDelete(entity: string, ids: string[], managerId: string) {
    const model = this._getModel(entity);
    await model.deleteMany({ where: { id: { in: ids } } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'BULK_DELETED',
      entity,
      newValue: { ids } as object,
    });
    return { deleted: ids.length };
  }

  private _getModel(entity: string) {
    const map: Record<string, unknown> = {
      roadmaps: prisma.roadmap,
      problems: prisma.codingProblem,
      projects: prisma.project,
      jobs: prisma.jobPosting,
      events: prisma.event,
    };
    const model = map[entity];
    if (!model) throw new Error(`Unknown entity: ${entity}`);
    return model as { updateMany: (args: unknown) => Promise<unknown>; deleteMany: (args: unknown) => Promise<unknown> };
  }
}

export const managerService = new ManagerService();
