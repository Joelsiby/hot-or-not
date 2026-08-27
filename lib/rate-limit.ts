import { redis } from './redis';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// More robust IP detection with multiple headers
export function getClientIdentifier(request: Request | { headers: Headers }): string {
  // Try multiple headers in order of reliability
  const headers = request.headers;
  
  // Cloudflare, AWS ALB, etc.
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;
  
  // Standard forwarded headers
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // Take the first IP (original client) and ignore proxies
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 0) return ips[0];
  }
  
  // Real IP header
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) return xRealIp;
  
  // Fallback to a combination of headers as a fingerprint
  const userAgent = headers.get('user-agent') || 'unknown';
  const acceptLanguage = headers.get('accept-language') || 'unknown';
  const acceptEncoding = headers.get('accept-encoding') || 'unknown';
  
  // Create a simple fingerprint from headers that are harder to spoof
  return `${userAgent}-${acceptLanguage}-${acceptEncoding}`;
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
