/**
 * Price Cache
 * ===========
 *
 * Redis-backed cache for latest prices with automatic expiration.
 *
 * CACHING STRATEGY:
 * - Each symbol gets its own key: "price:BTC/USD"
 * - TTL of 30 seconds ensures stale data is automatically removed
 * - Snapshot endpoint returns all prices from cache
 * - If price is missing from cache, it's not returned (no stale data)
 *
 * WHY NOT CACHE FOREVER:
 * Market data has limited value over time. A 30-second-old price
 * is still useful for display, but a 5-minute-old price could
 * mislead users. The TTL ensures we never serve truly stale data.
 */

import { getRedisClient, isRedisConnected, isUsingFallback } from './redis.client.js';
import { ALL_SYMBOLS } from '../../config/symbols.js';
import { logger } from '../../utils/logger.js';
import type { EnrichedTick } from '../normalizer/normalizer.types.js';
import type { CachedPrice, PriceSnapshot, CacheStats } from './cache.types.js';

const log = logger.child({ component: 'price-cache' });

/** Redis key prefix for prices */
const PRICE_PREFIX = 'price:';

/** TTL for cached prices in seconds */
const PRICE_TTL_SECONDS = 30;

/** Redis channel for price updates (pub/sub) */
const PRICE_CHANNEL = 'market:prices';

/**
 * Price cache service.
 */
export class PriceCache {
  /** Track cache hits/misses for monitoring */
  private hits = 0;
  private misses = 0;

  constructor() {
    // Reset counters every minute
    setInterval(() => {
      this.hits = 0;
      this.misses = 0;
    }, 60000);
  }

  /**
   * Store a price tick in cache.
   * Also publishes to Redis pub/sub for real-time distribution.
   *
   * @param tick - Enriched tick to cache
   */
  async set(tick: EnrichedTick): Promise<void> {
    const redis = await getRedisClient();
    const key = PRICE_PREFIX + tick.symbol;

    const cached: CachedPrice = {
      symbol: tick.symbol,
      last: tick.last,
      bid: tick.bid,
      ask: tick.ask,
      mid: tick.mid,
      volume: tick.volume,
      changePercent: tick.changePercent,
      timestamp: tick.timestamp,
      source: tick.source,
      kind: tick.kind,
      name: tick.name,
      cachedAt: Date.now(),
    };

    // Store with TTL
    await redis.set(key, JSON.stringify(cached), 'EX', PRICE_TTL_SECONDS);

    // Publish update for subscribers (other services, WebSocket server)
    await redis.publish(PRICE_CHANNEL, JSON.stringify(cached));
  }

  /**
   * Get cached price for a single symbol.
   *
   * @param symbol - Internal symbol (e.g., "BTC/USD")
   * @returns Cached price or null if not found/expired
   */
  async get(symbol: string): Promise<CachedPrice | null> {
    const redis = await getRedisClient();
    const key = PRICE_PREFIX + symbol;

    const data = await redis.get(key);

    if (data) {
      this.hits++;
      return JSON.parse(data) as CachedPrice;
    }

    this.misses++;
    return null;
  }

  /**
   * Get cached prices for multiple symbols.
   *
   * @param symbols - Array of internal symbols
   * @returns Map of symbol to cached price (missing symbols not included)
   */
  async getMany(symbols: string[]): Promise<Map<string, CachedPrice>> {
    const redis = await getRedisClient();
    const keys = symbols.map(s => PRICE_PREFIX + s);

    const values = await redis.mget(...keys);
    const result = new Map<string, CachedPrice>();

    for (let i = 0; i < symbols.length; i++) {
      const value = values[i];
      const symbol = symbols[i];
      if (value && symbol) {
        this.hits++;
        result.set(symbol, JSON.parse(value) as CachedPrice);
      } else {
        this.misses++;
      }
    }

    return result;
  }

  /**
   * Get full snapshot of all cached prices.
   * This is what the REST API returns for /prices endpoint.
   */
  async getSnapshot(): Promise<PriceSnapshot> {
    const symbols = ALL_SYMBOLS.map(s => s.symbol);
    const prices = await this.getMany(symbols);

    const priceRecord: Record<string, CachedPrice> = {};
    for (const [symbol, price] of prices) {
      priceRecord[symbol] = price;
    }

    return {
      timestamp: Date.now(),
      prices: priceRecord,
      count: prices.size,
    };
  }

  /**
   * Delete a price from cache.
   */
  async delete(symbol: string): Promise<void> {
    const redis = await getRedisClient();
    await redis.del(PRICE_PREFIX + symbol);
  }

  /**
   * Clear all prices from cache.
   */
  async clear(): Promise<void> {
    const redis = await getRedisClient();
    const keys = await redis.keys(PRICE_PREFIX + '*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    log.info({ count: keys.length }, 'Cleared price cache');
  }

  /**
   * Get cache statistics for monitoring.
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      keyCount: ALL_SYMBOLS.length, // Approximate
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
      redisConnected: isRedisConnected(),
      usingFallback: isUsingFallback(),
    };
  }

  /**
   * Subscribe to price updates via Redis pub/sub.
   * Use this to receive updates from other services.
   *
   * @param callback - Called when a price update is published
   */
  async subscribe(callback: (price: CachedPrice) => void): Promise<void> {
    const redis = await getRedisClient();
    await redis.subscribe(PRICE_CHANNEL);

    redis.on('message', (channel: string, message: string) => {
      if (channel === PRICE_CHANNEL) {
        try {
          const price = JSON.parse(message) as CachedPrice;
          callback(price);
        } catch (error) {
          log.error({ error }, 'Failed to parse pub/sub message');
        }
      }
    });

    log.info('Subscribed to price updates');
  }
}
