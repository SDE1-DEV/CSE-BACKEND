import { LearningResource } from '@prisma/client';
import { resourceRepository } from '../repositories/resource.repository';
import { lessonRepository } from '../repositories/lesson.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';
import { CreateResourceInput, UpdateResourceInput } from '../validators/resource.validator';

export class ResourceService {
  async createResource(data: CreateResourceInput): Promise<LearningResource> {
    const lesson = await lessonRepository.findById(data.lessonId);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    return resourceRepository.create({
      type: data.type,
      title: data.title,
      url: data.url,
      duration: data.duration ?? null,
      author: data.author ?? null,
      thumbnail: data.thumbnail ?? null,
      lesson: { connect: { id: data.lessonId } },
    });
  }

  async getResourcesByLesson(lessonId: string): Promise<LearningResource[]> {
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }
    return resourceRepository.findByLessonId(lessonId);
  }

  async updateResource(id: string, data: UpdateResourceInput): Promise<LearningResource> {
    const resource = await resourceRepository.findById(id);
    if (!resource) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.RESOURCE_NOT_FOUND);
    }
    return resourceRepository.update(id, data);
  }

  async deleteResource(id: string): Promise<void> {
    const resource = await resourceRepository.findById(id);
    if (!resource) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.RESOURCE_NOT_FOUND);
    }
    await resourceRepository.delete(id);
  }
}

export const resourceService = new ResourceService();
