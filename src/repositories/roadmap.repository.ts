/**
 * RoadmapRepository — Legacy Roadmap System
 *
 * The roadmaps table still physically exists in production but Prisma Client
 * no longer has a typed model for it. All DB access uses prisma.$queryRaw /
 * prisma.$executeRaw.
 */
import { prisma } from '../config/database';

export interface RoadmapFilters {
  categoryId?: string;
  difficulty?: string;
  search?: string;
  isPublished?: boolean;
}

export interface RoadmapSort {
  sortBy?: 'displayOrder' | 'createdAt' | 'title' | 'estimatedHours';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface RawRoadmap {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  difficulty: string;
  estimatedHours: number | null;
  prerequisites: string | null;
  displayOrder: number;
  isPublished: boolean;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  // joined
  category_id: string | null;
  category_title: string | null;
  category_slug: string | null;
}

function shapeRoadmap(row: RawRoadmap) {
  return {
    id: row.id,
    categoryId: row.categoryId,
    title: row.title,
    slug: row.slug,
    description: row.description,
    thumbnail: row.thumbnail,
    difficulty: row.difficulty,
    estimatedHours: row.estimatedHours,
    prerequisites: row.prerequisites,
    displayOrder: row.displayOrder,
    isPublished: row.isPublished,
    tags: row.tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    category: row.category_id
      ? { id: row.category_id, title: row.category_title ?? '', slug: row.category_slug ?? '' }
      : null,
  };
}

export type RoadmapDTO = ReturnType<typeof shapeRoadmap>;

export class RoadmapRepository {
  async create(data: {
    title: string;
    slug: string;
    description?: string | null;
    thumbnail?: string | null;
    difficulty?: string;
    estimatedHours?: number | null;
    prerequisites?: string | null;
    displayOrder?: number;
    isPublished?: boolean;
    categoryId?: string;
    category?: { connect: { id: string } };
  }): Promise<ReturnType<typeof shapeRoadmap>> {
    const categoryId = data.categoryId ?? data.category?.connect.id ?? null;
    const now = new Date();
    const id = crypto.randomUUID();
    const rows = await prisma.$queryRaw<RawRoadmap[]>`
      INSERT INTO "roadmaps"
        ("id", "categoryId", "title", "slug", "description", "thumbnail",
         "difficulty", "estimatedHours", "prerequisites", "displayOrder",
         "isPublished", "createdAt", "updatedAt")
      VALUES (
        ${id}, ${categoryId}, ${data.title}, ${data.slug},
        ${data.description ?? null}, ${data.thumbnail ?? null},
        ${data.difficulty ?? 'BEGINNER'}, ${data.estimatedHours ?? null},
        ${data.prerequisites ?? null}, ${data.displayOrder ?? 0},
        ${data.isPublished ?? false}, ${now}, ${now}
      )
      RETURNING *, NULL AS category_id, NULL AS category_title, NULL AS category_slug
    `;
    return shapeRoadmap(rows[0]);
  }

  async findById(id: string, includeCategory = false): Promise<ReturnType<typeof shapeRoadmap> | null> {
    const rows = await prisma.$queryRaw<RawRoadmap[]>`
      SELECT r.*,
        ${includeCategory ? prisma.$queryRaw`c.id AS category_id, c.title AS category_title, c.slug AS category_slug` : prisma.$queryRaw`NULL AS category_id, NULL AS category_title, NULL AS category_slug`}
      FROM "roadmaps" r
      ${includeCategory ? prisma.$queryRaw`LEFT JOIN "categories" c ON c.id = r."categoryId"` : prisma.$queryRaw``}
      WHERE r.id = ${id} AND r."deletedAt" IS NULL
      LIMIT 1
    `;
    return rows.length > 0 ? shapeRoadmap(rows[0]) : null;
  }

  async findBySlug(slug: string): Promise<ReturnType<typeof shapeRoadmap> | null> {
    const rows = await prisma.$queryRaw<RawRoadmap[]>`
      SELECT r.*, c.id AS category_id, c.title AS category_title, c.slug AS category_slug
      FROM "roadmaps" r
      LEFT JOIN "categories" c ON c.id = r."categoryId"
      WHERE r.slug = ${slug} AND r."deletedAt" IS NULL
      LIMIT 1
    `;
    return rows.length > 0 ? shapeRoadmap(rows[0]) : null;
  }

