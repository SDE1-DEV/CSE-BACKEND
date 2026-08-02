import { categoryRepository } from '../repositories/category.repository';
import { roadmapRepository } from '../repositories/roadmap.repository';
import { lessonRepository } from '../repositories/lesson.repository';
import { Role } from '@prisma/client';

export interface SearchResults {
  categories: unknown[];
  roadmaps: unknown[];
  lessons: unknown[];
  total: number;
  query: string;
}

export class SearchService {
  async globalSearch(query: string, role?: Role): Promise<SearchResults> {
    const isAdmin = (role === Role.SUPER_ADMIN || role === Role.MANAGER);

    const [categories, roadmaps, lessonsRaw] = await Promise.all([
      categoryRepository.searchByTitle(query),
      roadmapRepository.searchByTitle(query, isAdmin),
      lessonRepository.searchByTitle(query, !isAdmin),
    ]);

    // Enrich lessons with roadmapTitle for the frontend SearchResults type
    const lessons = lessonsRaw.map((l: any) => ({
      ...l,
      roadmapTitle: l.section?.roadmap?.title ?? null,
      sectionTitle: l.section?.title ?? null,
    }));

    // Enrich categories for the frontend LearningCategory type
    const enrichedCategories = categories.map((c: any) => ({
      ...c,
      name: c.title,             // frontend uses 'name', backend stores 'title'
      color: '#3b82f6',          // default blue
      roadmapCount: 0,           // client-side display only
    }));

    // Enrich roadmaps for the frontend Roadmap type
    const enrichedRoadmaps = roadmaps.map((r: any) => ({
      ...r,
      difficulty: r.difficulty?.toLowerCase() ?? 'beginner',
      estimatedHours: r.estimatedHours ?? 0,
      lessonCount: 0,
      tags: r.tags ? r.tags.split(',').map((t: string) => t.trim()) : [],
      category: r.category
        ? { ...r.category, name: r.category.title, color: '#3b82f6', roadmapCount: 0 }
        : { id: '', name: 'Programming', slug: 'programming', color: '#3b82f6', roadmapCount: 0 },
    }));

    const total = enrichedCategories.length + enrichedRoadmaps.length + lessons.length;

    return {
      categories: enrichedCategories,
      roadmaps: enrichedRoadmaps,
      lessons,
      total,
      query,
    };
  }
}

export const searchService = new SearchService();
