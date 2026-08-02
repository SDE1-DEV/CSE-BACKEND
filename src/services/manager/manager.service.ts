/**
 * PRD-07: Manager Service
 *
 * Handles all MANAGER content management operations.
 * Managers can only access modules they have permission for.
 */

import { prisma } from '../../config/database';
import { getRedisClient, isRedisAvailable } from '../../config/redis';
import { auditLogRepository } from '../../repositories/admin/audit-log.repository';
import { contentVersionRepository } from '../../repositories/admin/content-version.repository';
import { enqueueNotification } from '../../queues/notification.queue';
import { wsGateway } from '../../websocket/gateway';
import { Role, Prisma } from '@prisma/client';

const MANAGER_DASHBOARD_TTL = 300; // 5 minutes

export class ManagerService {
  /**
   * Produce a JSON-safe snapshot for audit `oldValue` / `newValue`.
   * Runs the value through JSON so Dates become ISO strings and `undefined`
   * keys are dropped — Prisma's Json columns reject raw Date/undefined.
   */
  private _snapshot(value: unknown): object | undefined {
    if (value === null || value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value)) as object;
  }

  /**
   * Record a CMS version-history entry for a content update. Best-effort:
   * feeds the shared ContentVersion store that powers history + restore.
   */
  private async _recordVersion(
    entity: string,
    entityId: string,
    managerId: string,
    oldValue: unknown,
    newValue: unknown,
  ): Promise<void> {
    await contentVersionRepository.save({
      entity,
      entityId,
      editedBy: managerId,
      oldValue: this._snapshot(oldValue) ?? null,
      newValue: this._snapshot(newValue) ?? null,
    });
  }

  // ── Dashboard (CMS) ───────────────────────────────────────────────────────

  async getCMSDashboard(managerId: string) {
    const redis = getRedisClient();
    const cacheKey = `manager:cms:dashboard:${managerId}`;

    if (isRedisAvailable() && redis) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCategories,
      totalRoadmaps,
      publishedRoadmaps,
      draftRoadmaps,
      archivedRoadmapsApprox,
      totalLessons,
      publishedLessons,
      totalResources,
      totalProblems,
      publishedProblems,
      totalProjects,
      publishedProjects,
      totalCompanies,
      totalJobs,
      publishedJobs,
      totalEvents,
      publishedEvents,
      totalNotifications,
      lessonsAddedToday,
      problemsAddedToday,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.category.count(),
      prisma.roadmap.count(),
      prisma.roadmap.count({ where: { isPublished: true } }),
      prisma.roadmap.count({ where: { isPublished: false } }),
      // Archived approximation — roadmaps not published and older than 30 days
      prisma.roadmap.count({
        where: {
          isPublished: false,
          updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.lesson.count(),
      prisma.lesson.count({ where: { isPublished: true } }),
      prisma.learningResource.count(),
      prisma.codingProblem.count(),
      prisma.codingProblem.count({ where: { isPublished: true } }),
      prisma.project.count(),
      prisma.project.count({ where: { isPublished: true } }),
      prisma.company.count(),
      prisma.jobPosting.count(),
      prisma.jobPosting.count({ where: { isPublished: true } }),
      prisma.event.count(),
      prisma.event.count({ where: { isPublished: true } }),
      prisma.notification.count(),
      prisma.lesson.count({ where: { createdAt: { gte: today } } }),
      prisma.codingProblem.count({ where: { createdAt: { gte: today } } }),
      auditLogRepository.findAll({ limit: 10, userId: managerId }),
    ]);

    const dashboard = {
      learning: {
        totalCategories,
        totalRoadmaps,
        publishedRoadmaps,
        draftRoadmaps,
        archivedRoadmaps: archivedRoadmapsApprox,
        totalLessons,
        publishedLessons,
        totalResources,
      },
      coding: {
        totalProblems,
        publishedProblems,
        draftProblems: totalProblems - publishedProblems,
      },
      projects: { totalProjects, publishedProjects },
      placements: { totalCompanies, totalJobs, publishedJobs },
      events: { totalEvents, publishedEvents },
      notifications: { totalNotifications },
      todayActivity: { lessonsAddedToday, problemsAddedToday },
      recentActivity: recentAuditLogs.data,
    };

    if (isRedisAvailable() && redis) {
      await redis.setex(cacheKey, MANAGER_DASHBOARD_TTL, JSON.stringify(dashboard));
    }

    return dashboard;
  }

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

  // ── Learning: List Methods ─────────────────────────────────────────────────

  async getCategories(params: { search?: string; status?: string; page?: number; limit?: number }) {
    const { search, status, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (search)
      where['OR'] = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    if (status === 'active') where['isActive'] = true;
    else if (status === 'inactive') where['isActive'] = false;
    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.category.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getRoadmaps(params: {
    search?: string;
    status?: string;
    categoryId?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, categoryId, difficulty, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (search)
      where['OR'] = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    if (categoryId) where['categoryId'] = categoryId;
    if (difficulty) where['difficulty'] = difficulty.toUpperCase();
    if (status === 'published') where['isPublished'] = true;
    else if (status === 'draft') where['isPublished'] = false;
    const [data, total] = await Promise.all([
      prisma.roadmap.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.roadmap.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getRoadmapById(id: string) {
    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      include: {
        category: true,
        sections: {
          include: { lessons: { include: { resources: true } } },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!roadmap) throw new Error('Roadmap not found');
    return roadmap;
  }

  async getSections(roadmapId: string) {
    return prisma.roadmapSection.findMany({
      where: { roadmapId },
      include: { lessons: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    });
  }

  async getLessons(params: {
    search?: string;
    status?: string;
    sectionId?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, sectionId, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (search) where['OR'] = [{ title: { contains: search, mode: 'insensitive' } }];
    if (sectionId) where['sectionId'] = sectionId;
    if (status === 'published') where['isPublished'] = true;
    else if (status === 'draft') where['isPublished'] = false;
    const [data, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { section: { include: { roadmap: { select: { id: true, title: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lesson.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getLessonById(id: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        resources: true,
        section: { include: { roadmap: { select: { id: true, title: true } } } },
      },
    });
    if (!lesson) throw new Error('Lesson not found');
    return lesson;
  }

  async getResources(params: {
    search?: string;
    lessonId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, lessonId, type, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (search) where['OR'] = [{ title: { contains: search, mode: 'insensitive' } }];
    if (lessonId) where['lessonId'] = lessonId;
    if (type) where['type'] = type.toUpperCase();
    const [data, total] = await Promise.all([
      prisma.learningResource.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { lesson: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.learningResource.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getProblems(params: {
    search?: string;
    status?: string;
    difficulty?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, difficulty, categoryId, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (search)
      where['OR'] = [
        { title: { contains: search, mode: 'insensitive' } },
        { problemStatement: { contains: search, mode: 'insensitive' } },
      ];
    if (categoryId) where['categoryId'] = categoryId;
    if (difficulty) where['difficulty'] = difficulty.toUpperCase();
    if (status === 'published') where['isPublished'] = true;
    else if (status === 'draft') where['isPublished'] = false;
    const [data, total] = await Promise.all([
      prisma.codingProblem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.codingProblem.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getProblemById(id: string) {
    const problem = await prisma.codingProblem.findUnique({
      where: { id },
      include: {
        category: true,
        testCases: true,
        templates: true,
        tags: { include: { tag: true } },
        companies: { include: { company: true } },
      },
    });
    if (!problem) throw new Error('Problem not found');
    return problem;
  }

  async getProblemCategories(params: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 50 } = params;
    const where: Record<string, unknown> = {};
    if (search) where['OR'] = [{ name: { contains: search, mode: 'insensitive' } }];
    const [data, total] = await Promise.all([
      prisma.problemCategory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { problems: true } } },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.problemCategory.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createProblemCategory(
    data: { name: string; slug: string; description?: string; displayOrder?: number },
    managerId: string,
  ) {
    const existing = await prisma.problemCategory.findUnique({ where: { slug: data.slug } });
    if (existing) throw new Error(`A category with slug "${data.slug}" already exists`);
    const cat = await prisma.problemCategory.create({ data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'PROBLEM_CATEGORY_CREATED',
      module: 'CODING',
      entity: 'ProblemCategory',
      entityId: cat.id,
      newValue: this._snapshot(cat),
    });
    return cat;
  }

  async updateProblemCategory(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      isActive: boolean;
      displayOrder: number;
    }>,
    managerId: string,
  ) {
    const cat = await prisma.problemCategory.findUnique({ where: { id } });
    if (!cat) throw new Error('Problem category not found');
    const updated = await prisma.problemCategory.update({ where: { id }, data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'PROBLEM_CATEGORY_UPDATED',
      module: 'CODING',
      entity: 'ProblemCategory',
      entityId: id,
      oldValue: this._snapshot(cat),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteProblemCategory(id: string, managerId: string) {
    const cat = await prisma.problemCategory.findUnique({
      where: { id },
      include: { _count: { select: { problems: { where: { deletedAt: null } } } } },
    });
    if (!cat) throw new Error('Problem category not found');
    if ((cat as { _count: { problems: number } })._count.problems > 0) {
      throw new Error(
        `Cannot delete: ${(cat as { _count: { problems: number } })._count.problems} problem(s) depend on this category. Reassign or delete them first.`,
      );
    }
    await prisma.problemCategory.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'PROBLEM_CATEGORY_DELETED',
      module: 'CODING',
      entity: 'ProblemCategory',
      entityId: id,
      oldValue: this._snapshot(cat),
    });
  }

  async getProjects(params: {
    search?: string;
    status?: string;
    difficulty?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, difficulty, categoryId, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (search)
      where['OR'] = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    if (categoryId) where['categoryId'] = categoryId;
    if (difficulty) where['difficulty'] = difficulty.toUpperCase();
    if (status === 'published') where['isPublished'] = true;
    else if (status === 'draft') where['isPublished'] = false;
    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          technologies: { include: { technology: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getProjectById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { category: true, technologies: { include: { technology: true } } },
    });
    if (!project) throw new Error('Project not found');
    return project;
  }

  async getProjectCategories(params: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 50 } = params;
    const where: Record<string, unknown> = {};
    if (search) where['OR'] = [{ name: { contains: search, mode: 'insensitive' } }];
    const [data, total] = await Promise.all([
      prisma.projectCategory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { projects: true } } },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.projectCategory.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createProjectCategory(
    data: {
      name: string;
      slug: string;
      description?: string;
      icon?: string;
      displayOrder?: number;
    },
    managerId: string,
  ) {
    const existing = await prisma.projectCategory.findUnique({ where: { slug: data.slug } });
    if (existing) throw new Error(`A category with slug "${data.slug}" already exists`);
    const cat = await prisma.projectCategory.create({ data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'PROJECT_CATEGORY_CREATED',
      module: 'PROJECTS',
      entity: 'ProjectCategory',
      entityId: cat.id,
      newValue: this._snapshot(cat),
    });
    return cat;
  }

  async updateProjectCategory(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      isActive: boolean;
      displayOrder: number;
    }>,
    managerId: string,
  ) {
    const cat = await prisma.projectCategory.findUnique({ where: { id } });
    if (!cat) throw new Error('Project category not found');
    const updated = await prisma.projectCategory.update({ where: { id }, data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'PROJECT_CATEGORY_UPDATED',
      module: 'PROJECTS',
      entity: 'ProjectCategory',
      entityId: id,
      oldValue: this._snapshot(cat),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteProjectCategory(id: string, managerId: string) {
    const cat = await prisma.projectCategory.findUnique({
      where: { id },
      include: { _count: { select: { projects: { where: { deletedAt: null } } } } },
    });
    if (!cat) throw new Error('Project category not found');
    if ((cat as { _count: { projects: number } })._count.projects > 0) {
      throw new Error(
        `Cannot delete: ${(cat as { _count: { projects: number } })._count.projects} project(s) depend on this category.`,
      );
    }
    await prisma.projectCategory.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'PROJECT_CATEGORY_DELETED',
      module: 'PROJECTS',
      entity: 'ProjectCategory',
      entityId: id,
      oldValue: this._snapshot(cat),
    });
  }

  async getCompanies(params: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (search)
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    const [data, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.company.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getJobs(params: {
    search?: string;
    status?: string;
    companyId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, companyId, type, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (search) where['OR'] = [{ title: { contains: search, mode: 'insensitive' } }];
    if (companyId) where['companyId'] = companyId;
    if (type) where['type'] = type.toUpperCase();
    if (status === 'published') where['isPublished'] = true;
    else if (status === 'draft') where['isPublished'] = false;
    const [data, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { company: { select: { id: true, name: true, logo: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.jobPosting.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getJobById(id: string) {
    const job = await prisma.jobPosting.findUnique({ where: { id }, include: { company: true } });
    if (!job) throw new Error('Job not found');
    return job;
  }

  async getEvents(params: {
    search?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, type, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (search)
      where['OR'] = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    if (type) where['type'] = type.toUpperCase();
    if (status === 'published') where['isPublished'] = true;
    else if (status === 'draft') where['isPublished'] = false;
    const [data, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startTime: 'desc' },
      }),
      prisma.event.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!event) throw new Error('Event not found');
    return event;
  }

  async getNotifications(params: {
    search?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, type, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (search)
      where['OR'] = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    if (type) where['type'] = type.toUpperCase();
    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getActivityLog(managerId: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    return auditLogRepository.findAll({ userId: managerId, page, limit });
  }

  async duplicateRoadmap(id: string, managerId: string) {
    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      include: { sections: { include: { lessons: { include: { resources: true } } } } },
    });
    if (!roadmap) throw new Error('Roadmap not found');
    // Single token per duplicate keeps the copy slugs unique across concurrent runs;
    // per-lesson index suffixes avoid slug collisions inside the same duplicate.
    const copyToken = Date.now();
    const newRoadmap = await prisma.$transaction(async (tx) => {
      const { id: _id, sections, createdAt, updatedAt, ...roadmapData } = roadmap;
      const created = await tx.roadmap.create({
        data: {
          ...roadmapData,
          title: `${roadmap.title} (Copy)`,
          slug: `${roadmap.slug}-copy-${copyToken}`,
          isPublished: false,
        },
      });
      for (const [sIdx, section] of sections.entries()) {
        const { id: _sId, roadmapId: _rId, lessons, ...sectionData } = section;
        const newSection = await tx.roadmapSection.create({
          data: { ...sectionData, roadmapId: created.id },
        });
        for (const [lIdx, lesson] of lessons.entries()) {
          const {
            id: _lId,
            sectionId: _secId,
            resources,
            createdAt: _lca,
            updatedAt: _lua,
            ...lessonData
          } = lesson;
          const newLesson = await tx.lesson.create({
            data: {
              ...lessonData,
              slug: `${lesson.slug}-copy-${copyToken}-${sIdx}-${lIdx}`,
              sectionId: newSection.id,
              isPublished: false,
            },
          });
          for (const resource of resources) {
            const {
              id: _resId,
              lessonId: _lesId,
              createdAt: _rca,
              updatedAt: _rua,
              ...resourceData
            } = resource;
            await tx.learningResource.create({ data: { ...resourceData, lessonId: newLesson.id } });
          }
        }
      }
      return created;
    });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'ROADMAP_DUPLICATED',
      module: 'LEARNING',
      entity: 'Roadmap',
      entityId: newRoadmap.id,
      newValue: { sourceId: id } as object,
    });
    return newRoadmap;
  }

  async duplicateProblem(id: string, managerId: string) {
    const problem = await prisma.codingProblem.findUnique({
      where: { id },
      include: { testCases: true, templates: true },
    });
    if (!problem) throw new Error('Problem not found');
    const newProblem = await prisma.$transaction(async (tx) => {
      const { id: _id, testCases, templates, createdAt, updatedAt, hints, ...problemData } = problem as any;
      const created = await tx.codingProblem.create({
        data: {
          ...problemData,
          hints: hints ?? undefined,
          title: `${problem.title} (Copy)`,
          slug: `${problem.slug}-copy-${Date.now()}`,
          isPublished: false,
        },
      });
      for (const tc of testCases) {
        const { id: _tcId, problemId: _pid, ...tcData } = tc;
        await tx.testCase.create({ data: { ...tcData, problemId: created.id } });
      }
      for (const tmpl of templates) {
        const { id: _tmplId, problemId: _pid, ...tmplData } = tmpl;
        await tx.codeTemplate.create({ data: { ...tmplData, problemId: created.id } });
      }
      return created;
    });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CODING_PROBLEM_DUPLICATED',
      module: 'CODING',
      entity: 'CodingProblem',
      entityId: newProblem.id,
    });
    return newProblem;
  }

  async publishProject(id: string, managerId: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new Error('Project not found');
    const updated = await prisma.project.update({ where: { id }, data: { isPublished: true } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CONTENT_PUBLISHED',
      module: 'PROJECTS',
      entity: 'Project',
      entityId: id,
    });
    return updated;
  }

  async archiveProject(id: string, managerId: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new Error('Project not found');
    const updated = await prisma.project.update({ where: { id }, data: { isPublished: false } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CONTENT_ARCHIVED',
      module: 'PROJECTS',
      entity: 'Project',
      entityId: id,
    });
    return updated;
  }

  async publishJob(id: string, managerId: string) {
    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) throw new Error('Job not found');
    const updated = await prisma.jobPosting.update({ where: { id }, data: { isPublished: true } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CONTENT_PUBLISHED',
      module: 'PLACEMENTS',
      entity: 'JobPosting',
      entityId: id,
    });
    return updated;
  }

  async publishEvent(id: string, managerId: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found');
    const updated = await prisma.event.update({ where: { id }, data: { isPublished: true } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CONTENT_PUBLISHED',
      module: 'EVENTS',
      entity: 'Event',
      entityId: id,
    });
    return updated;
  }

  async archiveEvent(id: string, managerId: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found');
    const updated = await prisma.event.update({ where: { id }, data: { isPublished: false } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CONTENT_ARCHIVED',
      module: 'EVENTS',
      entity: 'Event',
      entityId: id,
    });
    return updated;
  }

  // ── Import / Export ────────────────────────────────────────────────────────

  async exportContent(entity: string, format: 'json' | 'csv') {
    const entityMap: Record<string, () => Promise<unknown[]>> = {
      categories: () => prisma.category.findMany({ orderBy: { displayOrder: 'asc' } }),
      roadmaps: () =>
        prisma.roadmap.findMany({ include: { category: { select: { title: true } } } }),
      lessons: () => prisma.lesson.findMany({ orderBy: { order: 'asc' } }),
      problems: () =>
        prisma.codingProblem.findMany({ include: { category: { select: { name: true } } } }),
      projects: () =>
        prisma.project.findMany({ include: { category: { select: { name: true } } } }),
      companies: () => prisma.company.findMany({ orderBy: { name: 'asc' } }),
      jobs: () => prisma.jobPosting.findMany({ include: { company: { select: { name: true } } } }),
      events: () => prisma.event.findMany({ orderBy: { startTime: 'desc' } }),
    };

    const fetcher = entityMap[entity];
    if (!fetcher) throw new Error(`Export not supported for entity: ${entity}`);
    const data = await fetcher();

    if (format === 'json') return { format: 'json', data, count: data.length };

    // CSV: flatten first row to get headers
    if (data.length === 0) return { format: 'csv', data: '', count: 0 };
    const headers = Object.keys(data[0] as Record<string, unknown>).filter(
      (k) => typeof (data[0] as Record<string, unknown>)[k] !== 'object',
    );
    const rows = (data as Record<string, unknown>[]).map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');
    return { format: 'csv', data: csv, count: data.length };
  }

  /**
   * Import records for an entity (counterpart to exportContent).
   * Accepts an array of plain objects (e.g. a previously exported JSON payload),
   * strips system + relation-include fields, and bulk-inserts new rows.
   */
  async importContent(entity: string, records: Record<string, unknown>[], managerId: string) {
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('No records provided to import');
    }

    const SYSTEM_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt']);
    // Relation objects added by exportContent's `include` — drop them, keep scalar FK ids.
    const RELATION_FIELDS = new Set(['category', 'company', 'section', 'roadmap']);
    const cleaned = records.map((r) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) {
        if (SYSTEM_FIELDS.has(k) || RELATION_FIELDS.has(k)) continue;
        out[k] = v;
      }
      return out;
    });

    const creators: Record<
      string,
      (rows: Record<string, unknown>[]) => Promise<{ count: number }>
    > = {
      categories: (rows) =>
        prisma.category.createMany({
          data: rows as unknown as Prisma.CategoryCreateManyInput[],
          skipDuplicates: true,
        }),
      roadmaps: (rows) =>
        prisma.roadmap.createMany({
          data: rows as unknown as Prisma.RoadmapCreateManyInput[],
          skipDuplicates: true,
        }),
      lessons: (rows) =>
        prisma.lesson.createMany({
          data: rows as unknown as Prisma.LessonCreateManyInput[],
          skipDuplicates: true,
        }),
      problems: (rows) =>
        prisma.codingProblem.createMany({
          data: rows as unknown as Prisma.CodingProblemCreateManyInput[],
          skipDuplicates: true,
        }),
      projects: (rows) =>
        prisma.project.createMany({
          data: rows as unknown as Prisma.ProjectCreateManyInput[],
          skipDuplicates: true,
        }),
      companies: (rows) =>
        prisma.company.createMany({
          data: rows as unknown as Prisma.CompanyCreateManyInput[],
          skipDuplicates: true,
        }),
      jobs: (rows) =>
        prisma.jobPosting.createMany({
          data: rows as unknown as Prisma.JobPostingCreateManyInput[],
          skipDuplicates: true,
        }),
      events: (rows) =>
        prisma.event.createMany({
          data: rows as unknown as Prisma.EventCreateManyInput[],
          skipDuplicates: true,
        }),
    };

    const creator = creators[entity];
    if (!creator) throw new Error(`Import not supported for entity: ${entity}`);

    const result = await creator(cleaned);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CONTENT_IMPORTED',
      entity,
      newValue: { requested: records.length, created: result.count } as object,
    });
    return {
      entity,
      requested: records.length,
      created: result.count,
      skipped: records.length - result.count,
    };
  }

  async bulkRestore(entity: string, ids: string[], managerId: string) {
    const count = await prisma.$transaction(async (tx) => {
      const model = this._getTxModel(tx, entity);
      const result = await model.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: null },
      });
      await tx.auditLog.create({
        data: {
          performedBy: managerId,
          role: Role.MANAGER,
          action: 'BULK_RESTORED',
          entity,
          newValue: { ids } as Prisma.InputJsonValue,
        },
      });
      return (result as { count: number }).count;
    });
    return { restored: count };
  }

  // ── Learning: Categories ───────────────────────────────────────────────────

  async createCategory(
    data: {
      title: string;
      slug: string;
      description?: string;
      icon?: string;
      displayOrder?: number;
    },
    managerId: string,
  ) {
    const category = await prisma.category.create({ data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CATEGORY_CREATED',
      module: 'LEARNING',
      entity: 'Category',
      entityId: category.id,
      newValue: this._snapshot(category),
    });
    return category;
  }

  async updateCategory(
    id: string,
    data: Partial<{ title: string; description: string; icon: string; isActive: boolean }>,
    managerId: string,
  ) {
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) throw new Error('Category not found');
    const updated = await prisma.category.update({ where: { id }, data });
    await this._recordVersion('Category', id, managerId, cat, updated);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CATEGORY_UPDATED',
      module: 'LEARNING',
      entity: 'Category',
      entityId: id,
      oldValue: this._snapshot(cat),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteCategory(id: string, managerId: string) {
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) throw new Error('Category not found');
    await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CATEGORY_DELETED',
      module: 'LEARNING',
      entity: 'Category',
      entityId: id,
      oldValue: this._snapshot(cat),
    });
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
    const roadmap = await prisma.roadmap.create({
      data: data as Parameters<typeof prisma.roadmap.create>[0]['data'],
    });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'ROADMAP_CREATED',
      module: 'LEARNING',
      entity: 'Roadmap',
      entityId: roadmap.id,
      newValue: this._snapshot(roadmap),
    });
    return roadmap;
  }

  async updateRoadmap(id: string, data: Record<string, unknown>, managerId: string) {
    const roadmap = await prisma.roadmap.findUnique({ where: { id } });
    if (!roadmap) throw new Error('Roadmap not found');
    const updated = await prisma.roadmap.update({ where: { id }, data });
    await this._recordVersion('Roadmap', id, managerId, roadmap, updated);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'ROADMAP_UPDATED',
      module: 'LEARNING',
      entity: 'Roadmap',
      entityId: id,
      oldValue: this._snapshot(roadmap),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteRoadmap(id: string, managerId: string) {
    const roadmap = await prisma.roadmap.findUnique({ where: { id } });
    if (!roadmap) throw new Error('Roadmap not found');
    await prisma.roadmap.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'ROADMAP_DELETED',
      module: 'LEARNING',
      entity: 'Roadmap',
      entityId: id,
      oldValue: this._snapshot(roadmap),
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

  async createSection(
    data: { roadmapId: string; title: string; description?: string; order?: number },
    managerId: string,
  ) {
    const section = await prisma.roadmapSection.create({ data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'SECTION_CREATED',
      module: 'LEARNING',
      entity: 'RoadmapSection',
      entityId: section.id,
      newValue: this._snapshot(section),
    });
    return section;
  }

  async updateSection(
    id: string,
    data: Partial<{ title: string; description: string; order: number }>,
    managerId: string,
  ) {
    const section = await prisma.roadmapSection.findUnique({ where: { id } });
    if (!section) throw new Error('Section not found');
    const updated = await prisma.roadmapSection.update({ where: { id }, data });
    await this._recordVersion('RoadmapSection', id, managerId, section, updated);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'SECTION_UPDATED',
      module: 'LEARNING',
      entity: 'RoadmapSection',
      entityId: id,
      oldValue: this._snapshot(section),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteSection(id: string, managerId: string) {
    const section = await prisma.roadmapSection.findUnique({ where: { id } });
    if (!section) throw new Error('Section not found');
    await prisma.roadmapSection.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'SECTION_DELETED',
      module: 'LEARNING',
      entity: 'RoadmapSection',
      entityId: id,
      oldValue: this._snapshot(section),
    });
  }

  // ── Learning: Lessons ──────────────────────────────────────────────────────

  async createLesson(
    data: {
      sectionId: string;
      title: string;
      slug: string;
      contentType?: string;
      estimatedMinutes?: number;
      order?: number;
    },
    managerId: string,
  ) {
    const lesson = await prisma.lesson.create({
      data: data as Parameters<typeof prisma.lesson.create>[0]['data'],
    });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'LESSON_CREATED',
      module: 'LEARNING',
      entity: 'Lesson',
      entityId: lesson.id,
      newValue: this._snapshot(lesson),
    });
    return lesson;
  }

  async updateLesson(id: string, data: Record<string, unknown>, managerId: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new Error('Lesson not found');
    const updated = await prisma.lesson.update({ where: { id }, data });
    await this._recordVersion('Lesson', id, managerId, lesson, updated);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'LESSON_UPDATED',
      module: 'LEARNING',
      entity: 'Lesson',
      entityId: id,
      oldValue: this._snapshot(lesson),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteLesson(id: string, managerId: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new Error('Lesson not found');
    await prisma.lesson.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'LESSON_DELETED',
      module: 'LEARNING',
      entity: 'Lesson',
      entityId: id,
      oldValue: this._snapshot(lesson),
    });
  }

  // ── Learning: Resources ────────────────────────────────────────────────────

  async createResource(
    data: {
      lessonId: string;
      type: string;
      title: string;
      url: string;
      duration?: number;
      author?: string;
    },
    managerId: string,
  ) {
    const resource = await prisma.learningResource.create({
      data: data as Parameters<typeof prisma.learningResource.create>[0]['data'],
    });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'RESOURCE_CREATED',
      module: 'LEARNING',
      entity: 'LearningResource',
      entityId: resource.id,
      newValue: this._snapshot(resource),
    });
    return resource;
  }

  async updateResource(id: string, data: Record<string, unknown>, managerId: string) {
    const resource = await prisma.learningResource.findUnique({ where: { id } });
    if (!resource) throw new Error('Resource not found');
    const updated = await prisma.learningResource.update({ where: { id }, data });
    await this._recordVersion('LearningResource', id, managerId, resource, updated);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'RESOURCE_UPDATED',
      module: 'LEARNING',
      entity: 'LearningResource',
      entityId: id,
      oldValue: this._snapshot(resource),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteResource(id: string, managerId: string) {
    const resource = await prisma.learningResource.findUnique({ where: { id } });
    if (!resource) throw new Error('Resource not found');
    await prisma.learningResource.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'RESOURCE_DELETED',
      module: 'LEARNING',
      entity: 'LearningResource',
      entityId: id,
      oldValue: this._snapshot(resource),
    });
  }

  // ── Coding: Problems ───────────────────────────────────────────────────────

  async createProblem(data: Record<string, unknown>, managerId: string) {
    const problem = await prisma.codingProblem.create({
      data: data as Parameters<typeof prisma.codingProblem.create>[0]['data'],
    });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CODING_PROBLEM_CREATED',
      module: 'CODING',
      entity: 'CodingProblem',
      entityId: problem.id,
      newValue: this._snapshot(problem),
    });
    return problem;
  }

  async updateProblem(id: string, data: Record<string, unknown>, managerId: string) {
    const problem = await prisma.codingProblem.findUnique({ where: { id } });
    if (!problem) throw new Error('Problem not found');
    const updated = await prisma.codingProblem.update({ where: { id }, data });
    await this._recordVersion('CodingProblem', id, managerId, problem, updated);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CODING_PROBLEM_UPDATED',
      module: 'CODING',
      entity: 'CodingProblem',
      entityId: id,
      oldValue: this._snapshot(problem),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteProblem(id: string, managerId: string) {
    const problem = await prisma.codingProblem.findUnique({ where: { id } });
    if (!problem) throw new Error('Problem not found');
    await prisma.codingProblem.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'CODING_PROBLEM_DELETED',
      module: 'CODING',
      entity: 'CodingProblem',
      entityId: id,
      oldValue: this._snapshot(problem),
    });
  }

  async publishProblem(id: string, managerId: string) {
    const problem = await prisma.codingProblem.findUnique({ where: { id } });
    if (!problem) throw new Error('Problem not found');
    const updated = await prisma.codingProblem.update({
      where: { id },
      data: { isPublished: true },
    });
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
    const updated = await prisma.codingProblem.update({
      where: { id },
      data: { isPublished: false },
    });
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
    const project = await prisma.project.create({
      data: data as Parameters<typeof prisma.project.create>[0]['data'],
    });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'PROJECT_CREATED',
      module: 'PROJECTS',
      entity: 'Project',
      entityId: project.id,
      newValue: this._snapshot(project),
    });
    return project;
  }

  async updateProject(id: string, data: Record<string, unknown>, managerId: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new Error('Project not found');
    const updated = await prisma.project.update({ where: { id }, data });
    await this._recordVersion('Project', id, managerId, project, updated);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'PROJECT_UPDATED',
      module: 'PROJECTS',
      entity: 'Project',
      entityId: id,
      oldValue: this._snapshot(project),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteProject(id: string, managerId: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new Error('Project not found');
    await prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'PROJECT_DELETED',
      module: 'PROJECTS',
      entity: 'Project',
      entityId: id,
      oldValue: this._snapshot(project),
    });
  }

  // ── Placements ─────────────────────────────────────────────────────────────

  async createCompany(
    data: { name: string; slug: string; description?: string; industry?: string },
    managerId: string,
  ) {
    const company = await prisma.company.create({ data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'COMPANY_ADDED',
      module: 'PLACEMENTS',
      entity: 'Company',
      entityId: company.id,
      newValue: this._snapshot(company),
    });
    return company;
  }

  async updateCompany(id: string, data: Record<string, unknown>, managerId: string) {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) throw new Error('Company not found');
    const updated = await prisma.company.update({ where: { id }, data });
    await this._recordVersion('Company', id, managerId, company, updated);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'COMPANY_UPDATED',
      module: 'PLACEMENTS',
      entity: 'Company',
      entityId: id,
      oldValue: this._snapshot(company),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteCompany(id: string, managerId: string) {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) throw new Error('Company not found');
    await prisma.company.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'COMPANY_DELETED',
      module: 'PLACEMENTS',
      entity: 'Company',
      entityId: id,
      oldValue: this._snapshot(company),
    });
  }

  async createJob(data: Record<string, unknown>, managerId: string) {
    const job = await prisma.jobPosting.create({
      data: data as Parameters<typeof prisma.jobPosting.create>[0]['data'],
    });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'JOB_POSTED',
      module: 'PLACEMENTS',
      entity: 'JobPosting',
      entityId: job.id,
      newValue: this._snapshot(job),
    });
    return job;
  }

  async updateJob(id: string, data: Record<string, unknown>, managerId: string) {
    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) throw new Error('Job not found');
    const updated = await prisma.jobPosting.update({ where: { id }, data });
    await this._recordVersion('JobPosting', id, managerId, job, updated);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'JOB_UPDATED',
      module: 'PLACEMENTS',
      entity: 'JobPosting',
      entityId: id,
      oldValue: this._snapshot(job),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteJob(id: string, managerId: string) {
    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) throw new Error('Job not found');
    await prisma.jobPosting.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'JOB_DELETED',
      module: 'PLACEMENTS',
      entity: 'JobPosting',
      entityId: id,
      oldValue: this._snapshot(job),
    });
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  async createEvent(data: Record<string, unknown>, managerId: string) {
    const event = await prisma.event.create({
      data: data as Parameters<typeof prisma.event.create>[0]['data'],
    });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'EVENT_CREATED',
      module: 'EVENTS',
      entity: 'Event',
      entityId: event.id,
      newValue: this._snapshot(event),
    });
    return event;
  }

  async updateEvent(id: string, data: Record<string, unknown>, managerId: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found');
    const updated = await prisma.event.update({ where: { id }, data });
    await this._recordVersion('Event', id, managerId, event, updated);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'EVENT_UPDATED',
      module: 'EVENTS',
      entity: 'Event',
      entityId: id,
      oldValue: this._snapshot(event),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteEvent(id: string, managerId: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error('Event not found');
    await prisma.event.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'EVENT_DELETED',
      module: 'EVENTS',
      entity: 'Event',
      entityId: id,
      oldValue: this._snapshot(event),
    });
  }

  async getEventRegistrations(eventId: string) {
    return prisma.eventRegistration.findMany({
      where: { eventId },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  async createNotification(
    data: { userId: string; title: string; message: string; type: string },
    managerId: string,
  ) {
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
      newValue: this._snapshot(notification),
    });
    return notification;
  }

  async broadcastNotification(
    data: { title: string; message: string; type: string },
    targetRole: string | undefined,
    managerId: string,
  ) {
    const result = await prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({
        where: targetRole ? { role: targetRole.toUpperCase() as Role } : {},
        select: { id: true },
      });

      const notifications = await tx.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          title: data.title,
          message: data.message,
          type: (data.type ?? 'SYSTEM') as Parameters<
            typeof tx.notification.create
          >[0]['data']['type'],
        })),
      });

      await tx.auditLog.create({
        data: {
          performedBy: managerId,
          role: Role.MANAGER,
          action: 'NOTIFICATION_SENT',
          module: 'NOTIFICATIONS',
          newValue: { ...data, recipientCount: users.length } as Prisma.InputJsonValue,
        },
      });

      return { sent: notifications.count, recipientCount: users.length };
    });

    return { sent: result.sent };
  }

  async updateNotification(id: string, data: Record<string, unknown>, managerId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new Error('Notification not found');
    const updated = await prisma.notification.update({ where: { id }, data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'NOTIFICATION_UPDATED',
      module: 'NOTIFICATIONS',
      entity: 'Notification',
      entityId: id,
      oldValue: this._snapshot(notification),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteNotification(id: string, managerId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new Error('Notification not found');
    await prisma.notification.delete({ where: { id } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'NOTIFICATION_DELETED',
      module: 'NOTIFICATIONS',
      entity: 'Notification',
      entityId: id,
      oldValue: this._snapshot(notification),
    });
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
      learning: {
        totalRoadmaps,
        publishedRoadmaps,
        draftRoadmaps: totalRoadmaps - publishedRoadmaps,
      },
      coding: {
        totalProblems,
        publishedProblems,
        draftProblems: totalProblems - publishedProblems,
      },
      projects: { totalProjects },
      placements: { totalJobs },
      events: { totalEvents },
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Bulk Actions ───────────────────────────────────────────────────────────

  async bulkPublish(entity: string, ids: string[], managerId: string) {
    const count = await prisma.$transaction(async (tx) => {
      const model = this._getTxModel(tx, entity);
      const result = await model.updateMany({
        where: { id: { in: ids } },
        data: { isPublished: true },
      });
      await tx.auditLog.create({
        data: {
          performedBy: managerId,
          role: Role.MANAGER,
          action: 'BULK_PUBLISHED',
          entity,
          newValue: { ids } as Prisma.InputJsonValue,
        },
      });
      return (result as { count: number }).count;
    });
    return { updated: count };
  }

  async bulkArchive(entity: string, ids: string[], managerId: string) {
    const count = await prisma.$transaction(async (tx) => {
      const model = this._getTxModel(tx, entity);
      const result = await model.updateMany({
        where: { id: { in: ids } },
        data: { isPublished: false },
      });
      await tx.auditLog.create({
        data: {
          performedBy: managerId,
          role: Role.MANAGER,
          action: 'BULK_ARCHIVED',
          entity,
          newValue: { ids } as Prisma.InputJsonValue,
        },
      });
      return (result as { count: number }).count;
    });
    return { updated: count };
  }

  async bulkDelete(entity: string, ids: string[], managerId: string) {
    const count = await prisma.$transaction(async (tx) => {
      const model = this._getTxModel(tx, entity);
      const result = await model.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          performedBy: managerId,
          role: Role.MANAGER,
          action: 'BULK_DELETED',
          entity,
          newValue: { ids } as Prisma.InputJsonValue,
        },
      });
      return (result as { count: number }).count;
    });
    return { deleted: count };
  }

  /**
   * List soft-deleted rows (the trash) for an entity so managers can review and
   * restore them. Explicitly sets `deletedAt` in the where to bypass the global
   * soft-delete read filter.
   */
  async getDeletedContent(entity: string) {
    const model = this._getModel(entity);
    const data = await model.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
    return { entity, data, total: (data as unknown[]).length };
  }

  private _getModel(entity: string) {
    return this._getTxModel(prisma, entity);
  }

  private _getTxModel(
    tx: Prisma.TransactionClient | typeof prisma,
    entity: string,
  ): {
    updateMany: (args: unknown) => Promise<unknown>;
    deleteMany: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown>;
  } {
    const map: Record<string, unknown> = {
      categories: tx.category,
      roadmaps: tx.roadmap,
      sections: tx.roadmapSection,
      lessons: tx.lesson,
      resources: tx.learningResource,
      'problem-categories': tx.problemCategory,
      problems: tx.codingProblem,
      'project-categories': tx.projectCategory,
      projects: tx.project,
      companies: tx.company,
      jobs: tx.jobPosting,
      events: tx.event,
      banners: tx.banner,
      faqs: tx.faq,
      testimonials: tx.testimonial,
      media: tx.mediaFile,
    };
    const model = map[entity];
    if (!model) throw new Error(`Unknown entity: ${entity}`);
    return model as {
      updateMany: (args: unknown) => Promise<unknown>;
      deleteMany: (args: unknown) => Promise<unknown>;
      findMany: (args: unknown) => Promise<unknown>;
    };
  }
}

export const managerService = new ManagerService();
