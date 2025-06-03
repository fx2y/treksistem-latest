import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimitStore, createRateLimitMiddleware, RATE_LIMIT_CONFIGS } from '../rate-limiting';

describe('RateLimitStore', () => {
  let store: RateLimitStore;

  beforeEach(() => {
    store = new RateLimitStore();
  });

  it('should initialize with empty store', () => {
    expect(store.size()).toBe(0);
  });

  it('should increment counter for new key', () => {
    const result = store.increment('test-key', 60000);
    expect(result.count).toBe(1);
    expect(result.resetTime).toBeGreaterThan(Date.now());
    expect(result.isNewWindow).toBe(true);
  });

  it('should increment existing counter', () => {
    store.increment('test-key', 60000);
    const result = store.increment('test-key', 60000);
    expect(result.count).toBe(2);
    expect(result.isNewWindow).toBe(false);
  });

  it('should reset counter after expiry', async () => {
    // Set a very short window
    store.increment('test-key', 1); // 1ms
    
    // Wait for expiry
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result = store.increment('test-key', 60000);
    expect(result.count).toBe(1);
    expect(result.isNewWindow).toBe(true);
  });

  it('should clean up expired entries', async () => {
    store.increment('key1', 1); // 1ms - will expire quickly
    store.increment('key2', 60000); // 1 minute - will not expire
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    store.cleanup();
    expect(store.size()).toBe(1);
  });

  it('should get statistics', () => {
    store.increment('key1', 60000);
    store.increment('key2', 60000);
    
    const stats = store.getStats();
    expect(stats.activeKeys).toBe(2);
    expect(stats.totalRequests).toBe(2);
    expect(stats.totalKeys).toBe(2);
  });

  it('should handle multiple increments on same key', () => {
    const key = 'multi-test';
    
    const result1 = store.increment(key, 60000);
    expect(result1.count).toBe(1);
    
    const result2 = store.increment(key, 60000);
    expect(result2.count).toBe(2);
    
    const result3 = store.increment(key, 60000);
    expect(result3.count).toBe(3);
    
    // All should have same reset time
    expect(result1.resetTime).toBe(result2.resetTime);
    expect(result2.resetTime).toBe(result3.resetTime);
  });
});

describe('Rate Limit Configurations', () => {
  it('should have proper configuration for order placement', () => {
    const config = RATE_LIMIT_CONFIGS['POST:/api/orders'];
    expect(config).toBeDefined();
    expect(config.maxRequests).toBe(10);
    expect(config.windowMs).toBe(60 * 1000); // 1 minute
    expect(config.skipSuccessfulRequests).toBe(false);
  });

  it('should have proper configuration for mitra profile creation', () => {
    const config = RATE_LIMIT_CONFIGS['POST:/api/mitra/profile'];
    expect(config).toBeDefined();
    expect(config.maxRequests).toBe(2);
    expect(config.windowMs).toBe(10 * 60 * 1000); // 10 minutes
  });

  it('should have proper configuration for driver upload URLs', () => {
    const config = RATE_LIMIT_CONFIGS['POST:/api/driver/*/orders/*/request-upload-url'];
    expect(config).toBeDefined();
    expect(config.maxRequests).toBe(20);
    expect(config.windowMs).toBe(60 * 1000); // 1 minute
  });

  it('should have default configuration', () => {
    const config = RATE_LIMIT_CONFIGS['default'];
    expect(config).toBeDefined();
    expect(config.maxRequests).toBe(100);
    expect(config.windowMs).toBe(60 * 1000); // 1 minute
    expect(config.skipSuccessfulRequests).toBe(true);
  });
});

describe('createRateLimitMiddleware', () => {
  it('should create middleware with default configuration', () => {
    const middleware = createRateLimitMiddleware();
    expect(typeof middleware).toBe('function');
  });

  it('should create middleware with custom configuration', () => {
    const middleware = createRateLimitMiddleware({
      windowMs: 30000, // 30 seconds
      maxRequests: 5,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    });
    expect(typeof middleware).toBe('function');
  });

  it('should create middleware with custom key generator', () => {
    const middleware = createRateLimitMiddleware({
      keyGenerator: () => 'fixed-key'
    });
    expect(typeof middleware).toBe('function');
  });
});

describe('Rate Limiting Logic', () => {
  it('should handle window expiration correctly', async () => {
    const store = new RateLimitStore();
    const key = 'expiry-test';
    
    // First request in window
    const result1 = store.increment(key, 5); // 5ms window
    expect(result1.count).toBe(1);
    expect(result1.isNewWindow).toBe(true);
    
    // Second request in same window
    const result2 = store.increment(key, 5);
    expect(result2.count).toBe(2);
    expect(result2.isNewWindow).toBe(false);
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Request after expiry should start new window
    const result3 = store.increment(key, 60000);
    expect(result3.count).toBe(1);
    expect(result3.isNewWindow).toBe(true);
  });

  it('should handle concurrent requests to same key', () => {
    const store = new RateLimitStore();
    const key = 'concurrent-test';
    
    // Simulate concurrent requests
    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(store.increment(key, 60000));
    }
    
    // All requests should increment the same counter
    expect(results[0].count).toBe(1);
    expect(results[1].count).toBe(2);
    expect(results[2].count).toBe(3);
    expect(results[3].count).toBe(4);
    expect(results[4].count).toBe(5);
    
    // All should have the same reset time
    const resetTime = results[0].resetTime;
    results.forEach(result => {
      expect(result.resetTime).toBe(resetTime);
    });
  });

  it('should handle different keys independently', () => {
    const store = new RateLimitStore();
    
    const result1 = store.increment('key1', 60000);
    const result2 = store.increment('key2', 60000);
    const result3 = store.increment('key1', 60000);
    
    expect(result1.count).toBe(1);
    expect(result2.count).toBe(1);
    expect(result3.count).toBe(2);
    
    expect(store.size()).toBe(2);
  });
}); 