/**
 * Cache Types
 * ===========
 *
 * Types for the caching layer.
 */

import type { EnrichedTick } from '../normalizer/normalizer.types.js';

/**
 * Cached price snapshot for a single symbol.
 * This is what gets stored in Redis and returned to clients.
 */
export interface CachedPrice {
  symbol: string;
  last: number;
  bid?: number;
  ask?: number;
  mid: number;
  volume?: number;
  changePercent?: number;
  timestamp: number;
  source: string;
  kind: string;
  name: string;

  /** When this cache entry was created/updated */
  cachedAt: number;
}

/**
 * Full price snapshot across all symbols.
 */
export interface PriceSnapshot {
  /** Unix timestamp when snapshot was taken */
  timestamp: number;

  /** All cached prices, keyed by symbol */
  prices: Record<string, CachedPrice>;

  /** Number of symbols in snapshot */
  count: number;
}

/**
 * Cache statistics for monitoring.
 */
export interface CacheStats {
  /** Number of keys in cache */
  keyCount: number;

  /** Cache hits in last minute */
  hits: number;

  /** Cache misses in last minute */
  misses: number;

  /** Hit rate percentage */
  hitRate: number;

  /** Whether Redis is connected */
  redisConnected: boolean;

  /** Using in-memory fallback? */
  usingFallback: boolean;
}
