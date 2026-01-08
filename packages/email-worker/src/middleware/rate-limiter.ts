/**
 * Rate Limiter
 * Simple rate limiting using Cloudflare KV (optional)
 */

import type { EmailWorkerEnv, RateLimitConfig, RateLimitResult } from '../types';

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,  // Max requests per window
  windowMs: 60000,   // 1 minute window
};

/**
 * Check rate limit for a given key
 * Uses KV storage if available, otherwise allows all requests
 */
export async function checkRateLimit(
  key: string,
  env: EmailWorkerEnv,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  // If no KV binding, allow all requests
  if (!env.RATE_LIMIT_KV) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
    };
  }

  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / config.windowMs)}`;

  try {
    // Get current count
    const currentCount = await env.RATE_LIMIT_KV.get(windowKey);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    if (count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: (Math.floor(now / config.windowMs) + 1) * config.windowMs,
      };
    }

    // Increment count
    await env.RATE_LIMIT_KV.put(windowKey, String(count + 1), {
      expirationTtl: Math.ceil(config.windowMs / 1000) + 60, // Add buffer
    });

    return {
      allowed: true,
      remaining: config.maxRequests - count - 1,
      resetAt: (Math.floor(now / config.windowMs) + 1) * config.windowMs,
    };
  } catch (error) {
    // On KV error, allow the request but log
    console.error('Rate limit check failed:', error);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
    };
  }
}

/**
 * Extract rate limit key from request
 * Uses API key hash or IP address
 */
export function getRateLimitKey(request: Request): string {
  // Prefer API key for rate limiting
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey) {
    // Hash the API key for privacy
    return `apikey:${simpleHash(apiKey)}`;
  }

  // Fall back to IP address
  const cfConnectingIp = request.headers.get('CF-Connecting-IP');
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  const ip = cfConnectingIp || xForwardedFor?.split(',')[0]?.trim() || 'unknown';

  return `ip:${ip}`;
}

/**
 * Simple hash function for rate limit keys
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
