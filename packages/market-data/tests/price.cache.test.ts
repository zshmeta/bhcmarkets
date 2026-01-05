/**
 * Price Cache Tests
 * =================
 *
 * Tests for the Redis-backed price cache.
 * These tests use the in-memory fallback when Redis is not available.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PriceCache } from '../src/domains/cache/price.cache.js';
import type { EnrichedTick } from '../src/domains/normalizer/normalizer.types.js';

describe('PriceCache', () => {
  let cache: PriceCache;

  beforeEach(() => {
    cache = new PriceCache();
  });

  /**
   * Helper to create a mock enriched tick.
   */
  function createTick(overrides: Partial<EnrichedTick> = {}): EnrichedTick {
    return {
      symbol: 'BTC/USD',
      last: 50000,
      bid: 49999,
      ask: 50001,
      mid: 50000,
      spread: 2,
      spreadPercent: 0.004,
      volume: 100,
      timestamp: Date.now(),
      source: 'binance',
      kind: 'crypto',
      name: 'Bitcoin',
      priceFormatted: '$50,000.00',
      ...overrides,
    };
  }

  describe('set and get', () => {
    it('should store and retrieve a price', async () => {
      const tick = createTick({ symbol: 'BTC/USD', last: 50000 });
      await cache.set(tick);

      const retrieved = await cache.get('BTC/USD');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.last).toBe(50000);
      expect(retrieved?.symbol).toBe('BTC/USD');
    });

    it('should return null for unknown symbol', async () => {
      const result = await cache.get('UNKNOWN/PAIR');
      expect(result).toBeNull();
    });

    it('should overwrite existing price', async () => {
      await cache.set(createTick({ symbol: 'BTC/USD', last: 50000 }));
      await cache.set(createTick({ symbol: 'BTC/USD', last: 51000 }));

      const retrieved = await cache.get('BTC/USD');
      expect(retrieved?.last).toBe(51000);
    });
  });

  describe('getMany', () => {
    it('should retrieve multiple prices at once', async () => {
      await cache.set(createTick({ symbol: 'BTC/USD', last: 50000 }));
      await cache.set(createTick({ symbol: 'ETH/USD', last: 3000 }));
      await cache.set(createTick({ symbol: 'SOL/USD', last: 100 }));

      const prices = await cache.getMany(['BTC/USD', 'ETH/USD', 'SOL/USD']);

      expect(prices.size).toBe(3);
      expect(prices.get('BTC/USD')?.last).toBe(50000);
      expect(prices.get('ETH/USD')?.last).toBe(3000);
      expect(prices.get('SOL/USD')?.last).toBe(100);
    });

    it('should skip missing symbols', async () => {
      await cache.set(createTick({ symbol: 'BTC/USD', last: 50000 }));

      const prices = await cache.getMany(['BTC/USD', 'MISSING/USD']);

      expect(prices.size).toBe(1);
      expect(prices.has('BTC/USD')).toBe(true);
      expect(prices.has('MISSING/USD')).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should track cache hits and misses', async () => {
      await cache.set(createTick({ symbol: 'BTC/USD' }));

      await cache.get('BTC/USD'); // Hit
      await cache.get('BTC/USD'); // Hit
      await cache.get('MISSING/USD'); // Miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
    });
  });
});
