/**
 * ResourceRepository — Legacy Learning Resources
 *
 * The learning_resources table physically exists in production but Prisma
 * Client no longer has a typed model for it. All DB access uses raw SQL.
 */
import { prisma } from '../config/database';

export interface RawResource {
  id: string;
  lessonId: string;
  type: string;
  title: string;
  url: string;
  duration: number | null;
  author: string | null;
  thumbnail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ResourceRepository {
  async create(data: {
    lessonId: string;
    type: string;
    title: string;
    url: string;
    duration?: number | null;
    author?: string | null;
    thumbnail?: string | null;
    lesson?: { connect: { id: string } };
  }): Promise<RawResource> {
    const lessonId = data.lessonId ?? data.lesson?.connect.id;
    const now = new Date();
    const id = crypto.randomUUID();
    const rows = await prisma.$queryRaw<RawResource[]>`
      INSERT INTO "learning_resources"
        ("id", "lessonId", "type", "title", "url", "duration", "author", "thumbnail", "createdAt", "updatedAt")
      VALUES (
        ${id}, ${lessonId}, ${data.type}, ${data.title}, ${data.url},
        ${data.duration ?? null}, ${data.author ?? null}, ${data.thumbnail ?? null},
        ${now}, ${now}
      )
      RETURNING *
    `;
    return rows[0];
  }

  async findById(id: string): Promise<RawResource | null> {
    const rows = await prisma.$queryRaw<RawResource[]>`
      SELECT * FROM "learning_resources" WHERE id = ${id} LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async findByLessonId(lessonId: string): Promise<RawResource[]> {
    return prisma.$queryRaw<RawResource[]>`
      SELECT * FROM "learning_resources"
      WHERE "lessonId" = ${lessonId}
      ORDER BY "createdAt" ASC
    `;
  }

  async update(id: string, data: Partial<{
    type: string;
    title: string;
    url: string;
    duration: number | null;
    author: string | null;
    thumbnail: string | null;
  }>): Promise<RawResource> {
    const now = new Date();
    const allowed = ['type', 'title', 'url', 'duration', 'author', 'thumbnail'];
    for (const field of Object.keys(data)) {
      if (allowed.includes(field)) {
        await prisma.$executeRawUnsafe(
          `UPDATE "learning_resources" SET "${field}" = $1, "updatedAt" = $2 WHERE id = $3`,
          (data as Record<string, unknown>)[field], now, id,
        );
      }
    }
    const updated = await this.findById(id);
    if (!updated) throw new Error('Resource not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await prisma.$executeRaw`DELETE FROM "learning_resources" WHERE id = ${id}`;
  }
}

export const resourceRepository = new ResourceRepository();
