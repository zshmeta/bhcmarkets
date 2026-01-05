/**
 * Binance Collector Tests
 * =======================
 *
 * Tests for the Binance WebSocket collector.
 *
 * TO RUN:
 * - Start the service: npm run dev
 * - Or run isolated: npx vitest run tests/collectors/binance.collector.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
      expect(collector.getName()).toBe('binance');
    });

    it('should start in disconnected state', () => {
      const health = collector.getHealth();
      expect(health.state).toBe('disconnected');
    });

    it('should have supported symbols', () => {
      const symbols = collector.getSupportedSymbols();
      expect(symbols.length).toBeGreaterThan(0);
      expect(symbols).toContain('BTC/USD');
      expect(symbols).toContain('ETH/USD');
    });
  });

  describe('tick emission', () => {
    it('should emit ticks when connected', async () => {
      const ticks: any[] = [];
      collector.onTick((tick) => ticks.push(tick));

      // Start collector (this will connect to Binance)
      await collector.start();

      // Wait for some ticks (Binance sends data quickly)
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Should have received some ticks
      expect(ticks.length).toBeGreaterThan(0);

      // Verify tick structure
      const tick = ticks[0];
      expect(tick).toHaveProperty('symbol');
      expect(tick).toHaveProperty('last');
      expect(tick).toHaveProperty('bid');
      expect(tick).toHaveProperty('ask');
      expect(tick).toHaveProperty('timestamp');
    }, 10000); // 10 second timeout

    it('should normalize symbol names', async () => {
      const ticks: any[] = [];
      collector.onTick((tick) => ticks.push(tick));

      await collector.start();
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Symbols should be in our internal format (BTC/USD not BTCUSDT)
      const symbols = new Set(ticks.map((t) => t.symbol));
      for (const symbol of symbols) {
        expect(symbol).toMatch(/^[A-Z]+\/[A-Z]+$/);
      }
    }, 10000);
  });

  describe('reconnection', () => {
    it('should track connection state', async () => {
      expect(collector.getHealth().state).toBe('disconnected');

      await collector.start();
      // Give it time to connect
      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(collector.getHealth().state).toBe('connected');

      await collector.stop();
      expect(collector.getHealth().state).toBe('disconnected');
    }, 10000);
  });
});
