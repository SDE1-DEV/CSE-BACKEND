/**
 * Cron-based Scheduled Jobs
 * PRD-06: Section 4 — Scheduled Jobs
 *
 * Jobs:
 * - Expire invitations         (every hour)
 * - Delete expired OTPs        (every 30 min)
 * - Archive expired events     (daily 1 AM)
 * - Refresh analytics          (daily 2 AM)
 * - Generate daily challenge   (daily midnight)
 * - Weekly learning reports    (Sundays 8 AM)
 * - Cleanup stale notifications(daily 3 AM)
 */

import cron, { ScheduledTask } from 'node-cron';
import { enqueueCleanup } from '../queues/cleanup.queue';
import { enqueueAnalytics } from '../queues/analytics.queue';
import { generateDailyChallenge } from './daily-challenge.job';
import { sendWeeklyReports } from './weekly-report.job';
import { logger } from '../utils/logger';

type CronJobDef = {
  name: string;
  schedule: string;
  handler: () => Promise<void> | void;
};

const jobDefinitions: CronJobDef[] = [
  {
    name: 'cleanup:expired-otps',
    schedule: '*/30 * * * *',
    handler: () => enqueueCleanup('cleanup:expired-otps'),
  },
  {
    name: 'cleanup:expired-invitations',
    schedule: '0 * * * *',
    handler: () => enqueueCleanup('cleanup:expired-invitations'),
  },
  {
    name: 'cleanup:expired-tokens',
    schedule: '0 */4 * * *',
    handler: () => enqueueCleanup('cleanup:expired-tokens'),
  },
  {
    name: 'cleanup:expired-events',
    schedule: '0 1 * * *',
    handler: () => enqueueCleanup('cleanup:expired-events'),
  },
  {
    name: 'cleanup:stale-notifications',
    schedule: '0 3 * * *',
    handler: () => enqueueCleanup('cleanup:stale-notifications'),
  },
  {
    name: 'analytics:refresh-admin',
    schedule: '0 2 * * *',
    handler: () => enqueueAnalytics({ type: 'analytics:refresh-admin' }),
  },
  {
    name: 'daily-challenge:generate',
    schedule: '0 0 * * *',
    handler: generateDailyChallenge,
  },
  {
    name: 'weekly-reports:send',
    schedule: '0 8 * * 0',
    handler: sendWeeklyReports,
  },
];

const runningTasks: ScheduledTask[] = [];

export const startScheduler = (): void => {
  for (const job of jobDefinitions) {
    const task = cron.schedule(
      job.schedule,
      async () => {
        logger.info(`Scheduled job starting: ${job.name}`);
        try {
          await job.handler();
          logger.info(`Scheduled job completed: ${job.name}`);
        } catch (err) {
          logger.error(`Scheduled job failed: ${job.name}`, { error: (err as Error).message });
        }
      },
      { timezone: 'UTC' },
    );

    runningTasks.push(task);
    logger.info(`Scheduled job registered: ${job.name} (${job.schedule})`);
  }

  logger.info(`Scheduler started with ${runningTasks.length} jobs`);
};

export const stopScheduler = (): void => {
  runningTasks.forEach((t) => t.stop());
  runningTasks.length = 0;
  logger.info('Scheduler stopped');
};
