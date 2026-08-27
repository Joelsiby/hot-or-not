import { redis } from './redis';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function rateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60 * 1000 // 1 minute in milliseconds
): Promise<RateLimitResult> {
  if (!redis) {
    // If Redis is not configured, allow all requests (graceful degradation)
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + window,
    };
  }

  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - window;

  try {
    // Remove entries outside the current window
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const current = await redis.zcard(key);

    if (current >= limit) {
      // Get the oldest entry to calculate reset time
      const oldest = (await redis.zrange(key, 0, 0, { withScores: true })) as Array<{ score: number }>;
      const resetTime = oldest.length > 0 ? Math.floor(oldest[0].score) + window : now + window;

      return {
        success: false,
        limit,
        remaining: 0,
        reset: resetTime,
      };
    }

    // Add current request
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });

    // Set expiration
    await redis.expire(key, Math.ceil(window / 1000));

    return {
      success: true,
      limit,
      remaining: limit - current - 1,
      reset: now + window,
    };
  } catch (error) {
    // If Redis fails, allow the request (fail open)
    console.error('Rate limiting error:', error);
    return {
      success: true,
      limit,
      remaining: limit,
      reset: now + window,
    };
  }
}

// Specific rate limit for image uploads
export async function rateLimitImageUpload(identifier: string): Promise<RateLimitResult> {
  // 5 uploads per 5 minutes per user/IP
  return rateLimit(identifier, 5, 5 * 60 * 1000);
}
