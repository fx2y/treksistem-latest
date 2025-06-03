import type { Context, Next } from 'hono';
import type { AppContext } from '../types';

/**
 * Rate Limiting Configuration
 * Defines limits for different endpoint patterns
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (c: Context) => string; // Custom key generation
  onLimitReached?: (c: Context) => Response | Promise<Response>; // Custom response
}

/**
 * Default rate limiting configurations for different endpoint patterns
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Public endpoints - most restrictive
  'POST:/api/orders': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    skipSuccessfulRequests: false,
  },
  
  'GET:/api/public/services/*/config': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    skipSuccessfulRequests: true, // Don't penalize successful lookups
  },

  // Mitra admin endpoints - moderate restrictions
  'POST:/api/mitra/profile': {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 2,
    skipSuccessfulRequests: false,
  },

  'POST:/api/mitra/services': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    skipSuccessfulRequests: false,
  },

  'POST:/api/mitra/drivers': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    skipSuccessfulRequests: false,
  },

  'PUT:/api/mitra/services/*': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 15,
    skipSuccessfulRequests: false,
  },

  'DELETE:/api/mitra/services/*': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    skipSuccessfulRequests: false,
  },

  // Driver endpoints
  'POST:/api/driver/*/orders/*/request-upload-url': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    skipSuccessfulRequests: false,
  },

  'POST:/api/driver/*/orders/*/update-status': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    skipSuccessfulRequests: true, // Allow frequent status updates
  },

  // General API fallback - very lenient
  'default': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    skipSuccessfulRequests: true,
  },
};

/**
 * In-memory rate limiting store
 * Note: This is reset on worker restart, which is acceptable for backup protection
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

class InMemoryRateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number; isNewWindow: boolean } {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now >= existing.resetTime) {
      // New window or expired entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now,
      };
      this.store.set(key, newEntry);
      return { count: 1, resetTime: newEntry.resetTime, isNewWindow: true };
    }

    // Increment existing entry
    existing.count++;
    this.store.set(key, existing);
    return { count: existing.count, resetTime: existing.resetTime, isNewWindow: false };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  size(): number {
    return this.store.size;
  }

  getStats(): { totalKeys: number; activeKeys: number; totalRequests: number } {
    const now = Date.now();
    let activeKeys = 0;
    let totalRequests = 0;
    
    for (const entry of this.store.values()) {
      totalRequests += entry.count;
      if (now < entry.resetTime) {
        activeKeys++;
      }
    }

    return {
      totalKeys: this.store.size,
      activeKeys,
      totalRequests,
    };
  }
}

// Export the class for testing
export { InMemoryRateLimitStore as RateLimitStore };

// Global store instance
const rateLimitStore = new InMemoryRateLimitStore();

/**
 * Generate a rate limiting key based on IP and endpoint pattern
 */
function generateRateLimitKey(c: Context<AppContext>, pattern: string): string {
  const ip = c.req.header('CF-Connecting-IP') || 
            c.req.header('X-Forwarded-For')?.split(',')[0] || 
            c.req.header('X-Real-IP') || 
            'unknown';
  
  return `${ip}:${pattern}`;
}

/**
 * Find the most specific rate limit configuration for a request
 */
function findRateLimitConfig(method: string, path: string): { pattern: string; config: RateLimitConfig } {
  // Try exact matches first
  const exactKey = `${method}:${path}`;
  if (RATE_LIMIT_CONFIGS[exactKey]) {
    return { pattern: exactKey, config: RATE_LIMIT_CONFIGS[exactKey] };
  }

  // Try pattern matches
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
    if (pattern === 'default') continue;

    const [patternMethod, patternPath] = pattern.split(':', 2);
    
    if (patternMethod === method) {
      // Convert pattern to regex (simple * wildcard support)
      const regexPattern = patternPath
        .replace(/\*/g, '[^/]+')
        .replace(/\//g, '\\/');
      
      const regex = new RegExp(`^${regexPattern}$`);
      
      if (regex.test(path)) {
        return { pattern, config };
      }
    }
  }

  // Fallback to default
  return { pattern: 'default', config: RATE_LIMIT_CONFIGS.default };
}

/**
 * Create a standardized rate limit exceeded response
 */
