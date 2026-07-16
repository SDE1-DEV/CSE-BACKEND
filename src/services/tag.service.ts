import { ProblemTag } from '@prisma/client';
import { tagRepository } from '../repositories/tag.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, CODING_MESSAGES } from '../constants';
import { CreateTagInput, UpdateTagInput } from '../validators/tag.validator';

export class TagService {
  async create(data: CreateTagInput): Promise<ProblemTag> {
    const [slugExists, nameExists] = await Promise.all([
      tagRepository.existsBySlug(data.slug),
      tagRepository.existsByName(data.name),
    ]);
    if (slugExists) throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.TAG_SLUG_EXISTS);
    if (nameExists) throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.TAG_NAME_EXISTS);
    return tagRepository.create({ name: data.name, slug: data.slug });
  }

  async getAll(): Promise<ProblemTag[]> {
    return tagRepository.findAll();
  }

  async getById(id: string): Promise<ProblemTag> {
    const tag = await tagRepository.findById(id);
    if (!tag) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.TAG_NOT_FOUND);
    return tag;
  }

  async update(id: string, data: UpdateTagInput): Promise<ProblemTag> {
    const tag = await tagRepository.findById(id);
    if (!tag) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.TAG_NOT_FOUND);

    if (data.slug && data.slug !== tag.slug) {
      const exists = await tagRepository.existsBySlug(data.slug, id);
      if (exists) throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.TAG_SLUG_EXISTS);
    }
    if (data.name && data.name !== tag.name) {
      const exists = await tagRepository.existsByName(data.name, id);
      if (exists) throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.TAG_NAME_EXISTS);
    }

    return tagRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const tag = await tagRepository.findById(id);
    if (!tag) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.TAG_NOT_FOUND);
    await tagRepository.delete(id);
  }
}

export const tagService = new TagService();
