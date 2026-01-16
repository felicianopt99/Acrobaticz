/**
 * Rate Limiting Middleware
 * 
 * Protects API endpoints from abuse by limiting requests per user
 * Configurable per-endpoint rate limits
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  keyGenerator?: (request: NextRequest) => string; // Default uses userId or IP
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * In-memory rate limit store
 * For production, use Redis or similar distributed cache
 */
const rateLimitStore: RateLimitStore = {};

/**
 * Clean up expired entries from the store
 * Run periodically to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  }
}

/**
 * Run cleanup every hour
 */
setInterval(cleanupExpiredEntries, 60 * 60 * 1000);

/**
 * Get rate limit key from request
 * Priority: userId > IP address
 */
function getDefaultRateLimitKey(request: NextRequest): string {
  // Try to get from custom header (set by authentication middleware)
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Check if request should be rate limited
 * Returns { allowed: boolean, remaining: number, resetTime: number }
 */
function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore[key];

  // New entry or expired
  if (!entry || entry.resetTime < now) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: rateLimitStore[key].resetTime,
    };
  }

  // Increment existing entry
  entry.count++;

  return {
    allowed: entry.count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limiting middleware for Next.js API routes
 *
 * Usage in API routes:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitCheck = checkApiRateLimit(request, {
 *     maxRequests: 10,
 *     windowMs: 60 * 1000, // 1 minute
 *   });
 *
 *   if (!rateLimitCheck.allowed) {
 *     return rateLimitExceeded(rateLimitCheck);
 *   }
 *
 *   // Handle request
 * }
 * ```
 */
export function checkApiRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): ReturnType<typeof checkRateLimit> {
  const keyGenerator = config.keyGenerator || getDefaultRateLimitKey;
  const key = keyGenerator(request);
  return checkRateLimit(key, config);
}

/**
 * Return rate limit exceeded response
 */
export function rateLimitExceeded(
  rateLimitCheck: ReturnType<typeof checkRateLimit>
): NextResponse {
  const resetIn = Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: 'Too many requests',
      message: `You have exceeded the rate limit. Please try again in ${resetIn} seconds.`,
      retryAfter: resetIn,
    },
    {
      status: 429, // Too Many Requests
      headers: {
        'Retry-After': resetIn.toString(),
        'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
        'X-RateLimit-Reset': rateLimitCheck.resetTime.toString(),
      },
    }
  );
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  rateLimitCheck: ReturnType<typeof checkRateLimit>,
  maxRequests: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitCheck.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitCheck.resetTime.toString());
  return response;
}

/**
 * Pre-defined rate limit configs for common scenarios
 */
export const RATE_LIMIT_PRESETS = {
  // Strict - for sensitive operations like auth
  STRICT: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // Standard - for normal API operations
  STANDARD: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  },

  // Relaxed - for read-heavy operations
  RELAXED: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },

  // Write operations - rentals, equipment
  WRITE: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },

  // Read operations - get lists
  READ: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },

  // Very relaxed - internal operations
  INTERNAL: {
    maxRequests: 1000,
    windowMs: 60 * 1000, // 1 minute
  },
};

/**
 * Reset rate limit for a specific key
 * Useful for admin operations or testing
 */
export function resetRateLimit(key: string): void {
  delete rateLimitStore[key];
}

/**
 * Reset all rate limits
 */
export function resetAllRateLimits(): void {
  for (const key in rateLimitStore) {
    delete rateLimitStore[key];
  }
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(key: string): { count: number; resetTime: number } | null {
  return rateLimitStore[key] || null;
}

/**
 * Get all current rate limit entries (for monitoring)
 */
export function getAllRateLimitStats(): {
  totalKeys: number;
  entries: Array<{ key: string; count: number; resetTime: number }>;
} {
  const entries = Object.entries(rateLimitStore).map(([key, value]) => ({
    key,
    count: value.count,
    resetTime: value.resetTime,
  }));

  return {
    totalKeys: entries.length,
    entries,
  };
}

/**
 * Distributed rate limiting with external store
 * For production use with Redis
 */
export interface DistributedRateLimitStore {
  increment(key: string, windowMs: number): Promise<number>;
  get(key: string): Promise<{ count: number; resetTime: number } | null>;
  set(key: string, count: number, resetTime: number): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Example Redis implementation (pseudo-code)
 * Implement this with your preferred Redis client
 */
export class RedisRateLimitStore implements DistributedRateLimitStore {
  private redis: any; // Your Redis client

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async increment(key: string, windowMs: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, Math.ceil(windowMs / 1000));
    }
    return count;
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const count = await this.redis.get(key);
    if (count === null) return null;

    const ttl = await this.redis.ttl(key);
    return {
      count: parseInt(count),
      resetTime: Date.now() + ttl * 1000,
    };
  }

  async set(key: string, count: number, resetTime: number): Promise<void> {
    const ttl = Math.ceil((resetTime - Date.now()) / 1000);
    await this.redis.setex(key, ttl, count.toString());
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
