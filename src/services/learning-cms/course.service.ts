import { Course, CourseStatus, Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { HTTP_STATUS } from '../../constants';
import { buildPaginated } from '../../utils/response';
import { auditLogRepository } from '../../repositories/admin/audit-log.repository';
import { storageService } from './storage.service';

export interface GetCoursesQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: CourseStatus;
}

export interface CreateCourseInput {
  title: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  status?: CourseStatus;
  totalDays?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateCourseInput {
  title?: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  status?: CourseStatus;
  totalDays?: number;
  startDate?: Date;
  endDate?: Date;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  let existing = await prisma.course.findFirst({
    where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });
  while (existing) {
    slug = `${baseSlug}-${counter++}`;
    existing = await prisma.course.findFirst({
      where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
  }

  return slug;
}

export class CourseService {
  async getCourses(
    query: GetCoursesQuery,
    includeDrafts = false,
  ): Promise<{
    data: Course[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const where: Record<string, unknown> = {};

    if (query.search) {
      where['OR'] = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (includeDrafts) {
      if (query.status) where['status'] = query.status;
    } else {
      where['status'] = CourseStatus.PUBLISHED;
    }

    const [data, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
      }),
      prisma.course.count({ where }),
    ]);

    return buildPaginated(data, total, page, limit);
  }

  async getCourseById(id: string, includeDrafts = false): Promise<Course> {
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Course not found');
    }

    if (!includeDrafts && course.status !== CourseStatus.PUBLISHED) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Course not found');
    }

    return course;
  }

  async createCourse(data: CreateCourseInput, actorId: string): Promise<Course> {
    const slug = data.slug && data.slug.trim().length > 0
      ? await generateUniqueSlug(data.slug)
      : await generateUniqueSlug(data.title);

    return prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          title: data.title,
          slug,
          description: data.description ?? null,
          thumbnail: data.thumbnail ?? null,
          status: data.status ?? CourseStatus.DRAFT,
          totalDays: data.totalDays ?? 0,
          startDate: data.startDate ?? null,
          endDate: data.endDate ?? null,
          createdBy: actorId,
        },
      });

      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'COURSE_CREATED',
        module: 'LEARNING',
        entity: 'Course',
        entityId: course.id,
        newValue: course as unknown as object,
      });

      return course;
    });
  }

  async updateCourse(id: string, data: UpdateCourseInput, actorId: string): Promise<Course> {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Course not found');
    }

    let slug = existing.slug;
    if (data.slug && data.slug !== existing.slug) {
      slug = await generateUniqueSlug(data.slug, id);
    } else if (data.title && data.title !== existing.title && !data.slug) {
      slug = await generateUniqueSlug(data.title, id);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.course.update({
        where: { id },
        data: {
          title: data.title,
          slug,
          description: data.description,
          thumbnail: data.thumbnail,
          status: data.status,
          totalDays: data.totalDays,
          startDate: data.startDate,
          endDate: data.endDate,
        },
      });

      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'COURSE_UPDATED',
        module: 'LEARNING',
        entity: 'Course',
        entityId: id,
        oldValue: existing as unknown as object,
        newValue: updated as unknown as object,
      });

      return updated;
    });
  }

  async deleteCourse(id: string, actorId: string): Promise<void> {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Course not found');
    }

    await prisma.$transaction(async (tx) => {
      const noteImages = await tx.learningNoteImage.findMany({
        where: { learningContent: { courseId: id } },
        select: { storagePath: true },
      });

      for (const note of noteImages) {
        await storageService.deleteNoteImage(note.storagePath);
      }

      await tx.course.delete({ where: { id } });

      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'COURSE_DELETED',
        module: 'LEARNING',
        entity: 'Course',
        entityId: id,
        oldValue: existing as unknown as object,
      });
    });
  }

  async getCourseDashboardStats(): Promise<{
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    archivedCourses: number;
    totalContents: number;
    publishedContents: number;
  }> {
    const [
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,
      totalContents,
      publishedContents,
    ] = await Promise.all([
      prisma.course.count(),
      prisma.course.count({ where: { status: CourseStatus.PUBLISHED } }),
      prisma.course.count({ where: { status: CourseStatus.DRAFT } }),
      prisma.course.count({ where: { status: CourseStatus.ARCHIVED } }),
      prisma.learningContent.count(),
      prisma.learningContent.count({ where: { published: true } }),
    ]);

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,
      totalContents,
      publishedContents,
    };
  }
}

export const courseService = new CourseService();
