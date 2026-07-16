/**
 * Email Queue — moves all email sending to background jobs.
 * PRD-06: Section 3 — Email Service (async)
 */

import { Job } from 'bullmq';
import { createQueue, createWorker, QUEUE_NAMES } from './queue.config';
import { logger } from '../utils/logger';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendTeamInvitationEmail,
  sendEventRegistrationEmail,
  sendPlacementReminderEmail,
  sendWeeklyLearningSummaryEmail,
} from '../utils/email';

export type EmailJobType =
  | 'email:verification'
  | 'email:password-reset'
  | 'email:team-invitation'
  | 'email:event-registration'
  | 'email:placement-reminder'
  | 'email:weekly-summary';

export interface EmailJobData {
  type: EmailJobType;
  to: string;
  payload: Record<string, unknown>;
}

// Singleton queue
export const emailQueue = createQueue(QUEUE_NAMES.EMAIL);

/**
 * Enqueue an email job.
 */
export const enqueueEmail = async (data: EmailJobData): Promise<void> => {
  try {
    await emailQueue.add(data.type, data, {
      priority: data.type === 'email:verification' ? 1 : 5,
    });
    logger.info('Email job enqueued', { type: data.type, to: data.to });
  } catch (err) {
    logger.error('Failed to enqueue email job', { type: data.type, error: (err as Error).message });
    // Fallback: attempt direct send so the user experience isn't broken
    void processEmailJob({ name: data.type, data } as unknown as Job<EmailJobData>);
  }
};

/**
 * Process an individual email job.
 */
const processEmailJob = async (job: Job<EmailJobData>): Promise<void> => {
  const { type, to, payload } = job.data;

  logger.info('Processing email job', { jobId: job.id, type, to });

  switch (type) {
    case 'email:verification':
      await sendVerificationEmail(to, payload['otp'] as string);
      break;
    case 'email:password-reset':
      await sendPasswordResetEmail(to, payload['otp'] as string);
      break;
    case 'email:team-invitation':
      await sendTeamInvitationEmail(to, payload['teamName'] as string, payload['senderName'] as string);
      break;
    case 'email:event-registration':
      await sendEventRegistrationEmail(to, payload['eventTitle'] as string, payload['eventDate'] as string);
      break;
    case 'email:placement-reminder':
      await sendPlacementReminderEmail(to, payload['jobTitle'] as string, payload['companyName'] as string, payload['deadline'] as string);
      break;
    case 'email:weekly-summary':
      await sendWeeklyLearningSummaryEmail(
        to,
        payload['userName'] as string,
        payload['lessonsCompleted'] as number,
        payload['minutesStudied'] as number,
      );
      break;
    default:
      logger.warn('Unknown email job type', { type });
  }
};

/**
 * Start the email queue worker.
 * Called once during server startup (in worker mode or monolith).
 */
export const startEmailWorker = (): void => {
  createWorker<EmailJobData>(QUEUE_NAMES.EMAIL, processEmailJob, 3);
  logger.info('Email worker started');
};