function createRateLimitResponse(
  config: RateLimitConfig,
  current: number,
  resetTime: number,
  pattern: string
): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  const response = {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`,
      details: {
        limit: config.maxRequests,
        current,
        windowMs: config.windowMs,
        retryAfter,
        pattern,
      },
    },
  };

  return new Response(JSON.stringify(response), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': retryAfter.toString(),
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, config.maxRequests - current).toString(),
      'X-RateLimit-Reset': Math.floor(resetTime / 1000).toString(),
    },
  });
}

/**
 * Application-level rate limiting middleware
 * Provides backup protection when WAF rules are bypassed or misconfigured
 */
export const rateLimitingMiddleware = () => {
  return async (c: Context<AppContext>, next: Next) => {
    const method = c.req.method;
    const path = new URL(c.req.url).pathname;
    
    // Skip rate limiting for non-API endpoints
    if (!path.startsWith('/api/')) {
      await next();
      return;
    }

    // Skip rate limiting in development environment
    if (c.env.WORKER_ENV === 'development') {
      console.log(`[Rate Limit] Skipping rate limiting in development for ${method} ${path}`);
      await next();
      return;
    }

    // Find appropriate rate limit configuration
    const { pattern, config } = findRateLimitConfig(method, path);
    
    // Generate rate limiting key
    const key = config.keyGenerator ? 
      config.keyGenerator(c) : 
      generateRateLimitKey(c, pattern);

    // Check current rate limit status
    const { count, resetTime } = rateLimitStore.increment(key, config.windowMs);

    // Add rate limit headers to response
    c.header('X-RateLimit-Limit', config.maxRequests.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, config.maxRequests - count).toString());
    c.header('X-RateLimit-Reset', Math.floor(resetTime / 1000).toString());

    // Check if limit exceeded
    if (count > config.maxRequests) {
      console.warn(`[Rate Limit] Limit exceeded for ${key}: ${count}/${config.maxRequests} (pattern: ${pattern})`);
      
      // Use custom response if provided
      if (config.onLimitReached) {
        const customResponse = await config.onLimitReached(c);
        return customResponse;
      }

      // Return standard rate limit response
      return createRateLimitResponse(config, count, resetTime, pattern);
    }

    // Log rate limiting activity (only for high usage)
    if (count > config.maxRequests * 0.8) {
      console.log(`[Rate Limit] High usage for ${key}: ${count}/${config.maxRequests} (pattern: ${pattern})`);
    }

    await next();

    // Handle skip conditions after response
    const status = c.res.status;
    
    if (config.skipSuccessfulRequests && status >= 200 && status < 400) {
      // Decrement count for successful requests if configured
      const entry = rateLimitStore.get(key);
      if (entry && entry.count > 0) {
        entry.count--;
        rateLimitStore.set(key, entry);
      }
    }

    if (config.skipFailedRequests && status >= 400) {
      // Decrement count for failed requests if configured
      const entry = rateLimitStore.get(key);
      if (entry && entry.count > 0) {
        entry.count--;
        rateLimitStore.set(key, entry);
      }
    }
  };
};

/**
 * Get current rate limiting statistics
 * Useful for monitoring and debugging
 */
export function getRateLimitStats(): {
  store: { totalKeys: number; activeKeys: number };
  configs: Record<string, { windowMs: number; maxRequests: number }>;
} {
  return {
    store: rateLimitStore.getStats(),
    configs: Object.fromEntries(
      Object.entries(RATE_LIMIT_CONFIGS).map(([pattern, config]) => [
        pattern,
        { windowMs: config.windowMs, maxRequests: config.maxRequests }
      ])
    ),
  };
}

/**
 * Create a custom rate limiting middleware for specific endpoints
 */
export function createCustomRateLimit(config: RateLimitConfig) {
  return async (c: Context<AppContext>, next: Next) => {
    const key = config.keyGenerator ? 
      config.keyGenerator(c) : 
      generateRateLimitKey(c, 'custom');

    const { count, resetTime } = rateLimitStore.increment(key, config.windowMs);

    if (count > config.maxRequests) {
      if (config.onLimitReached) {
        return await config.onLimitReached(c);
      }
      return createRateLimitResponse(config, count, resetTime, 'custom');
    }

    await next();
  };
}

/**
 * Rate limiting middleware specifically for testing endpoints
 * More restrictive to prevent abuse of test resources
 */
export const testEndpointRateLimit = createCustomRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  skipSuccessfulRequests: false,
  onLimitReached: (c) => {
    return c.json({
      success: false,
      error: {
        code: 'TEST_RATE_LIMIT_EXCEEDED',
        message: 'Test endpoint rate limit exceeded. Please wait before testing again.',
      },
    }, 429);
  },
});

/**
 * Create a custom rate limiting middleware with specific configuration
 */
export function createRateLimitMiddleware(config: Partial<RateLimitConfig> = {}) {
  const defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (c: Context) => {
      const ip = c.req.header('CF-Connecting-IP') || 
                c.req.header('X-Forwarded-For')?.split(',')[0] || 
                c.req.header('X-Real-IP') || 
                'unknown';
      return `${ip}:custom`;
    }
  };

  const finalConfig = { ...defaultConfig, ...config };

  return async (c: Context, next: Next) => {
    // Skip in development
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    const key = finalConfig.keyGenerator!(c);
    const result = rateLimitStore.increment(key, finalConfig.windowMs);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', finalConfig.maxRequests.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, finalConfig.maxRequests - result.count).toString());
    c.header('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

    if (result.count > finalConfig.maxRequests) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());

      return c.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: {
            limit: finalConfig.maxRequests,
            window: finalConfig.windowMs / 1000,
            retryAfter
          }
        }
      }, 429);
    }

    return next();
  };
} 