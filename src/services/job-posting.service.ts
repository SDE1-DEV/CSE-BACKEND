import { JobPosting } from '@prisma/client';
import { jobPostingRepository, JobFilters } from '../repositories/job-posting.repository';
import { companyRepository } from '../repositories/company.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PLACEMENT_MESSAGES, CODING_MESSAGES } from '../constants';
import { CreateJobInput, UpdateJobInput } from '../validators/job-posting.validator';

export class JobPostingService {
  async create(data: CreateJobInput): Promise<JobPosting> {
    const company = await companyRepository.findById(data.companyId);
    if (!company) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.COMPANY_NOT_FOUND);

    return jobPostingRepository.create({
      company: { connect: { id: data.companyId } },
      title: data.title,
      type: data.type,
      location: data.location ?? null,
      workMode: data.workMode,
      description: data.description,
      requirements: data.requirements ?? null,
      salaryRange: data.salaryRange ?? null,
      applicationUrl: data.applicationUrl ?? null,
      applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
      experienceRequired: data.experienceRequired ?? null,
      isPublished: data.isPublished ?? false,
    });
  }

  async getAll(
    filters: JobFilters & { page?: number; limit?: number },
    isAdmin = false,
  ) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 10, 50);
    const filterArgs: JobFilters = {
      companyId: filters.companyId,
      location: filters.location,
      type: filters.type,
      workMode: filters.workMode,
      experienceRequired: filters.experienceRequired,
      search: filters.search,
      isPublished: isAdmin ? filters.isPublished : true,
    };
    return jobPostingRepository.findAll(filterArgs, page, limit);
  }

  async getById(id: string): Promise<JobPosting> {
    const job = await jobPostingRepository.findById(id);
    if (!job) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.JOB_NOT_FOUND);
    return job;
  }

  async update(id: string, data: UpdateJobInput): Promise<JobPosting> {
    const job = await jobPostingRepository.findById(id);
    if (!job) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.JOB_NOT_FOUND);

    return jobPostingRepository.update(id, {
      ...data,
      applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
    });
  }

  async delete(id: string): Promise<void> {
    const job = await jobPostingRepository.findById(id);
    if (!job) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.JOB_NOT_FOUND);
    await jobPostingRepository.delete(id);
  }
}

export const jobPostingService = new JobPostingService();
