/**
 * ProgressService — Legacy Roadmap/Lesson Progress
 *
 * The old roadmap/lesson system (roadmaps, roadmap_sections, lessons,
 * lesson_progress, bookmarks, recently_viewed tables) still physically exists
 * in the production database. These tables were created by migration
 * 20260715123406_learning_ecosystem and have never been dropped.
 *
 * However, Prisma Client no longer has typed models for them — they were
 * removed from schema.prisma when the new Learning CMS was introduced.
 *
 * All access in this service uses prisma.$queryRaw / prisma.$executeRaw
 * so there are zero Prisma model references and the TypeScript compiler
 * sees no errors.
 */

import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';

export interface RoadmapProgress {
  roadmapId: string;
  roadmapSlug: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  lastActivityAt: Date | null;
}

export interface ProgressFilterOptions {
  roadmapId?: string;
  moduleId?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ── Raw-query types (match actual DB column names) ────────────────────────────

interface RawRoadmap {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  difficulty: string;
  'estimatedHours': number | null;
  prerequisites: string | null;
  'isPublished': boolean;
  'displayOrder': number;
  tags: string | null;
  banner: string | null;
  visibility: string | null;
  'seoTitle': string | null;
  'seoDescription': string | null;
  'learningOutcomes': string | null;
  'createdAt': Date;
  'updatedAt': Date;
  'deletedAt': Date | null;
  'categoryId': string;
  // joined
  category_id: string | null;
  category_title: string | null;
  category_slug: string | null;
  sections_count: bigint;
}

interface RawSection {
  id: string;
  title: string;
  description: string | null;
  order: number;
  'roadmapId': string;
}

interface RawLesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  'contentType': string;
  'estimatedMinutes': number | null;
  order: number;
  'isPublished': boolean;
  'sectionId': string;
}

