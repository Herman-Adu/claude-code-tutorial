/**
 * Rate Limiting Configuration
 *
 * Uses Upstash Redis for distributed rate limiting in production.
 * Falls back to in-memory rate limiting when Redis is not configured.
 *
 * @see https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limit configuration for different operations.
 * These values match the existing in-memory rate limits.
 */
export const RATE_LIMITS = {
  labels: {
    max: 10,
    window: '1h' as const,
    prefix: 'ratelimit:labels',
  },
  comments: {
    max: 50,
    window: '1h' as const,
    prefix: 'ratelimit:comments',
  },
  search: {
    max: 20,
    window: '1m' as const,
    prefix: 'ratelimit:search',
  },
  changePassword: {
    max: 3,
    window: '15m' as const,
    prefix: 'ratelimit:changePassword',
  },
  updateProfile: {
    max: 10,
    window: '1h' as const,
    prefix: 'ratelimit:updateProfile',
  },
  deleteAccount: {
    max: 5,
    window: '1h' as const,
    prefix: 'ratelimit:deleteAccount',
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Result from a rate limit check
 */
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Check if Redis is configured via environment variables
 */
function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * In-memory rate limit storage for development/fallback
 */
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * In-memory rate limit check (fallback when Redis not configured)
 */
function checkInMemoryRateLimit(
  identifier: string,
  type: RateLimitType
): RateLimitResult {
  const config = RATE_LIMITS[type];
  const key = `${config.prefix}:${identifier}`;
  const now = Date.now();

  // Parse window to milliseconds
  const windowMs = parseWindow(config.window);

  const record = inMemoryStore.get(key);

  if (!record || now > record.resetTime) {
    // Start new window
    inMemoryStore.set(key, { count: 1, resetTime: now + windowMs });
    return {
      success: true,
      remaining: config.max - 1,
      reset: now + windowMs,
    };
  }

  if (record.count >= config.max) {
    return {
      success: false,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  // Increment count
  record.count++;
  return {
    success: true,
    remaining: config.max - record.count,
    reset: record.resetTime,
  };
}

/**
 * Parse window string to milliseconds
 */
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 60000; // Default 1 minute

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  switch (unit) {
    case 's':
      return num * 1000;
    case 'm':
      return num * 60 * 1000;
    case 'h':
      return num * 60 * 60 * 1000;
    case 'd':
      return num * 24 * 60 * 60 * 1000;
    default:
      return 60000;
  }
}

// Create Redis client and rate limiters lazily
let redis: Redis | null = null;
const rateLimiters = new Map<RateLimitType, Ratelimit>();

/**
 * Get or create Redis client
 */
function getRedis(): Redis | null {
  if (!isRedisConfigured()) return null;

  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

/**
 * Get or create a rate limiter for the specified type
 */
function getRateLimiter(type: RateLimitType): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) return null;

  if (!rateLimiters.has(type)) {
    const config = RATE_LIMITS[type];
    rateLimiters.set(
      type,
      new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(config.max, config.window),
        prefix: config.prefix,
        analytics: true,
      })
    );
  }

  return rateLimiters.get(type)!;
}

/**
 * Check rate limit for a given identifier and operation type.
 *
 * Uses Redis when configured, falls back to in-memory storage otherwise.
 *
 * @param identifier - Unique identifier (usually userId)
 * @param type - The type of rate limit to check
 * @returns Rate limit result with success status and remaining quota
 *
 * @example
 * ```typescript
 * const result = await checkRateLimit(userId, 'labels');
 * if (!result.success) {
 *   return { success: false, error: 'Rate limit exceeded' };
 * }
 * ```
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(type);

  if (!limiter) {
    // Fallback to in-memory rate limiting
    return checkInMemoryRateLimit(identifier, type);
  }

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Get the error message for a rate limit type
 */
export function getRateLimitErrorMessage(type: RateLimitType): string {
  const config = RATE_LIMITS[type];
  const windowText = formatWindow(config.window);

  const messages: Record<RateLimitType, string> = {
    labels: `Rate limit exceeded. You can create up to ${config.max} labels per ${windowText}.`,
    comments: `Rate limit exceeded. You can create up to ${config.max} comments per ${windowText}.`,
    search: `Too many searches. Please try again in ${windowText}.`,
    changePassword: `Too many password change attempts. Please try again in ${windowText}.`,
    updateProfile: `Too many profile updates. Please try again in ${windowText}.`,
    deleteAccount: `Too many account deletion attempts. Please try again in ${windowText}.`,
  };

  return messages[type];
}

/**
 * Format window for display in error messages
 */
function formatWindow(window: string): string {
  const match = window.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 'a moment';

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  const unitNames: Record<string, string> = {
    s: num === 1 ? 'second' : 'seconds',
    m: num === 1 ? 'minute' : 'minutes',
    h: num === 1 ? 'hour' : 'hours',
    d: num === 1 ? 'day' : 'days',
  };

  return `${num} ${unitNames[unit] || 'moment'}`;
}

/**
 * Clean up in-memory store (for testing and memory management)
 * Only needed when using in-memory fallback
 */
export function cleanupInMemoryStore(): void {
  const now = Date.now();
  for (const [key, record] of inMemoryStore.entries()) {
    if (now > record.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}

/**
 * Reset rate limiter state (for testing)
 */
export function resetRateLimiters(): void {
  inMemoryStore.clear();
  rateLimiters.clear();
  redis = null;
}
