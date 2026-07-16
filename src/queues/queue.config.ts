/**
 * BullMQ Queue Configuration
 * PRD-06: Section 2 — Background Job Queue
 */

import { Queue, Worker, ConnectionOptions, Processor } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { logger } from '../utils/logger';

export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  RESUME_PROCESSING: 'resume-processing',
  ANALYTICS: 'analytics',
  CLEANUP: 'cleanup',
  SCHEDULED: 'scheduled',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProcessorFn<T = any> = (job: import('bullmq').Job<T>) => Promise<void>;

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
};

const allQueues: Queue[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allWorkers: Worker<any>[] = [];

export const createQueue = (name: QueueName): Queue => {
  const connection = createRedisConnection() as unknown as ConnectionOptions;
  const queue = new Queue(name, {
    connection,
    defaultJobOptions,
  });

  queue.on('error', (err) => {
    logger.warn(`Queue "${name}" error`, { error: err.message });
  });

  allQueues.push(queue);
  return queue;
};

export const createWorker = <T = unknown>(
  name: QueueName,
  processor: ProcessorFn<T>,
  concurrency = 5,
): Worker<T> => {
  const connection = createRedisConnection() as unknown as ConnectionOptions;
  // BullMQ Processor<T> returns Promise<unknown>; cast our void-returning fn
  const worker = new Worker<T>(name, processor as Processor<T>, {
    connection,
    concurrency,
    limiter: {
      max: 100,
      duration: 60_000,
    },
  });

  worker.on('completed', (job) => {
    logger.info('Job completed', { queue: name, jobId: job.id, jobName: job.name });
  });

  worker.on('failed', (job, err) => {
    logger.error('Job failed', {
      queue: name,
      jobId: job?.id,
      jobName: job?.name,
      attempt: job?.attemptsMade,
      error: err.message,
    });
  });

  worker.on('stalled', (jobId) => {
    logger.warn('Job stalled', { queue: name, jobId });
  });

  allWorkers.push(worker);
  return worker;
};

export const closeAllQueues = async (): Promise<void> => {
  await Promise.all([
    ...allWorkers.map((w) => w.close()),
    ...allQueues.map((q) => q.close()),
  ]);
  logger.info('All queues and workers closed');
};
