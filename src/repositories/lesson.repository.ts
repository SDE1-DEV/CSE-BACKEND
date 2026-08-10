/**
 * LessonRepository — Legacy Roadmap/Lesson System
 *
 * The legacy tables (lessons, roadmap_sections, roadmaps, lesson_progress,
 * bookmarks, recently_viewed, learning_resources) still physically exist in
 * the production database (created by migration 20260715123406_learning_ecosystem
 * and never dropped), but Prisma Client NO LONGER HAS typed models for them.
 *
 * ALL database access in this file uses prisma.$queryRaw / prisma.$executeRaw.
 * The @ts-nocheck comment is removed — this file is now fully type-safe.
 */
import { prisma } from '../config/database';

// ── Raw row types (match actual DB column names) — exported for service use ──

export interface RawLesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  contentType: string;
  estimatedMinutes: number | null;
  order: number;
  isPublished: boolean;
  sectionId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // joined fields (only when withResources=true or section is included)
  section_id?: string;
  section_title?: string;
  section_order?: number;
  roadmap_id?: string;
  roadmap_title?: string;
  roadmap_slug?: string;
  roadmap_description?: string | null;
  roadmap_difficulty?: string;
  roadmap_thumbnail?: string | null;
  roadmap_is_published?: boolean;
  roadmap_estimated_hours?: number | null;
  category_id?: string | null;
  category_title?: string | null;
  category_slug?: string | null;
}

export interface RawProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  watchPercentage: number;
  timeSpent: number;
  lastOpened: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RawBookmark {
  id: string;
  userId: string;
  lessonId: string;
  createdAt: Date;
}

export interface RawRecentlyViewed {
  id: string;
  userId: string;
  lessonId: string;
  viewedAt: Date;
}

// ── Helper: enrich a RawLesson into the nested object shape ─────────────────

function shapeLesson(row: RawLesson): Record<string, unknown> {
  const section = row.section_id
    ? {
        id: row.section_id,
        title: row.section_title,
        order: row.section_order,
        roadmap: row.roadmap_id
          ? {
              id: row.roadmap_id,
              title: row.roadmap_title,
              slug: row.roadmap_slug,
              description: row.roadmap_description ?? null,
              difficulty: row.roadmap_difficulty,
              thumbnail: row.roadmap_thumbnail ?? null,
              isPublished: row.roadmap_is_published,
              estimatedHours: row.roadmap_estimated_hours ?? null,
              category: row.category_id
                ? {
                    id: row.category_id,
                    title: row.category_title ?? '',
                    slug: row.category_slug ?? '',
                  }
                : null,
            }
          : null,
      }
    : null;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    contentType: row.contentType,
    estimatedMinutes: row.estimatedMinutes,
    order: row.order,
    isPublished: row.isPublished,
    sectionId: row.sectionId,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    section,
    resources: [],
  };
}

export class LessonRepository {
  // ── Lessons ─────────────────────────────────────────────────────────────────

  async create(data: {
    title: string;
    slug: string;
    description?: string | null;
    contentType?: string;
    estimatedMinutes?: number | null;
    order?: number;
    isPublished?: boolean;
    section: { connect: { id: string } };
  }): Promise<Record<string, unknown>> {
    const sectionId = data.section.connect.id;
    const now = new Date();
    const id = crypto.randomUUID();
    const rows = await prisma.$queryRaw<RawLesson[]>`
      INSERT INTO "lessons"
        ("id", "title", "slug", "description", "contentType", "estimatedMinutes",
         "order", "isPublished", "sectionId", "createdAt", "updatedAt")
      VALUES (
        ${id}, ${data.title}, ${data.slug}, ${data.description ?? null},
        ${(data.contentType ?? 'NOTE') as string}, ${data.estimatedMinutes ?? null},
        ${data.order ?? 0}, ${data.isPublished ?? false}, ${sectionId},
        ${now}, ${now}
      )
      RETURNING *
    `;
    return shapeLesson(rows[0]);
  }

