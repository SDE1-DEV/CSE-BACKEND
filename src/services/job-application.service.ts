import { JobApplication } from '@prisma/client';
import { jobApplicationRepository } from '../repositories/job-application.repository';
import { jobPostingRepository } from '../repositories/job-posting.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PLACEMENT_MESSAGES } from '../constants';
import { CreateJobApplicationInput, UpdateJobApplicationInput } from '../validators/job-application.validator';
import { platformEventEmitter } from '../events/platform-events';
import { enqueueEmail } from '../queues/email.queue';
import { prisma } from '../config/database';

export class JobApplicationService {
  async create(userId: string, data: CreateJobApplicationInput): Promise<JobApplication> {
    const job = await jobPostingRepository.findById(data.jobId);
    if (!job) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.JOB_NOT_FOUND);

    const existing = await jobApplicationRepository.findByUserAndJob(userId, data.jobId);
    if (existing) throw new AppError(HTTP_STATUS.CONFLICT, PLACEMENT_MESSAGES.APPLICATION_ALREADY_EXISTS);

    const application = await jobApplicationRepository.create({
      user: { connect: { id: userId } },
      job: { connect: { id: data.jobId } },
      status: data.status ?? 'SAVED',
      notes: data.notes ?? null,
    });

    platformEventEmitter.emit('application:created', {
      userId,
      jobId: data.jobId,
      applicationId: application.id,
      jobTitle: job.title,
    });

    // If job has a deadline within 3 days, enqueue a reminder email
    if (job.applicationDeadline) {
      const daysLeft = Math.ceil(
        (job.applicationDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      if (daysLeft > 0 && daysLeft <= 3) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        const company = await prisma.company.findUnique({ where: { id: job.companyId }, select: { name: true } });
        if (user) {
          void enqueueEmail({
            type: 'email:placement-reminder',
            to: user.email,
            payload: {
              jobTitle: job.title,
              companyName: company?.name ?? 'Unknown',
              deadline: job.applicationDeadline.toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              }),
            },
          });
        }
      }
    }

    return application;
  }

  async getAll(userId: string, page: number, limit: number) {
    return jobApplicationRepository.findAllByUser(userId, page, Math.min(limit, 50));
  }

  async update(id: string, userId: string, data: UpdateJobApplicationInput): Promise<JobApplication> {
    const application = await jobApplicationRepository.findById(id);
    if (!application) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.APPLICATION_NOT_FOUND);
    if (application.userId !== userId) throw new AppError(HTTP_STATUS.FORBIDDEN, PLACEMENT_MESSAGES.APPLICATION_FORBIDDEN);

    return jobApplicationRepository.update(id, data);
  }

  async delete(id: string, userId: string): Promise<void> {
    const application = await jobApplicationRepository.findById(id);
    if (!application) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.APPLICATION_NOT_FOUND);
    if (application.userId !== userId) throw new AppError(HTTP_STATUS.FORBIDDEN, PLACEMENT_MESSAGES.APPLICATION_FORBIDDEN);
    await jobApplicationRepository.delete(id);
  }
}

export const jobApplicationService = new JobApplicationService();
