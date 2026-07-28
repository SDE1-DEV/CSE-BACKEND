import { Note, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class NoteRepository {
  async findByUserAndLesson(userId: string, lessonId: string): Promise<Note | null> {
    return prisma.note.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
  }

  async upsert(userId: string, lessonId: string, content: string): Promise<Note> {
    return prisma.note.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { content, updatedAt: new Date() },
      create: { userId, lessonId, content },
    });
  }

  async delete(userId: string, lessonId: string): Promise<void> {
    await prisma.note.deleteMany({
      where: { userId, lessonId },
    });
  }

  async findAllByUser(userId: string): Promise<Note[]> {
    return prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        lesson: {
          select: { id: true, title: true, slug: true, section: { select: { id: true, title: true, roadmap: { select: { id: true, title: true, slug: true } } } } },
        },
      },
    });
  }
}

export const noteRepository = new NoteRepository();
