import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';

/**
 * Redis-backed sliding window rate limiter.
 * Uses a sorted set (ZSET) per key to track request timestamps.
 *
 * @param windowMs  Time window in milliseconds
 * @param max       Max requests per window
 */
export function rateLimit(windowMs: number, max: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `rl:${ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    const nonce = `${now}:${Math.random().toString(36).slice(2, 8)}`;

    try {
      const pipeline = redis.pipeline();
      // Remove expired entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart);
      // Add current request timestamp
      pipeline.zadd(key, String(now), nonce);
      // Count requests in the window
      pipeline.zcard(key);
      // Set TTL on the key so it auto-cleans
      pipeline.pexpire(key, windowMs);

      const results = await pipeline.exec();
      const requestCount = results?.[2]?.[1] as number | undefined;

      if (requestCount !== undefined && requestCount > max) {
        // Get the oldest entry to calculate retry-after
        const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
        const retryAfter = oldest.length >= 2
          ? Math.ceil((parseInt(oldest[1]) + windowMs - now) / 1000)
          : Math.ceil(windowMs / 1000);

        // Remove the exact entry we just added
        await redis.zrem(key, nonce);

        res.setHeader('Retry-After', String(retryAfter));
        res.status(429).json({
          error: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی صبر کنید.',
        });
        return;
      }

      next();
    } catch (err) {
      // If Redis is down, fail open — let the request through
      console.error('[RateLimit] Redis error, failing open:', err);
      next();
    }
  };
}