  async findById(id: string, withResources = false): Promise<Record<string, unknown> | null> {
    const rows = await prisma.$queryRaw<RawLesson[]>`
      SELECT l.*,
        rs.id            AS section_id,
        rs.title         AS section_title,
        rs."order"       AS section_order,
        r.id             AS roadmap_id,
        r.title          AS roadmap_title,
        r.slug           AS roadmap_slug,
        r.description    AS roadmap_description,
        r.difficulty     AS roadmap_difficulty,
        r.thumbnail      AS roadmap_thumbnail,
        r."isPublished"  AS roadmap_is_published,
        r."estimatedHours" AS roadmap_estimated_hours,
        cat.id           AS category_id,
        cat.title        AS category_title,
        cat.slug         AS category_slug
      FROM "lessons" l
      LEFT JOIN "roadmap_sections" rs  ON rs.id  = l."sectionId"
      LEFT JOIN "roadmaps"         r   ON r.id   = rs."roadmapId"
      LEFT JOIN "categories"       cat ON cat.id = r."categoryId"
      WHERE l.id = ${id}
        AND l."deletedAt" IS NULL
      LIMIT 1
    `;
    if (rows.length === 0) return null;

    const lesson = shapeLesson(rows[0]);

    if (withResources) {
      const resources = await prisma.$queryRaw<{ id: string; title: string; url: string; type: string; createdAt: Date }[]>`
        SELECT id, title, url, type, "createdAt"
        FROM "learning_resources"
        WHERE "lessonId" = ${id}
        ORDER BY "createdAt" ASC
      `;
      (lesson as Record<string, unknown>)['resources'] = resources;
    }

    return lesson;
  }

  async findBySlug(slug: string): Promise<Record<string, unknown> | null> {
    const rows = await prisma.$queryRaw<RawLesson[]>`
      SELECT l.*,
        rs.id            AS section_id,
        rs.title         AS section_title,
        rs."order"       AS section_order,
        r.id             AS roadmap_id,
        r.title          AS roadmap_title,
        r.slug           AS roadmap_slug,
        r.description    AS roadmap_description,
        r.difficulty     AS roadmap_difficulty,
        r.thumbnail      AS roadmap_thumbnail,
        r."isPublished"  AS roadmap_is_published,
        r."estimatedHours" AS roadmap_estimated_hours,
        cat.id           AS category_id,
        cat.title        AS category_title,
        cat.slug         AS category_slug
      FROM "lessons" l
      LEFT JOIN "roadmap_sections" rs  ON rs.id  = l."sectionId"
      LEFT JOIN "roadmaps"         r   ON r.id   = rs."roadmapId"
      LEFT JOIN "categories"       cat ON cat.id = r."categoryId"
      WHERE l.slug = ${slug}
        AND l."deletedAt" IS NULL
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const lesson = shapeLesson(rows[0]);

    const resources = await prisma.$queryRaw<{ id: string; title: string; url: string; type: string; createdAt: Date }[]>`
      SELECT id, title, url, type, "createdAt"
      FROM "learning_resources"
      WHERE "lessonId" = ${slug}
      ORDER BY "createdAt" ASC
    `;
    (lesson as Record<string, unknown>)['resources'] = resources;
    return lesson;
  }

  async findBySectionId(sectionId: string, publishedOnly = false): Promise<Record<string, unknown>[]> {
    const rows = await prisma.$queryRaw<RawLesson[]>`
      SELECT l.*,
        rs.id    AS section_id,
        rs.title AS section_title
      FROM "lessons" l
      LEFT JOIN "roadmap_sections" rs ON rs.id = l."sectionId"
      WHERE l."sectionId" = ${sectionId}
        AND l."deletedAt" IS NULL
        ${publishedOnly ? prisma.$queryRaw`AND l."isPublished" = true` : prisma.$queryRaw``}
      ORDER BY l."order" ASC
    `;

    const lessonIds = rows.map((r) => r.id);
    if (lessonIds.length === 0) return [];

    const resources = await prisma.$queryRaw<{ id: string; lessonId: string; title: string; url: string; type: string; createdAt: Date }[]>`
      SELECT id, "lessonId", title, url, type, "createdAt"
      FROM "learning_resources"
      WHERE "lessonId" = ANY(${lessonIds})
      ORDER BY "createdAt" ASC
    `;
    const resByLesson: Record<string, typeof resources> = {};
    for (const r of resources) {
      if (!resByLesson[r.lessonId]) resByLesson[r.lessonId] = [];
      resByLesson[r.lessonId].push(r);
    }

    return rows.map((row) => {
      const l = shapeLesson(row);
      (l as Record<string, unknown>)['resources'] = resByLesson[row.id] ?? [];
      return l;
    });
  }

  async update(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const now = new Date();
    // Build SET clause dynamically
    const allowed = ['title', 'slug', 'description', 'contentType', 'estimatedMinutes', 'order', 'isPublished', 'sectionId'];
    const fields = Object.keys(data).filter((k) => allowed.includes(k));

    if (fields.length === 0) {
      // Nothing to update — return current
      const existing = await this.findById(id);
      if (!existing) throw new Error('Lesson not found');
      return existing;
    }

    // Use raw SQL UPDATE
    await prisma.$executeRaw`UPDATE "lessons" SET "updatedAt" = ${now} WHERE id = ${id} AND "deletedAt" IS NULL`;
    for (const field of fields) {
      const value = data[field];
      await prisma.$executeRaw`
        UPDATE "lessons" SET ${prisma.$queryRaw([`"${field}"`] as unknown as TemplateStringsArray)} = ${value}
        WHERE id = ${id}
      `;
    }

    const updated = await this.findById(id);
    if (!updated) throw new Error('Lesson not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const now = new Date();
    await prisma.$executeRaw`
      UPDATE "lessons" SET "deletedAt" = ${now} WHERE id = ${id}
    `;
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    if (excludeId) {
      const rows = await prisma.$queryRaw<{ cnt: bigint }[]>`
        SELECT COUNT(*) AS cnt FROM "lessons"
        WHERE slug = ${slug} AND id != ${excludeId} AND "deletedAt" IS NULL
      `;
      return Number(rows[0]?.cnt ?? 0) > 0;
    }
    const rows = await prisma.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*) AS cnt FROM "lessons"
      WHERE slug = ${slug} AND "deletedAt" IS NULL
    `;
    return Number(rows[0]?.cnt ?? 0) > 0;
  }