interface RawProgress {
  'lessonId': string;
  completed: boolean;
  percentage: number | null;
  'lastOpened': Date | null;
  'completedAt': Date | null;
  'updatedAt': Date;
  'timeSpent': number;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class ProgressService {
  // ── Internal: resolve roadmap by slug or UUID ───────────────────────────────

  private async resolveRoadmap(
    slugOrId: string,
    isAdmin = false,
    includeExtras = false,
  ): Promise<RawRoadmap> {
    const isUuid = UUID_REGEX.test(slugOrId);

    let rows: RawRoadmap[];

    if (includeExtras) {
      rows = await prisma.$queryRaw<RawRoadmap[]>`
        SELECT r.*,
               c.id    AS category_id,
               c.title AS category_title,
               c.slug  AS category_slug,
               (SELECT COUNT(*) FROM "roadmap_sections" rs
                WHERE rs."roadmapId" = r.id AND rs."deletedAt" IS NULL) AS sections_count
        FROM "roadmaps" r
        LEFT JOIN "categories" c ON c.id = r."categoryId"
        WHERE r."deletedAt" IS NULL
          AND ${isUuid ? prisma.$queryRaw`r.id = ${slugOrId}` : prisma.$queryRaw`r.slug = ${slugOrId}`}
        LIMIT 1
      `;
    } else {
      rows = await prisma.$queryRaw<RawRoadmap[]>`
        SELECT r.*, NULL AS category_id, NULL AS category_title, NULL AS category_slug, 0::bigint AS sections_count
        FROM "roadmaps" r
        WHERE r."deletedAt" IS NULL
          AND ${isUuid ? prisma.$queryRaw`r.id = ${slugOrId}` : prisma.$queryRaw`r.slug = ${slugOrId}`}
        LIMIT 1
      `;
    }

    if (rows.length === 0) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.ROADMAP_NOT_FOUND);
    }
    const roadmap = rows[0];
    if (!isAdmin && !roadmap.isPublished) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.ROADMAP_NOT_FOUND);
    }
    return roadmap;
  }

  // ── getRoadmapBySlug ────────────────────────────────────────────────────────

  async getRoadmapBySlug(slug: string, isAdmin = false, userId?: string) {
    const roadmap = await this.resolveRoadmap(slug, isAdmin, true);

    const publishedFilter = isAdmin ? prisma.$queryRaw`1=1` : prisma.$queryRaw`l."isPublished" = true`;

    const [lessonsCountRows, sections] = await Promise.all([
      prisma.$queryRaw<{ cnt: bigint }[]>`
        SELECT COUNT(l.id) AS cnt
        FROM "lessons" l
        JOIN "roadmap_sections" rs ON rs.id = l."sectionId"
        WHERE rs."roadmapId" = ${roadmap.id}
          AND rs."deletedAt" IS NULL
          AND l."deletedAt"  IS NULL
          AND ${publishedFilter}
      `,
      prisma.$queryRaw<RawSection[]>`
        SELECT * FROM "roadmap_sections"
        WHERE "roadmapId" = ${roadmap.id} AND "deletedAt" IS NULL
        ORDER BY "order" ASC
      `,
    ]);

    const lessonsCount = Number(lessonsCountRows[0]?.cnt ?? 0);

    // Fetch lessons for each section
    const sectionIds = sections.map((s) => s.id);
    const allLessons: (RawLesson & { sectionId: string })[] = sectionIds.length > 0
      ? await prisma.$queryRaw<(RawLesson & { sectionId: string })[]>`
          SELECT l.id, l.title, l.slug, l.description, l."contentType", l."estimatedMinutes",
                 l."order", l."isPublished", l."sectionId"
          FROM "lessons" l
          WHERE l."sectionId" = ANY(${sectionIds})
            AND l."deletedAt" IS NULL
            ${isAdmin ? prisma.$queryRaw`` : prisma.$queryRaw`AND l."isPublished" = true`}
          ORDER BY l."order" ASC
        `
      : [];

    // Fetch user progress
    const progressMap: Record<string, 'not_started' | 'in_progress' | 'completed'> = {};
    let completedCount = 0;

    if (userId && allLessons.length > 0) {
      const lessonIds = allLessons.map((l) => l.id);
      const progressRows = await prisma.$queryRaw<RawProgress[]>`
        SELECT "lessonId", completed, percentage, "lastOpened"
        FROM "lesson_progress"
        WHERE "userId" = ${userId}
          AND "lessonId" = ANY(${lessonIds})
      `;
      for (const p of progressRows) {
        if (p.completed) {
          progressMap[p.lessonId] = 'completed';
          completedCount++;
        } else if (p.lastOpened || (Number(p.percentage) ?? 0) > 0) {
          progressMap[p.lessonId] = 'in_progress';
        } else {
          progressMap[p.lessonId] = 'not_started';
        }
      }
    }

    // Group lessons by section and enrich with status
    const lessonsBySection = new Map<string, typeof allLessons>();
    for (const l of allLessons) {
      if (!lessonsBySection.has(l.sectionId)) lessonsBySection.set(l.sectionId, []);
      lessonsBySection.get(l.sectionId)!.push(l);
    }

    const enrichedSections = sections.map((sec) => ({
      ...sec,
      lessons: (lessonsBySection.get(sec.id) ?? []).map((l) => ({
        ...l,
        status: progressMap[l.id] ?? 'not_started',
      })),
    }));

    const totalLessons = enrichedSections.reduce((sum, s) => sum + s.lessons.length, 0);
    const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    const rawTags = roadmap.tags;
    const normalizedTags: string[] = Array.isArray(rawTags)
      ? rawTags
      : typeof rawTags === 'string' && rawTags.trim()
        ? rawTags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];

    return {
      ...roadmap,
      tags: normalizedTags,
      difficulty:
        typeof roadmap.difficulty === 'string'
          ? roadmap.difficulty.toLowerCase()
          : roadmap.difficulty,
      category: roadmap.category_id
        ? {
            id: roadmap.category_id,
            name: roadmap.category_title ?? 'Programming',
            slug: roadmap.category_slug ?? 'programming',
            color: '#3b82f6',
            roadmapCount: 0,
          }
        : { id: '', name: 'Programming', slug: 'programming', color: '#3b82f6', roadmapCount: 0 },
      lessonsCount,
      lessonCount: lessonsCount,
      sectionsCount: Number(roadmap.sections_count ?? 0),
      sections: enrichedSections,
      progress: progressPct,
      completedLessons: completedCount,
    };
  }

  // ── getRoadmapModulesWithLessons ────────────────────────────────────────────

  async getRoadmapModulesWithLessons(slug: string, isAdmin = false) {
    const roadmap = await this.resolveRoadmap(slug, isAdmin);

    const sections = await prisma.$queryRaw<RawSection[]>`
      SELECT * FROM "roadmap_sections"
      WHERE "roadmapId" = ${roadmap.id} AND "deletedAt" IS NULL
      ORDER BY "order" ASC
    `;

    const sectionIds = sections.map((s) => s.id);
    if (sectionIds.length === 0) return sections.map((s) => ({ ...s, lessons: [] }));

    const lessons = await prisma.$queryRaw<(RawLesson & { sectionId: string })[]>`
      SELECT l.id, l.title, l.slug, l.description, l."contentType", l."estimatedMinutes",
             l."order", l."isPublished", l."sectionId"
      FROM "lessons" l
      WHERE l."sectionId" = ANY(${sectionIds})
        AND l."deletedAt"  IS NULL
        ${isAdmin ? prisma.$queryRaw`` : prisma.$queryRaw`AND l."isPublished" = true`}
      ORDER BY l."order" ASC
    `;

    const lessonsBySection = new Map<string, typeof lessons>();
    for (const l of lessons) {
      if (!lessonsBySection.has(l.sectionId)) lessonsBySection.set(l.sectionId, []);
      lessonsBySection.get(l.sectionId)!.push(l);
    }

    return sections.map((s) => ({ ...s, lessons: lessonsBySection.get(s.id) ?? [] }));
  }

  // ── getRoadmapLessons ───────────────────────────────────────────────────────

  async getRoadmapLessons(slug: string, isAdmin = false) {
    const roadmap = await this.resolveRoadmap(slug, isAdmin);

    return prisma.$queryRaw<(RawLesson & { sectionId: string; sectionOrder: number; sectionTitle: string })[]>`
      SELECT l.id, l.title, l.slug, l.description, l."contentType", l."estimatedMinutes",
             l."order", l."isPublished", l."sectionId",
             rs."order" AS "sectionOrder", rs.title AS "sectionTitle"
      FROM "lessons" l
      JOIN "roadmap_sections" rs ON rs.id = l."sectionId"
      WHERE rs."roadmapId" = ${roadmap.id}
        AND l."deletedAt"  IS NULL
        AND rs."deletedAt" IS NULL
        ${isAdmin ? prisma.$queryRaw`` : prisma.$queryRaw`AND l."isPublished" = true`}
      ORDER BY rs."order" ASC, l."order" ASC
    `;
  }

  // ── calculateRoadmapProgress ────────────────────────────────────────────────

  async calculateRoadmapProgress(userId: string, roadmapId: string): Promise<RoadmapProgress> {
    const rows = await prisma.$queryRaw<{ id: string; slug: string; 'isPublished': boolean }[]>`
      SELECT id, slug, "isPublished" FROM "roadmaps"
      WHERE id = ${roadmapId} AND "deletedAt" IS NULL LIMIT 1
    `;
    if (rows.length === 0) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.ROADMAP_NOT_FOUND);
    }
    const roadmap = rows[0];

    const [totalRows, completedRows, lastActivityRows] = await Promise.all([
      prisma.$queryRaw<{ cnt: bigint }[]>`
        SELECT COUNT(l.id) AS cnt
        FROM "lessons" l
        JOIN "roadmap_sections" rs ON rs.id = l."sectionId"
        WHERE rs."roadmapId" = ${roadmapId}
          AND l."deletedAt"  IS NULL
          AND rs."deletedAt" IS NULL
          AND l."isPublished" = true
      `,
      prisma.$queryRaw<{ cnt: bigint }[]>`
        SELECT COUNT(lp.id) AS cnt
        FROM "lesson_progress" lp
        JOIN "lessons"          l  ON l.id  = lp."lessonId"  AND l."deletedAt"  IS NULL
        JOIN "roadmap_sections" rs ON rs.id = l."sectionId"  AND rs."deletedAt" IS NULL
        WHERE lp."userId"    = ${userId}
          AND rs."roadmapId" = ${roadmapId}
          AND lp.completed   = true
      `,
      prisma.$queryRaw<{ updated_at: Date }[]>`
        SELECT lp."updatedAt" AS updated_at
        FROM "lesson_progress" lp
        JOIN "lessons"          l  ON l.id  = lp."lessonId"  AND l."deletedAt"  IS NULL
        JOIN "roadmap_sections" rs ON rs.id = l."sectionId"  AND rs."deletedAt" IS NULL
        WHERE lp."userId"    = ${userId}
          AND rs."roadmapId" = ${roadmapId}
        ORDER BY lp."updatedAt" DESC
        LIMIT 1
      `,
    ]);

    const totalLessons = Number(totalRows[0]?.cnt ?? 0);
    const completedLessons = Number(completedRows[0]?.cnt ?? 0);
    const percentage =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return {
      roadmapId,
      roadmapSlug: roadmap.slug,
      totalLessons,
      completedLessons,
      percentage: Math.round(percentage * 100) / 100,
      lastActivityAt: lastActivityRows[0]?.updated_at ?? null,
    };
  }

  // ── getUserProgress ─────────────────────────────────────────────────────────

  async getUserProgress(userId: string, filters: ProgressFilterOptions = {}) {
    let entries: unknown[] = [];

    if (filters.moduleId) {
      entries = await prisma.$queryRaw`
        SELECT lp.*, l.id AS lesson_id, l.title AS lesson_title, l.slug AS lesson_slug,
               l."estimatedMinutes" AS lesson_estimated_minutes,
               rs.id AS section_id, rs.title AS section_title, rs."order" AS section_order,
               r.id AS roadmap_id, r.title AS roadmap_title, r.slug AS roadmap_slug
        FROM "lesson_progress" lp
        JOIN "lessons"          l  ON l.id  = lp."lessonId"  AND l."deletedAt"  IS NULL AND l."sectionId" = ${filters.moduleId}
        JOIN "roadmap_sections" rs ON rs.id = l."sectionId"  AND rs."deletedAt" IS NULL
        JOIN "roadmaps"         r  ON r.id  = rs."roadmapId" AND r."deletedAt"  IS NULL
        WHERE lp."userId" = ${userId}
        ORDER BY lp."updatedAt" DESC
      `;
    } else if (filters.roadmapId) {
      entries = await prisma.$queryRaw`
        SELECT lp.*, l.id AS lesson_id, l.title AS lesson_title, l.slug AS lesson_slug,
               l."estimatedMinutes" AS lesson_estimated_minutes,
               rs.id AS section_id, rs.title AS section_title, rs."order" AS section_order,
               r.id AS roadmap_id, r.title AS roadmap_title, r.slug AS roadmap_slug
        FROM "lesson_progress" lp
        JOIN "lessons"          l  ON l.id  = lp."lessonId"  AND l."deletedAt"  IS NULL
        JOIN "roadmap_sections" rs ON rs.id = l."sectionId"  AND rs."deletedAt" IS NULL
        JOIN "roadmaps"         r  ON r.id  = rs."roadmapId" AND r."deletedAt"  IS NULL AND r.id = ${filters.roadmapId}
        WHERE lp."userId" = ${userId}
        ORDER BY lp."updatedAt" DESC
      `;
    } else {
      entries = await prisma.$queryRaw`
        SELECT lp.*, l.id AS lesson_id, l.title AS lesson_title, l.slug AS lesson_slug,
               l."estimatedMinutes" AS lesson_estimated_minutes,
               rs.id AS section_id, rs.title AS section_title, rs."order" AS section_order,
               r.id AS roadmap_id, r.title AS roadmap_title, r.slug AS roadmap_slug
        FROM "lesson_progress" lp
        JOIN "lessons"          l  ON l.id  = lp."lessonId"  AND l."deletedAt"  IS NULL
        JOIN "roadmap_sections" rs ON rs.id = l."sectionId"  AND rs."deletedAt" IS NULL
        JOIN "roadmaps"         r  ON r.id  = rs."roadmapId" AND r."deletedAt"  IS NULL
        WHERE lp."userId" = ${userId}
        ORDER BY lp."updatedAt" DESC
      `;
    }

    // Compute roadmap progress for distinct roadmapIds found
    const distinctRoadmapIds = new Set<string>();
    for (const e of entries as { roadmap_id?: string }[]) {
      if (e.roadmap_id) distinctRoadmapIds.add(e.roadmap_id);
    }

    const roadmapProgress: RoadmapProgress[] = await Promise.all(
      Array.from(distinctRoadmapIds).map((rid) => this.calculateRoadmapProgress(userId, rid)),
    );

    return { entries, roadmapProgress };
  }

  // ── patchProgress ───────────────────────────────────────────────────────────

  async patchProgress(
    userId: string,
    body: { lessonId: string; lastOpened?: string | Date; watchPercentage?: number },
  ) {
    if (!body?.lessonId) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'lessonId is required');
    }

    const lessonRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "lessons" WHERE id = ${body.lessonId} AND "deletedAt" IS NULL LIMIT 1
    `;
    if (lessonRows.length === 0) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    const lastOpened = body.lastOpened
      ? typeof body.lastOpened === 'string'
        ? new Date(body.lastOpened)
        : body.lastOpened
      : new Date();

    const pct =
      typeof body.watchPercentage === 'number'
        ? Math.max(0, Math.min(100, body.watchPercentage))
        : null;

    const now = new Date();

    await prisma.$executeRaw`
      INSERT INTO "lesson_progress"
        ("id", "userId", "lessonId", "completed", "watchPercentage", "timeSpent",
         "lastOpened", "updatedAt", "createdAt")
      VALUES
        (gen_random_uuid()::text, ${userId}, ${body.lessonId}, false,
         ${pct ?? 0}, 0, ${lastOpened}, ${now}, ${now})
      ON CONFLICT ("userId", "lessonId") DO UPDATE
        SET "lastOpened"      = EXCLUDED."lastOpened",
            "watchPercentage" = COALESCE(EXCLUDED."watchPercentage", "lesson_progress"."watchPercentage"),
            "updatedAt"       = EXCLUDED."updatedAt"
    `;

    const updated = await prisma.$queryRaw<RawProgress[]>`
      SELECT * FROM "lesson_progress"
      WHERE "userId" = ${userId} AND "lessonId" = ${body.lessonId} LIMIT 1
    `;
    return updated[0] ?? null;
  }

  // ── addBookmarkByBody ───────────────────────────────────────────────────────

  async addBookmarkByBody(userId: string, lessonId: string) {
    if (!lessonId) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'lessonId is required');

    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO "bookmarks" ("id", "userId", "lessonId", "createdAt")
      VALUES (gen_random_uuid()::text, ${userId}, ${lessonId}, ${now})
      ON CONFLICT ("userId", "lessonId") DO NOTHING
    `;
  }

  // ── removeBookmarkByBody ────────────────────────────────────────────────────

  async removeBookmarkByBody(userId: string, lessonId: string) {
    if (!lessonId) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'lessonId is required');

    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "bookmarks" WHERE "userId" = ${userId} AND "lessonId" = ${lessonId} LIMIT 1
    `;
    if (rows.length === 0) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.BOOKMARK_NOT_FOUND);
    }
    await prisma.$executeRaw`
      DELETE FROM "bookmarks" WHERE "userId" = ${userId} AND "lessonId" = ${lessonId}
    `;
  }

  // ── getActivity ─────────────────────────────────────────────────────────────

  async getActivity(userId: string, limit = 25) {
    const [progressEntries, notifications] = await Promise.all([
      prisma.$queryRaw<{
        id: string;
        lessonId: string;
        completed: boolean;
        lastOpened: Date | null;
        completedAt: Date | null;
        updatedAt: Date;
        lessonTitle: string;
      }[]>`
        SELECT lp.id, lp."lessonId", lp.completed, lp."lastOpened",
               lp."completedAt", lp."updatedAt", l.title AS "lessonTitle"
        FROM "lesson_progress" lp
        JOIN "lessons" l ON l.id = lp."lessonId" AND l."deletedAt" IS NULL
        WHERE lp."userId" = ${userId}
        ORDER BY lp."updatedAt" DESC
        LIMIT ${limit}
      `,
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    type ActivityEntry = {
      id: string;
      type: 'LESSON_COMPLETED' | 'LESSON_VIEWED' | 'NOTIFICATION';
      message: string;
      timestamp: Date;
      relatedLessonId?: string;
    };

    const entries: ActivityEntry[] = [];

    for (const p of progressEntries) {
      if (p.completed) {
        entries.push({
          id: `prog-${p.id}`,
          type: 'LESSON_COMPLETED',
          message: `Completed lesson: ${p.lessonTitle ?? 'Unknown'}`,
          timestamp: p.completedAt ?? p.updatedAt,
          relatedLessonId: p.lessonId,
        });
      } else if (p.lastOpened) {
        entries.push({
          id: `prog-view-${p.id}`,
          type: 'LESSON_VIEWED',
          message: `Viewed lesson: ${p.lessonTitle ?? 'Unknown'}`,
          timestamp: p.lastOpened,
          relatedLessonId: p.lessonId,
        });
      }
    }

    for (const n of notifications) {
      entries.push({
        id: `notif-${n.id}`,
        type: 'NOTIFICATION',
        message: n.title,
        timestamp: n.createdAt,
      });
    }

    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return entries.slice(0, limit);
  }
}

export const progressService = new ProgressService();
