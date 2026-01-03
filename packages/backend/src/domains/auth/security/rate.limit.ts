/**
 * Rate Limiting Service.
 * 
 * Implements rate limiting for auth operations to prevent abuse.
 * Uses in-memory storage by default, can be extended to use Redis.
 */

import type { RateLimitPolicy } from "../core/auth.policies.js";
import { AuthError } from "../core/auth.errors.js";

/**
 * Rate limit bucket for tracking attempts.
 */
interface RateLimitBucket {
  /** Number of attempts made */
  attempts: number;
  
  /** Timestamp of first attempt in current window */
  windowStart: number;
  
  /** Timestamp when bucket expires */
  expiresAt: number;
}

/**
 * Rate limiter implementation.
 * Tracks attempts per key (IP address, user ID, session ID, etc.)
 */
export class RateLimiter {
  // In-memory storage for rate limit buckets
  // In production, this should use Redis for distributed rate limiting
  private readonly buckets = new Map<string, RateLimitBucket>();
  
  // Cleanup interval
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private readonly policy: RateLimitPolicy) {
    // Start cleanup interval to remove expired buckets
    this.startCleanup();
  }

  /**
   * Check if an operation is rate limited.
   * Throws AuthError if rate limit is exceeded.
   * 
   * @param key - Unique identifier for the rate limit (e.g., "login:192.168.1.1")
   * @param operation - Type of operation (login, register, reset, refresh)
   */
  async check(key: string, operation: keyof Omit<RateLimitPolicy, "enabled">): Promise<void> {
    if (!this.policy.enabled) {
      return; // Rate limiting disabled
    }

    const config = this.policy[operation];
    if (!config) {
      return; // No configuration for this operation
    }

    const now = Date.now();
    const bucket = this.buckets.get(key);

    // Create new bucket if none exists or window has expired
    if (!bucket || now > bucket.expiresAt) {
      this.buckets.set(key, {
        attempts: 1,
        windowStart: now,
        expiresAt: now + config.windowSeconds * 1000,
      });
      return;
    }

    // Check if we're still in the same window
    const windowAge = now - bucket.windowStart;
    if (windowAge > config.windowSeconds * 1000) {
      // Window has expired, reset
      this.buckets.set(key, {
        attempts: 1,
        windowStart: now,
        expiresAt: now + config.windowSeconds * 1000,
      });
      return;
    }

    // Increment attempts
    bucket.attempts++;

    // Check if limit is exceeded
    if (bucket.attempts > config.maxAttempts) {
      const remainingSeconds = Math.ceil((bucket.expiresAt - now) / 1000);
      throw new AuthError(
        "RATE_LIMIT_EXCEEDED",
        `Too many attempts. Please try again in ${remainingSeconds} seconds.`,
        {
          retryAfter: remainingSeconds,
          attempts: bucket.attempts,
          maxAttempts: config.maxAttempts,
        }
      );
    }
  }

  /**
   * Record an attempt without checking the limit.
   * Useful for tracking attempts even if they succeeded.
   */
  async record(key: string, operation: keyof Omit<RateLimitPolicy, "enabled">): Promise<void> {
    if (!this.policy.enabled) {
      return;
    }

    const config = this.policy[operation];
    if (!config) {
      return;
    }

    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || now > bucket.expiresAt) {
      this.buckets.set(key, {
        attempts: 1,
        windowStart: now,
        expiresAt: now + config.windowSeconds * 1000,
      });
    } else {
      bucket.attempts++;
    }
  }

  /**
   * Reset rate limit for a key.
   * Useful after successful authentication to clear failed attempts.
   */
  async reset(key: string): Promise<void> {
    this.buckets.delete(key);
  }

  /**
   * Get current attempt count for a key.
   */
  async getAttempts(key: string): Promise<number> {
    const bucket = this.buckets.get(key);
    if (!bucket || Date.now() > bucket.expiresAt) {
      return 0;
    }
    return bucket.attempts;
  }

  /**
   * Get remaining attempts before rate limit is hit.
   */
  async getRemainingAttempts(
    key: string,
    operation: keyof Omit<RateLimitPolicy, "enabled">
  ): Promise<number> {
    const config = this.policy[operation];
    if (!config) {
      return Infinity;
    }

    const attempts = await this.getAttempts(key);
    return Math.max(0, config.maxAttempts - attempts);
  }

  /**
   * Start cleanup interval to remove expired buckets.
   */
  private startCleanup(): void {
    // Clean up every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.buckets.entries()) {
        if (now > bucket.expiresAt) {
          this.buckets.delete(key);
        }
      }
    }, 60 * 1000);

    // Don't prevent Node from exiting
    this.cleanupInterval.unref();
  }

  /**
   * Stop cleanup interval and clear all buckets.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.buckets.clear();
  }
}

/**
 * Factory function to create a rate limiter.
 */
export function createRateLimiter(policy: RateLimitPolicy): RateLimiter {
  return new RateLimiter(policy);
}

/**
 * Generate rate limit key for login attempts.
 */
export function getLoginRateLimitKey(ipAddress: string): string {
  return `login:${ipAddress}`;
}

/**
 * Generate rate limit key for registration attempts.
 */
export function getRegistrationRateLimitKey(ipAddress: string): string {
  return `register:${ipAddress}`;
}

/**
 * Generate rate limit key for password reset attempts.
 */
export function getResetRateLimitKey(ipAddress: string): string {
  return `reset:${ipAddress}`;
}

/**
 * Generate rate limit key for refresh attempts.
 */
export function getRefreshRateLimitKey(sessionId: string): string {
  return `refresh:${sessionId}`;
}
