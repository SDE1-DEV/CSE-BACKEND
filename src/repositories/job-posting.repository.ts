import { JobPosting, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface JobFilters {
  companyId?: string;
  location?: string;
  type?: string;
  workMode?: string;
  experienceRequired?: string;
  search?: string;
  isPublished?: boolean;
}

export interface PaginatedJobs {
  data: JobPosting[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class JobPostingRepository {
  async create(data: Prisma.JobPostingCreateInput): Promise<JobPosting> {
    return prisma.jobPosting.create({ data, include: { company: true } });
  }

  async findById(id: string): Promise<JobPosting | null> {
    return prisma.jobPosting.findUnique({ where: { id }, include: { company: true } });
  }

  async findAll(filters: JobFilters, page: number, limit: number): Promise<PaginatedJobs> {
    const where: Prisma.JobPostingWhereInput = {};

    if (filters.isPublished !== undefined) where.isPublished = filters.isPublished;
    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.type) where.type = filters.type as Prisma.EnumJobTypeFilter;
    if (filters.workMode) where.workMode = filters.workMode as Prisma.EnumWorkModeFilter;
    if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
    if (filters.experienceRequired) {
      where.experienceRequired = { contains: filters.experienceRequired, mode: 'insensitive' };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        include: { company: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.jobPosting.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, data: Prisma.JobPostingUpdateInput): Promise<JobPosting> {
    return prisma.jobPosting.update({ where: { id }, data, include: { company: true } });
  }

  async delete(id: string): Promise<void> {
    await prisma.jobPosting.delete({ where: { id } });
  }
}

export const jobPostingRepository = new JobPostingRepository();