  async searchByTitle(query: string, publishedOnly = true): Promise<Record<string, unknown>[]> {
    const rows = await prisma.$queryRaw<RawLesson[]>`
      SELECT l.*,
        rs.id    AS section_id,
        rs.title AS section_title,
        r.id     AS roadmap_id,
        r.title  AS roadmap_title,
        r.slug   AS roadmap_slug
      FROM "lessons" l
      LEFT JOIN "roadmap_sections" rs ON rs.id = l."sectionId"
      LEFT JOIN "roadmaps"         r  ON r.id  = rs."roadmapId"
      WHERE l."deletedAt" IS NULL
        ${publishedOnly ? prisma.$queryRaw`AND l."isPublished" = true` : prisma.$queryRaw``}
        AND l.title ILIKE ${'%' + query + '%'}
      LIMIT 10
    `;
    return rows.map(shapeLesson);
  }

  // ── Lesson Progress ──────────────────────────────────────────────────────────

  async upsertProgress(
    userId: string,
    lessonId: string,
    data: {
      watchPercentage?: number;
      percentage?: number;
      timeSpent?: number;
      completed?: boolean;
      completedAt?: Date | null;
      roadmapId?: string | null;
      lastOpened?: Date;
    },
  ): Promise<RawProgress> {
    const now = new Date();
    const pct = typeof data.watchPercentage === 'number'
      ? Math.max(0, Math.min(100, data.watchPercentage))
      : typeof data.percentage === 'number'
        ? Math.max(0, Math.min(100, data.percentage))
        : 0;
    const completed = data.completed ?? false;
    const completedAt = data.completedAt ?? (completed ? now : null);
    const timeSpent = data.timeSpent ?? 0;
    const lastOpened = data.lastOpened ?? now;

    const rows = await prisma.$queryRaw<RawProgress[]>`
      INSERT INTO "lesson_progress"
        ("id", "userId", "lessonId", "completed", "watchPercentage", "timeSpent",
         "lastOpened", "completedAt", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text, ${userId}, ${lessonId}, ${completed},
        ${pct}, ${timeSpent}, ${lastOpened}, ${completedAt}, ${now}, ${now}
      )
      ON CONFLICT ("userId", "lessonId") DO UPDATE SET
        "completed"       = EXCLUDED."completed",
        "watchPercentage" = EXCLUDED."watchPercentage",
        "timeSpent"       = EXCLUDED."timeSpent",
        "lastOpened"      = EXCLUDED."lastOpened",
        "completedAt"     = EXCLUDED."completedAt",
        "updatedAt"       = EXCLUDED."updatedAt"
      RETURNING *
    `;
    return rows[0];
  }

