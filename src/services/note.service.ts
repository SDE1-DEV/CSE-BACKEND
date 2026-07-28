import { Note } from '@prisma/client';
import { noteRepository } from '../repositories/note.repository';
import { lessonRepository } from '../repositories/lesson.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';

const MAX_NOTE_LENGTH = 100_000;

export class NoteService {
  async getByLesson(userId: string, lessonId: string): Promise<Note | null> {
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }
    return noteRepository.findByUserAndLesson(userId, lessonId);
  }

  async upsert(userId: string, lessonId: string, content: string): Promise<Note> {
    if (content === undefined || content === null) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Note content is required');
    }
    if (typeof content !== 'string') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Note content must be a string');
    }
    if (content.length > MAX_NOTE_LENGTH) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        `Note content exceeds the maximum length of ${MAX_NOTE_LENGTH} characters`,
      );
    }
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }
    return noteRepository.upsert(userId, lessonId, content);
  }

  async delete(userId: string, lessonId: string): Promise<void> {
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }
    await noteRepository.delete(userId, lessonId);
  }
}

export const noteService = new NoteService();
