import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error('[Redis] REDIS_URL is not set. Redis connection will fail.');
}

export const redis = new Redis(REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});
