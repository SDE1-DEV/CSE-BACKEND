import Redis, { RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let isConnected = false;

const getRedisOptions = (): RedisOptions => ({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: (times: number) => {
    if (times > 5) {
      logger.warn('Redis: max retries reached, giving up');
      return null;
    }
    return Math.min(times * 100, 3000);
  },
});

export const getRedisClient = (): Redis | null => {
  if (!redisClient) {
    try {
      redisClient = env.REDIS_URL
        ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: true })
        : new Redis(getRedisOptions());

      redisClient.on('connect', () => {
        isConnected = true;
        logger.info('Redis connected');
      });

      redisClient.on('error', (err) => {
        isConnected = false;
        logger.warn('Redis connection error (graceful fallback active)', { error: err.message });
      });

      redisClient.on('close', () => {
        isConnected = false;
        logger.warn('Redis connection closed');
      });

      redisClient.on('ready', () => {
        isConnected = true;
        logger.info('Redis ready');
      });
    } catch (err) {
      logger.warn('Redis initialization failed (graceful fallback active)', { error: err });
      return null;
    }
  }
  return redisClient;
};

export const isRedisAvailable = (): boolean => isConnected;

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    logger.info('Redis disconnected');
  }
};

/** Separate connection for BullMQ — maxRetriesPerRequest must be null */
export const createRedisConnection = (): Redis => {
  const opts: RedisOptions = {
    ...getRedisOptions(),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
  };
  return env.REDIS_URL
    ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false })
    : new Redis(opts);
};
