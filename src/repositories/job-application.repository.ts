import { JobApplication, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class JobApplicationRepository {
  async create(data: Prisma.JobApplicationCreateInput): Promise<JobApplication> {
    return prisma.jobApplication.create({
      data,
      include: { job: { include: { company: true } } },
    });
  }

  async findById(id: string): Promise<JobApplication | null> {
    return prisma.jobApplication.findUnique({
      where: { id },
      include: { job: { include: { company: true } } },
    });
  }

  async findByUserAndJob(userId: string, jobId: string): Promise<JobApplication | null> {
    return prisma.jobApplication.findUnique({ where: { userId_jobId: { userId, jobId } } });
  }

  async findAllByUser(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where: { userId },
        include: { job: { include: { company: true } } },
        orderBy: { appliedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.jobApplication.count({ where: { userId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, data: Prisma.JobApplicationUpdateInput): Promise<JobApplication> {
    return prisma.jobApplication.update({
      where: { id },
      data,
      include: { job: { include: { company: true } } },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.jobApplication.delete({ where: { id } });
  }
}

export const jobApplicationRepository = new JobApplicationRepository();