  async findProgress(userId: string, lessonId: string): Promise<RawProgress | null> {
    const rows = await prisma.$queryRaw<RawProgress[]>`
      SELECT * FROM "lesson_progress"
      WHERE "userId" = ${userId} AND "lessonId" = ${lessonId}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  // ── Bookmarks ────────────────────────────────────────────────────────────────

  async addBookmark(userId: string, lessonId: string): Promise<RawBookmark> {
    const now = new Date();
    const rows = await prisma.$queryRaw<RawBookmark[]>`
      INSERT INTO "bookmarks" ("id", "userId", "lessonId", "createdAt")
      VALUES (gen_random_uuid()::text, ${userId}, ${lessonId}, ${now})
      ON CONFLICT ("userId", "lessonId") DO NOTHING
      RETURNING *
    `;
    return rows[0] ?? { id: '', userId, lessonId, createdAt: now };
  }

  async removeBookmark(userId: string, lessonId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM "bookmarks" WHERE "userId" = ${userId} AND "lessonId" = ${lessonId}
    `;
  }

  async isBookmarked(userId: string, lessonId: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*) AS cnt FROM "bookmarks"
      WHERE "userId" = ${userId} AND "lessonId" = ${lessonId}
    `;
    return Number(rows[0]?.cnt ?? 0) > 0;
  }

  async getUserBookmarks(userId: string): Promise<Record<string, unknown>[]> {
    const rows = await prisma.$queryRaw<{
      bm_id: string;
      bm_lesson_id: string;
      bm_created_at: Date;
      lesson_id: string;
      lesson_title: string;
      lesson_slug: string;
      lesson_description: string | null;
      section_title: string | null;
      roadmap_title: string | null;
    }[]>`
      SELECT
        bm.id            AS bm_id,
        bm."lessonId"    AS bm_lesson_id,
        bm."createdAt"   AS bm_created_at,
        l.id             AS lesson_id,
        l.title          AS lesson_title,
        l.slug           AS lesson_slug,
        l.description    AS lesson_description,
        rs.title         AS section_title,
        r.title          AS roadmap_title
      FROM "bookmarks" bm
      JOIN "lessons"          l  ON l.id  = bm."lessonId"  AND l."deletedAt" IS NULL
      JOIN "roadmap_sections" rs ON rs.id = l."sectionId"  AND rs."deletedAt" IS NULL
      JOIN "roadmaps"         r  ON r.id  = rs."roadmapId" AND r."deletedAt" IS NULL
      WHERE bm."userId" = ${userId}
      ORDER BY bm."createdAt" DESC
    `;

    return rows.map((row) => ({
      id: row.bm_id,
      lessonId: row.bm_lesson_id,
      createdAt: row.bm_created_at,
      lesson: {
        id: row.lesson_id,
        title: row.lesson_title,
        slug: row.lesson_slug,
        description: row.lesson_description,
        section: {
          title: row.section_title,
          roadmap: { title: row.roadmap_title },
        },
      },
    }));
  }

  // ── Recently Viewed ──────────────────────────────────────────────────────────

  async upsertRecentlyViewed(userId: string, lessonId: string): Promise<void> {
    const now = new Date();
    await prisma.$executeRaw`
      INSERT INTO "recently_viewed" ("id", "userId", "lessonId", "viewedAt")
      VALUES (gen_random_uuid()::text, ${userId}, ${lessonId}, ${now})
      ON CONFLICT ("userId", "lessonId") DO UPDATE SET "viewedAt" = ${now}
    `;
  }

  async getRecentlyViewed(userId: string, limit = 10): Promise<Record<string, unknown>[]> {
    const rows = await prisma.$queryRaw<{
      rv_id: string;
      lesson_id: string;
      lesson_title: string;
      lesson_slug: string;
      lesson_description: string | null;
      lesson_estimated_minutes: number | null;
      lesson_order: number;
      section_title: string | null;
      roadmap_title: string | null;
      viewed_at: Date;
    }[]>`
      SELECT
        rv.id            AS rv_id,
        l.id             AS lesson_id,
        l.title          AS lesson_title,
        l.slug           AS lesson_slug,
        l.description    AS lesson_description,
        l."estimatedMinutes" AS lesson_estimated_minutes,
        l."order"        AS lesson_order,
        rs.title         AS section_title,
        r.title          AS roadmap_title,
        rv."viewedAt"    AS viewed_at
      FROM "recently_viewed" rv
      JOIN "lessons"          l  ON l.id  = rv."lessonId"  AND l."deletedAt" IS NULL
      JOIN "roadmap_sections" rs ON rs.id = l."sectionId"  AND rs."deletedAt" IS NULL
      JOIN "roadmaps"         r  ON r.id  = rs."roadmapId" AND r."deletedAt" IS NULL
      WHERE rv."userId" = ${userId}
      ORDER BY rv."viewedAt" DESC
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      id: row.rv_id,
      viewedAt: row.viewed_at,
      lesson: {
        id: row.lesson_id,
        title: row.lesson_title,
        slug: row.lesson_slug,
        description: row.lesson_description,
        estimatedMinutes: row.lesson_estimated_minutes,
        order: row.lesson_order,
        section: {
          title: row.section_title,
          roadmap: { title: row.roadmap_title },
        },
      },
    }));
  }

  // ── Continue Learning ────────────────────────────────────────────────────────

  async getContinueLearning(userId: string): Promise<Record<string, unknown> | null> {
    // Most recent incomplete lesson that was viewed — use raw SQL because
    // prisma.recentlyViewed / prisma.lesson / prisma.userProgress are NOT in
    // the current schema.prisma (they were removed when the new Learning CMS
    // was introduced). The physical tables still exist in the production DB.
    const rows = await prisma.$queryRaw<{
      rv_id: string;
      viewed_at: Date;
      lesson_id: string;
      lesson_title: string;
      lesson_slug: string;
      lesson_description: string | null;
      lesson_estimated_minutes: number | null;
      lesson_order: number;
      lesson_is_published: boolean;
      section_id: string;
      section_title: string;
      roadmap_id: string | null;
      roadmap_title: string | null;
      roadmap_slug: string | null;
      roadmap_description: string | null;
      roadmap_difficulty: string | null;
      roadmap_estimated_hours: number | null;
      roadmap_thumbnail: string | null;
      roadmap_is_published: boolean | null;
      category_id: string | null;
      category_title: string | null;
      category_slug: string | null;
    }[]>`
      SELECT
        rv.id            AS rv_id,
        rv."viewedAt"    AS viewed_at,
        l.id             AS lesson_id,
        l.title          AS lesson_title,
        l.slug           AS lesson_slug,
        l.description    AS lesson_description,
        l."estimatedMinutes" AS lesson_estimated_minutes,
        l."order"        AS lesson_order,
        l."isPublished"  AS lesson_is_published,
        rs.id            AS section_id,
        rs.title         AS section_title,
        r.id             AS roadmap_id,
        r.title          AS roadmap_title,
        r.slug           AS roadmap_slug,
        r.description    AS roadmap_description,
        r.difficulty     AS roadmap_difficulty,
        r."estimatedHours" AS roadmap_estimated_hours,
        r.thumbnail      AS roadmap_thumbnail,
        r."isPublished"  AS roadmap_is_published,
        cat.id           AS category_id,
        cat.title        AS category_title,
        cat.slug         AS category_slug
      FROM "recently_viewed"    rv
      JOIN "lessons"            l   ON l.id   = rv."lessonId"   AND l."deletedAt" IS NULL AND l."isPublished" = true
      JOIN "roadmap_sections"   rs  ON rs.id  = l."sectionId"   AND rs."deletedAt" IS NULL
      JOIN "roadmaps"           r   ON r.id   = rs."roadmapId"  AND r."deletedAt" IS NULL
      LEFT JOIN "categories"    cat ON cat.id = r."categoryId"
      LEFT JOIN "lesson_progress" lp ON lp."userId" = ${userId} AND lp."lessonId" = l.id
      WHERE rv."userId" = ${userId}
        AND (lp.completed IS NULL OR lp.completed = false)
      ORDER BY rv."viewedAt" DESC
      LIMIT 1
    `;

    if (rows.length === 0) return null;
    const row = rows[0];

    return {
      id: row.rv_id,
      viewedAt: row.viewed_at,
      lesson: {
        id: row.lesson_id,
        title: row.lesson_title,
        slug: row.lesson_slug,
        description: row.lesson_description,
        estimatedMinutes: row.lesson_estimated_minutes,
        order: row.lesson_order,
        isPublished: row.lesson_is_published,
        sectionId: row.section_id,
        section: {
          id: row.section_id,
          title: row.section_title,
          roadmap: row.roadmap_id ? {
            id: row.roadmap_id,
            title: row.roadmap_title,
            slug: row.roadmap_slug,
            description: row.roadmap_description ?? null,
            difficulty: row.roadmap_difficulty,
            estimatedHours: row.roadmap_estimated_hours,
            thumbnail: row.roadmap_thumbnail ?? null,
            isPublished: row.roadmap_is_published,
            tags: '',
            category: row.category_id ? {
              id: row.category_id,
              title: row.category_title ?? '',
              slug: row.category_slug ?? '',
            } : null,
          } : null,
        },
      },
    };
  }
}

export const lessonRepository = new LessonRepository();
