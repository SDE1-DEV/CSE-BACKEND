/**
 * SectionRepository — Legacy Roadmap Section System
 *
 * The roadmap_sections table still physically exists in production but
 * Prisma Client no longer has typed models for it. All DB access uses
 * prisma.$queryRaw / prisma.$executeRaw.
 */
import { prisma } from '../config/database';

export interface RawSection {
  id: string;
  roadmapId: string;
  title: string;
  description: string | null;
  order: number;
  deletedAt: Date | null;
}

export interface RawLessonSummary {
  id: string;
  sectionId: string;
  title: string;
  slug: string;
  contentType: string;
  estimatedMinutes: number | null;
  order: number;
  isPublished: boolean;
}

export class SectionRepository {
  async create(data: {
    title: string;
    description?: string | null;
    order?: number;
    roadmap: { connect: { id: string } };
  }): Promise<RawSection> {
    const now = new Date();
    const id = crypto.randomUUID();
    const roadmapId = data.roadmap.connect.id;
    const rows = await prisma.$queryRaw<RawSection[]>`
      INSERT INTO "roadmap_sections" ("id", "roadmapId", "title", "description", "order")
      VALUES (${id}, ${roadmapId}, ${data.title}, ${data.description ?? null}, ${data.order ?? 0})
      RETURNING *
    `;
    void now; // suppress unused var
    return rows[0];
  }

  async findById(id: string): Promise<RawSection | null> {
    const rows = await prisma.$queryRaw<RawSection[]>`
      SELECT * FROM "roadmap_sections"
      WHERE id = ${id} AND ("deletedAt" IS NULL)
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async findByRoadmapId(roadmapId: string): Promise<(RawSection & { lessons: RawLessonSummary[] })[]> {
    const sections = await prisma.$queryRaw<RawSection[]>`
      SELECT * FROM "roadmap_sections"
      WHERE "roadmapId" = ${roadmapId} AND ("deletedAt" IS NULL)
      ORDER BY "order" ASC
    `;

    if (sections.length === 0) return [];

    const sectionIds = sections.map((s) => s.id);
    const lessons = await prisma.$queryRaw<RawLessonSummary[]>`
      SELECT id, "sectionId", title, slug, "contentType", "estimatedMinutes", "order", "isPublished"
      FROM "lessons"
      WHERE "sectionId" = ANY(${sectionIds}) AND "deletedAt" IS NULL
      ORDER BY "order" ASC
    `;

    const lessonsBySection: Record<string, RawLessonSummary[]> = {};
    for (const l of lessons) {
      if (!lessonsBySection[l.sectionId]) lessonsBySection[l.sectionId] = [];
      lessonsBySection[l.sectionId].push(l);
    }

    return sections.map((s) => ({ ...s, lessons: lessonsBySection[s.id] ?? [] }));
  }

  async findByRoadmapIdPublished(roadmapId: string): Promise<(RawSection & { lessons: RawLessonSummary[] })[]> {
    const sections = await prisma.$queryRaw<RawSection[]>`
      SELECT * FROM "roadmap_sections"
      WHERE "roadmapId" = ${roadmapId} AND ("deletedAt" IS NULL)
      ORDER BY "order" ASC
    `;

    if (sections.length === 0) return [];

    const sectionIds = sections.map((s) => s.id);
    const lessons = await prisma.$queryRaw<RawLessonSummary[]>`
      SELECT id, "sectionId", title, slug, "contentType", "estimatedMinutes", "order", "isPublished"
      FROM "lessons"
      WHERE "sectionId" = ANY(${sectionIds})
        AND "deletedAt" IS NULL
        AND "isPublished" = true
      ORDER BY "order" ASC
    `;

    const lessonsBySection: Record<string, RawLessonSummary[]> = {};
    for (const l of lessons) {
      if (!lessonsBySection[l.sectionId]) lessonsBySection[l.sectionId] = [];
      lessonsBySection[l.sectionId].push(l);
    }

    return sections.map((s) => ({ ...s, lessons: lessonsBySection[s.id] ?? [] }));
  }

  async update(id: string, data: { title?: string; description?: string | null; order?: number }): Promise<RawSection> {
    const now = new Date();
    if (data.title !== undefined) {
      await prisma.$executeRaw`UPDATE "roadmap_sections" SET "title" = ${data.title} WHERE id = ${id}`;
    }
    if (data.description !== undefined) {
      await prisma.$executeRaw`UPDATE "roadmap_sections" SET "description" = ${data.description} WHERE id = ${id}`;
    }
    if (data.order !== undefined) {
      await prisma.$executeRaw`UPDATE "roadmap_sections" SET "order" = ${data.order} WHERE id = ${id}`;
    }
    void now;

    const rows = await prisma.$queryRaw<RawSection[]>`
      SELECT * FROM "roadmap_sections" WHERE id = ${id} LIMIT 1
    `;
    return rows[0];
  }

  async delete(id: string): Promise<void> {
    const now = new Date();
    await prisma.$executeRaw`UPDATE "roadmap_sections" SET "deletedAt" = ${now} WHERE id = ${id}`;
  }
}

export const sectionRepository = new SectionRepository();
