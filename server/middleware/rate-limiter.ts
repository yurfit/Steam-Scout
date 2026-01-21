import type { Request, Response, NextFunction } from 'express';

/**
 * Production-Ready Rate Limiting Middleware
 *
 * Implements sliding window rate limiting to protect API endpoints from abuse.
 * Stores rate limit data in memory with automatic cleanup.
 *
 * Features:
 * - Configurable rate limits per endpoint
 * - IP-based tracking with user ID override
 * - Sliding window algorithm for accurate rate limiting
 * - Automatic cleanup of expired entries
 * - Standard rate limit headers (X-RateLimit-*)
 * - Detailed logging for monitoring
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: Request) => string; // Custom key generator
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  requests: number[]; // Timestamps of requests for sliding window
}

// In-memory store for rate limits (use Redis in distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Creates a rate limiting middleware with the specified configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs = 60000, // Default: 1 minute
    maxRequests = 60, // Default: 60 requests per minute
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
  } = config;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyGenerator(req);
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get or create rate limit entry
      let entry = rateLimitStore.get(key);

      if (!entry || entry.resetTime < now) {
        // Create new entry or reset expired entry
        entry = {
          count: 0,
          resetTime: now + windowMs,
          requests: [],
        };
        rateLimitStore.set(key, entry);
      }

      // Remove requests outside the sliding window
      entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);

      // Check if rate limit exceeded
      if (entry.requests.length >= maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());
        res.setHeader('Retry-After', retryAfter.toString());

        console.warn(`Rate limit exceeded for ${key}: ${entry.requests.length}/${maxRequests} requests`);

        res.status(429).json({
          message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
          limit: maxRequests,
          window: windowMs / 1000,
        });
        return;
      }

      // Add current request to the window
      entry.requests.push(now);
      entry.count++;

      // Set rate limit headers
      const remaining = Math.max(0, maxRequests - entry.requests.length);
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());

      // Handle response to potentially skip counting
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalJson = res.json.bind(res);
        res.json = function (body: any) {
          const statusCode = res.statusCode;
          const isSuccess = statusCode >= 200 && statusCode < 300;
          const isFailed = statusCode >= 400;

          if ((skipSuccessfulRequests && isSuccess) || (skipFailedRequests && isFailed)) {
            // Remove this request from count
            entry!.requests.pop();
          }

          return originalJson(body);
        };
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open - don't block requests if rate limiter fails
      next();
    }
  };
}

/**
 * Default key generator - uses user ID if available, otherwise IP address
 */
function defaultKeyGenerator(req: Request): string {
  // Use authenticated user ID if available
  if (req.auth?.userId) {
    return `user:${req.auth.userId}`;
  }

  // Fall back to IP address
  const ip = getClientIp(req);
  return `ip:${ip}`;
}

/**
 * Gets the real client IP address, handling proxies and load balancers
 */
function getClientIp(req: Request): string {
  // Check various headers that might contain the real IP
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp;
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Predefined rate limiters for common use cases
 */

// Strict rate limiter for authentication endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again later.',
});

// Standard rate limiter for general API endpoints
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: 'API rate limit exceeded. Please slow down your requests.',
});

// Generous rate limiter for read-only endpoints
export const readRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 120, // 120 requests per minute
  message: 'Too many requests. Please try again shortly.',
});

// Strict rate limiter for write operations
export const writeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 requests per minute
  message: 'Too many write operations. Please slow down.',
});

// Very strict rate limiter for expensive operations (Steam API calls)
export const steamApiRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 100, // 100 requests per 5 minutes
  message: 'Steam API rate limit exceeded. Please try again later.',
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Use a global key for Steam API to protect against all users
    return 'global:steam-api';
  },
});

// Export helper for creating custom rate limiters
export { type RateLimitConfig };