  async findAll(
    filters: RoadmapFilters,
    pagination: PaginationOptions,
    sort: RoadmapSort = {},
  ): Promise<{ data: ReturnType<typeof shapeRoadmap>[]; total: number }> {
    const conditions: string[] = ['r."deletedAt" IS NULL'];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (filters.categoryId) {
      conditions.push(`r."categoryId" = $${paramIdx++}`);
      params.push(filters.categoryId);
    }
    if (filters.difficulty) {
      conditions.push(`r."difficulty" = $${paramIdx++}`);
      params.push(filters.difficulty.toUpperCase());
    }
    if (filters.isPublished !== undefined) {
      conditions.push(`r."isPublished" = $${paramIdx++}`);
      params.push(filters.isPublished);
    }
    if (filters.search) {
      conditions.push(`(r."title" ILIKE $${paramIdx} OR r."description" ILIKE $${paramIdx})`);
      params.push(`%${filters.search}%`);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');
    const allowedSort: Record<string, string> = {
      displayOrder: '"displayOrder"',
      createdAt: '"createdAt"',
      title: '"title"',
      estimatedHours: '"estimatedHours"',
    };
    const orderCol = allowedSort[sort.sortBy ?? 'displayOrder'] ?? '"displayOrder"';
    const orderDir = sort.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const skip = (pagination.page - 1) * pagination.limit;

    // Build and execute the query via prisma.$queryRawUnsafe for dynamic WHERE
    const dataQuery = `
      SELECT r.*, c.id AS category_id, c.title AS category_title, c.slug AS category_slug
      FROM "roadmaps" r
      LEFT JOIN "categories" c ON c.id = r."categoryId"
      WHERE ${whereClause}
      ORDER BY r.${orderCol} ${orderDir}
      LIMIT ${pagination.limit} OFFSET ${skip}
    `;
    const countQuery = `
      SELECT COUNT(*) AS cnt FROM "roadmaps" r WHERE ${whereClause}
    `;

    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<RawRoadmap[]>(dataQuery, ...params),
      prisma.$queryRawUnsafe<{ cnt: bigint }[]>(countQuery, ...params),
    ]);

    return {
      data: rows.map(shapeRoadmap),
      total: Number(countRows[0]?.cnt ?? 0),
    };
  }

  async update(id: string, data: Record<string, unknown>): Promise<ReturnType<typeof shapeRoadmap>> {
    const now = new Date();
    const allowed = ['title', 'slug', 'description', 'thumbnail', 'difficulty',
      'estimatedHours', 'prerequisites', 'displayOrder', 'isPublished', 'categoryId'];
    for (const field of Object.keys(data)) {
      if (allowed.includes(field)) {
        await prisma.$executeRawUnsafe(
          `UPDATE "roadmaps" SET "${field}" = $1, "updatedAt" = $2 WHERE id = $3`,
          data[field], now, id,
        );
      }
    }
    const updated = await this.findById(id, true);
    if (!updated) throw new Error('Roadmap not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const now = new Date();
    await prisma.$executeRaw`UPDATE "roadmaps" SET "deletedAt" = ${now} WHERE id = ${id}`;
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    if (excludeId) {
      const rows = await prisma.$queryRaw<{ cnt: bigint }[]>`
        SELECT COUNT(*) AS cnt FROM "roadmaps"
        WHERE slug = ${slug} AND id != ${excludeId} AND "deletedAt" IS NULL
      `;
      return Number(rows[0]?.cnt ?? 0) > 0;
    }
    const rows = await prisma.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*) AS cnt FROM "roadmaps"
      WHERE slug = ${slug} AND "deletedAt" IS NULL
    `;
    return Number(rows[0]?.cnt ?? 0) > 0;
  }

  async searchByTitle(query: string, isAdmin = false): Promise<ReturnType<typeof shapeRoadmap>[]> {
    const rows = await prisma.$queryRaw<RawRoadmap[]>`
      SELECT r.*, c.id AS category_id, c.title AS category_title, c.slug AS category_slug
      FROM "roadmaps" r
      LEFT JOIN "categories" c ON c.id = r."categoryId"
      WHERE r."deletedAt" IS NULL
        ${isAdmin ? prisma.$queryRaw`` : prisma.$queryRaw`AND r."isPublished" = true`}
        AND r.title ILIKE ${'%' + query + '%'}
      LIMIT 10
    `;
    return rows.map(shapeRoadmap);
  }
}

export const roadmapRepository = new RoadmapRepository();
