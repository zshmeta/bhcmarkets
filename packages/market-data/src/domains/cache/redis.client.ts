/**
 * Redis Client
 * ============
 *
 * Redis connection management with in-memory fallback for development.
 *
 * WHY REDIS:
 * - Sub-millisecond reads for price lookups
 * - Built-in TTL for automatic expiration
 * - Pub/Sub for distributing updates across instances
 * - Persistence options for recovery
 *
 * FALLBACK STRATEGY:
 * In development without Redis, we use an in-memory Map.
 * This lets you run the service without external dependencies,
 * but obviously doesn't persist or scale.
 */

import { Redis } from 'ioredis';
import { env, isDev } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const log = logger.child({ component: 'redis-client' });

/**
 * Interface matching the Redis methods we use.
 * This allows us to create a compatible in-memory fallback.
 */
export interface IRedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  mget(...keys: string[]): Promise<(string | null)[]>;
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string): Promise<number>;
  on(event: string, callback: (...args: any[]) => void): void;
  quit(): Promise<string>;
  ping(): Promise<string>;
}

/**
 * In-memory cache implementation that mimics Redis.
 * Used when Redis is not available (development mode).
 *
 * LIMITATIONS:
 * - No persistence (data lost on restart)
 * - No pub/sub across processes
 * - No TTL enforcement (items never expire)
 * - Single-process only
 */
class InMemoryCache implements IRedisLike {
  private data = new Map<string, { value: string; expiresAt?: number }>();
  private subscribers = new Map<string, Set<(message: string) => void>>();
  private eventHandlers = new Map<string, ((...args: any[]) => void)[]>();

  async get(key: string): Promise<string | null> {
    const entry = this.data.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.data.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string | null> {
    const entry: { value: string; expiresAt?: number } = { value };

    // Handle EX (seconds) expiration
    if (mode === 'EX' && duration) {
      entry.expiresAt = Date.now() + duration * 1000;
    }
    // Handle PX (milliseconds) expiration
    else if (mode === 'PX' && duration) {
      entry.expiresAt = Date.now() + duration;
    }

    this.data.set(key, entry);
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.data.delete(key)) deleted++;
    }
    return deleted;
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple glob matching (only supports * wildcard)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.data.keys()).filter(k => regex.test(k));
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map(k => this.get(k)));
  }

  async publish(channel: string, message: string): Promise<number> {
    const subs = this.subscribers.get(channel);
    if (subs) {
      subs.forEach(cb => cb(message));
      return subs.size;
    }
    return 0;
  }

  async subscribe(channel: string): Promise<number> {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    return 1;
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);

    // Simulate 'message' events for subscribers
    if (event === 'message') {
      this.subscribers.forEach((subs, channel) => {
        subs.add((msg: string) => callback(channel, msg));
      });
    }
  }

  async quit(): Promise<string> {
    this.data.clear();
    this.subscribers.clear();
    return 'OK';
  }

  async ping(): Promise<string> {
    return 'PONG';
  }
}

/**
 * Redis client singleton.
 * Automatically falls back to in-memory cache if Redis is unavailable.
 */
let redisClient: IRedisLike | null = null;
let isConnected = false;
let usingFallback = false;

/**
 * Get or create the Redis client.
 */
export async function getRedisClient(): Promise<IRedisLike> {
  if (redisClient) return redisClient;

  // If no Redis URL configured, use in-memory fallback
  if (!env.REDIS_URL) {
    log.warn('No REDIS_URL configured, using in-memory cache');
    redisClient = new InMemoryCache();
    usingFallback = true;
    isConnected = true;
    return redisClient;
  }

  // Try to connect to Redis
  try {
    const redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          log.warn('Redis connection failed, falling back to in-memory cache');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    // Set up event handlers
    redis.on('connect', () => {
      log.info('Redis connected');
      isConnected = true;
    });

    redis.on('error', (err: Error) => {
      log.error({ error: err.message }, 'Redis error');
    });

    redis.on('close', () => {
      log.warn('Redis connection closed');
      isConnected = false;
    });

    // Try to connect
    await redis.connect();
    await redis.ping();

    redisClient = redis as unknown as IRedisLike;
    usingFallback = false;
    log.info('Redis client initialized');

    return redisClient!;
  } catch (error) {
    log.warn({ error }, 'Failed to connect to Redis, using in-memory fallback');
    redisClient = new InMemoryCache();
    usingFallback = true;
    isConnected = true;
    return redisClient;
  }
}

/**
 * Check if Redis is connected.
 */
export function isRedisConnected(): boolean {
  return isConnected;
}

/**
 * Check if using in-memory fallback.
 */
export function isUsingFallback(): boolean {
  return usingFallback;
}

/**
 * Close Redis connection.
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
  }
}
