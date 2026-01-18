/**
 * Binance Collector Tests
 * =======================
 *
 * Tests for the Binance WebSocket collector.
 *
 * NOTE: These tests connect to the real Binance WebSocket.
 * They are excluded from the default test run and should be
 * run manually or in integration test mode.
 *
 * TO RUN:
 * - npx vitest run tests/binance.collector.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BinanceCollector } from '../src/domains/collectors/binance.collector.js';

describe('BinanceCollector', () => {
  let collector: BinanceCollector;

  beforeEach(() => {
    collector = new BinanceCollector();
  });

  afterEach(async () => {
    await collector.stop();
  });

  describe('initialization', () => {
    it('should have correct name', () => {
      expect(collector.name).toBe('binance');
    });

    it('should start in disconnected state', () => {
      const health = collector.getHealth();
      expect(health.state).toBe('disconnected');
    });

    it('should support crypto asset kind', () => {
      expect(collector.supportedKinds).toContain('crypto');
    });
  });

  describe('tick emission', () => {
    it('should emit ticks when connected', async () => {
      const ticks: unknown[] = [];
      collector.onTick((tick) => ticks.push(tick));

      // Start collector (this will connect to Binance)
      await collector.start();

      // Subscribe to symbols
      await collector.subscribe(['BTC/USD', 'ETH/USD']);

      // Wait for some ticks (Binance sends data quickly)
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Should have received some ticks
      expect(ticks.length).toBeGreaterThan(0);

      // Verify tick structure
      const tick = ticks[0] as Record<string, unknown>;
      expect(tick).toHaveProperty('symbol');
      expect(tick).toHaveProperty('last');
      expect(tick).toHaveProperty('timestamp');
      expect(tick).toHaveProperty('source');
      expect(tick.source).toBe('binance');
    }, 10000); // 10 second timeout

    it('should normalize symbol names', async () => {
      const ticks: Array<{ symbol: string }> = [];
      collector.onTick((tick) => ticks.push(tick as { symbol: string }));

      await collector.start();
      await collector.subscribe(['BTC/USD', 'ETH/USD']);
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Symbols should be in our internal format (BTC/USD not BTCUSD)
      const symbols = new Set(ticks.map((t) => t.symbol));
      for (const symbol of symbols) {
        expect(symbol).toMatch(/^[A-Z]+\/[A-Z]+$/);
      }
    }, 10000);
  });

  describe('state management', () => {
    it('should track connection state', async () => {
      expect(collector.getHealth().state).toBe('disconnected');

      await collector.start();
      // Give it time to connect
      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(collector.getHealth().state).toBe('connected');

      await collector.stop();
      expect(collector.getHealth().state).toBe('stopped');
    }, 10000);

    it('should emit state change events', async () => {
      const stateChanges: Array<{ from: string; to: string }> = [];
      collector.onStateChange((state, prevState) => {
        stateChanges.push({ from: prevState, to: state });
      });

      await collector.start();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await collector.stop();

      expect(stateChanges.length).toBeGreaterThan(0);
      expect(stateChanges.some((c) => c.to === 'connected')).toBe(true);
      expect(stateChanges.some((c) => c.to === 'stopped')).toBe(true);
    }, 10000);
  });

  describe('health reporting', () => {
    it('should report health metrics', async () => {
      await collector.start();
      await collector.subscribe(['BTC/USD']);
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const health = collector.getHealth();

      expect(health.name).toBe('binance');
      expect(health.state).toBe('connected');
      expect(health.subscribedSymbols).toBe(1);
      expect(health.ticksPerMinute).toBeGreaterThanOrEqual(0);
      expect(health.circuitBreakerOpen).toBe(false);
    }, 10000);
  });
});
