/**
 * Normalizer Service Tests
 * ========================
 *
 * Unit tests for tick normalization and enrichment.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NormalizerService } from '../src/domains/normalizer/normalizer.service.js';
import type { NormalizedTick } from '../src/domains/collectors/collector.types.js';

describe('NormalizerService', () => {
  let normalizer: NormalizerService;

  beforeEach(() => {
    normalizer = new NormalizerService();
  });

  /**
   * Helper to create a raw tick.
   */
  function createRawTick(overrides: Partial<NormalizedTick> = {}): NormalizedTick {
    return {
      symbol: 'BTC/USD',
      last: 50000,
      bid: 49990,
      ask: 50010,
      volume: 100,
      timestamp: Date.now(),
      source: 'binance',
      ...overrides,
    };
  }

  describe('process', () => {
    it('should enrich tick with computed fields', () => {
      const tick = createRawTick({
        bid: 49990,
        ask: 50010,
      });

      const enriched = normalizer.process(tick);

      expect(enriched).not.toBeNull();
      expect(enriched?.mid).toBe(50000); // (49990 + 50010) / 2
      expect(enriched?.spread).toBe(20); // 50010 - 49990
      expect(enriched?.spreadPercent).toBeCloseTo(0.04, 2); // (20 / 50000) * 100
    });

    it('should add receivedAt timestamp', () => {
      const tick = createRawTick();
      const before = Date.now();
      const enriched = normalizer.process(tick);
      const after = Date.now();

      expect(enriched?.receivedAt).toBeGreaterThanOrEqual(before);
      expect(enriched?.receivedAt).toBeLessThanOrEqual(after);
    });

    it('should reject invalid ticks', () => {
      // Negative price
      const invalidTick = createRawTick({ last: -100 });
      const result = normalizer.process(invalidTick);
      expect(result).toBeNull();
    });

    it('should deduplicate identical ticks', () => {
      const tick1 = createRawTick({ timestamp: 1000 });
      const tick2 = createRawTick({ timestamp: 1000 }); // Same timestamp

      const result1 = normalizer.process(tick1);
      const result2 = normalizer.process(tick2);

      expect(result1).not.toBeNull();
      expect(result2).toBeNull(); // Should be deduplicated
    });

    it('should allow different timestamps for same symbol', () => {
      const tick1 = createRawTick({ timestamp: 1000 });
      const tick2 = createRawTick({ timestamp: 2000 });

      const result1 = normalizer.process(tick1);
      const result2 = normalizer.process(tick2);

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
    });
  });

  describe('getStats', () => {
    it('should track processed tick count', () => {
      normalizer.process(createRawTick({ timestamp: 1 }));
      normalizer.process(createRawTick({ timestamp: 2 }));
      normalizer.process(createRawTick({ timestamp: 3 }));

      const stats = normalizer.getStats();
      expect(stats.processed).toBe(3);
    });

    it('should track deduplicated count', () => {
      normalizer.process(createRawTick({ timestamp: 1 }));
      normalizer.process(createRawTick({ timestamp: 1 })); // Duplicate
      normalizer.process(createRawTick({ timestamp: 1 })); // Duplicate

      const stats = normalizer.getStats();
      expect(stats.processed).toBe(1);
      expect(stats.deduplicated).toBe(2);
    });
  });
});
