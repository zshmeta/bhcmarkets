/**
 * Redis Client
 * ============
 *
 * Centralized Redis connection for pub/sub and caching.
 * Includes in-memory fallback for development without Redis.
 *
 * USAGE:
 * ```typescript
 * import { getRedis, publish, subscribe, redisGet, redisSet } from '@repo/database';
 *
 * // Pub/sub
 * await publish('orders', JSON.stringify(order));
 * subscribe('orders', (msg) => handleOrder(JSON.parse(msg)));
 *
 * // Key-value
 * await redisSet('price:BTCUSD', '50000', 60); // 60s TTL
 * const price = await redisGet('price:BTCUSD');
 * ```
 */

import { Redis } from 'ioredis';

// =============================================================================
// STATE
// =============================================================================

let redis: Redis | null = null;
let pubClient: Redis | null = null;
let subClient: Redis | null = null;
let usingFallback = false;

// In-memory fallback for development without Redis
const memoryStore = new Map<string, string>();
const memoryChannels = new Map<string, Set<(message: string) => void>>();

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface RedisConfig {
  url?: string;
  requireInProduction?: boolean;
}

function getRedisUrl(): string | undefined {
  return process.env.REDIS_URL;
}

function isDev(): boolean {
  return process.env.NODE_ENV !== 'production';
}

// =============================================================================
// CONNECTION MANAGEMENT
// =============================================================================

/**
 * Get Redis client.
 * Returns null in dev if REDIS_URL is not set (uses fallback).
 * Throws in production if REDIS_URL is not set.
 */
export function getRedis(): Redis | null {
  const url = getRedisUrl();

  if (!url) {
    if (isDev()) {
      usingFallback = true;
      return null;
    }
    throw new Error('REDIS_URL is required in production');
  }

  if (!redis) {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
    });

    redis.on('error', (err) => {
      console.error('[redis] Connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('[redis] Connected');
    });
  }

  return redis;
}

/**
 * Get pub/sub clients.
 */
export function getPubSub(): { pub: Redis | null; sub: Redis | null } {
  const url = getRedisUrl();

  if (!url) {
    return { pub: null, sub: null };
  }

  if (!pubClient) {
    pubClient = new Redis(url);
    pubClient.on('error', (err) => {
      console.error('[redis:pub] Error:', err.message);
    });
  }

  if (!subClient) {
    subClient = new Redis(url);
    subClient.on('error', (err) => {
      console.error('[redis:sub] Error:', err.message);
    });
  }

  return { pub: pubClient, sub: subClient };
}

/**
 * Check if using fallback memory store.
 */
export function isUsingFallback(): boolean {
  return usingFallback;
}

/**
 * Check if Redis is connected.
 */
export function isRedisConnected(): boolean {
  return redis?.status === 'ready';
}

/**
 * Close all Redis connections.
 */
export async function closeRedis(): Promise<void> {
  const promises: Promise<void>[] = [];

  if (redis) {
    promises.push(redis.quit().then(() => { redis = null; }));
  }
  if (pubClient) {
    promises.push(pubClient.quit().then(() => { pubClient = null; }));
  }
  if (subClient) {
    promises.push(subClient.quit().then(() => { subClient = null; }));
  }

  await Promise.all(promises);
  console.log('[redis] Connections closed');
}

// =============================================================================
// KEY-VALUE OPERATIONS (with fallback)
// =============================================================================

export async function redisGet(key: string): Promise<string | null> {
  const r = getRedis();
  if (r) {
    return r.get(key);
  }
  return memoryStore.get(key) || null;
}

export async function redisSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const r = getRedis();
  if (r) {
    if (ttlSeconds) {
      await r.setex(key, ttlSeconds, value);
    } else {
      await r.set(key, value);
    }
    return;
  }
  memoryStore.set(key, value);
}

export async function redisDel(key: string): Promise<void> {
  const r = getRedis();
  if (r) {
    await r.del(key);
    return;
  }
  memoryStore.delete(key);
}

// =============================================================================
// PUB/SUB OPERATIONS (with fallback)
// =============================================================================

export async function publish(channel: string, message: string): Promise<void> {
  const { pub } = getPubSub();
  if (pub) {
    await pub.publish(channel, message);
    return;
  }

  // Fallback: local pub/sub
  const handlers = memoryChannels.get(channel);
  if (handlers) {
    handlers.forEach((handler) => handler(message));
  }
}

export function subscribe(
  channel: string,
  handler: (message: string) => void
): () => void {
  const { sub } = getPubSub();

  if (sub) {
    sub.subscribe(channel);
    sub.on('message', (ch, msg) => {
      if (ch === channel) handler(msg);
    });

    return () => {
      sub.unsubscribe(channel);
    };
  }

  // Fallback: local pub/sub
  if (!memoryChannels.has(channel)) {
    memoryChannels.set(channel, new Set());
  }
  memoryChannels.get(channel)!.add(handler);

  return () => {
    memoryChannels.get(channel)?.delete(handler);
  };
}
