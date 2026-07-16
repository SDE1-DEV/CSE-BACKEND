import { categoryRepository } from '../repositories/category.repository';
import { roadmapRepository } from '../repositories/roadmap.repository';
import { lessonRepository } from '../repositories/lesson.repository';
import { Role } from '@prisma/client';

export interface SearchResults {
  categories: unknown[];
  roadmaps: unknown[];
  lessons: unknown[];
}

export class SearchService {
  async globalSearch(query: string, role?: Role): Promise<SearchResults> {
    const isAdmin = role === Role.ADMIN;

    const [categories, roadmaps, lessons] = await Promise.all([
      categoryRepository.searchByTitle(query),
      roadmapRepository.searchByTitle(query, isAdmin),
      lessonRepository.searchByTitle(query, !isAdmin),
    ]);

    return { categories, roadmaps, lessons };
  }
}

export const searchService = new SearchService();
