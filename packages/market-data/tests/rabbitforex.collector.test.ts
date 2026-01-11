import { describe, it, expect, vi, afterEach } from 'vitest';
import { RabbitForexCollector } from '../src/domains/collectors/rabbitforex.collector.js';

function jsonResponse(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
  } as unknown as Response;
}

describe('RabbitForexCollector', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('derives cross FX rates from USD table efficiently', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/v1/rates')) {
        return jsonResponse({
          base: 'USD',
          rates: {
            USD: 1,
            EUR: 0.9,
            GBP: 0.8,
            JPY: 150,
          },
          timestamps: { currency: '2025-11-07T07:06:10.544Z' },
        });
      }

      if (url.includes('/v1/metals/rates')) {
        return jsonResponse({
          base: 'USD',
          rates: {
            GOLD: 0.01,
            SILVER: 0.5,
          },
          timestamps: { metal: '2025-11-07T07:06:07.016Z' },
        });
      }

      return jsonResponse({ error: 'not found' }, { status: 404 });
    });

    vi.stubGlobal('fetch', fetchMock);

    const collector = new RabbitForexCollector({ rateLimitBackoffMs: 10_000 });

    const ticks: Array<{ symbol: string; last: number }> = [];
    collector.onTick((t) => ticks.push({ symbol: t.symbol, last: t.last }));

    await collector.start();

    await collector.subscribe(['EUR/USD', 'GBP/JPY']);

    const eurUsd = ticks.find(t => t.symbol === 'EUR/USD')?.last;
    const gbpJpy = ticks.find(t => t.symbol === 'GBP/JPY')?.last;

    expect(eurUsd).toBeDefined();
    expect(gbpJpy).toBeDefined();

    // EUR/USD = (USD->USD)/(USD->EUR) = 1/0.9
    expect(eurUsd!).toBeGreaterThan(1.1);
    expect(eurUsd!).toBeLessThan(1.12);

    // GBP/JPY = (USD->JPY)/(USD->GBP) = 150/0.8
    expect(gbpJpy!).toBeGreaterThan(187);
    expect(gbpJpy!).toBeLessThan(188);

    // Efficiency: should not call FX endpoint per-symbol.
    const fxCalls = fetchMock.mock.calls.filter(c => String(c[0]).includes('/v1/rates')).length;
    expect(fxCalls).toBe(1);

    await collector.stop();
  });

  it('emits metals ticks for XAU/USD and XAG/USD', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/v1/rates')) {
        return jsonResponse({
          base: 'USD',
          rates: { USD: 1, EUR: 0.9 },
          timestamps: { currency: '2025-11-07T07:06:10.544Z' },
        });
      }

      if (url.includes('/v1/metals/rates')) {
        return jsonResponse({
          base: 'USD',
          rates: {
            GOLD: 0.01,
            SILVER: 0.5,
          },
          timestamps: { metal: '2025-11-07T07:06:07.016Z' },
        });
      }

      return jsonResponse({ error: 'not found' }, { status: 404 });
    });

    vi.stubGlobal('fetch', fetchMock);

    const collector = new RabbitForexCollector({ rateLimitBackoffMs: 10_000 });

    const ticks: Array<{ symbol: string; last: number }> = [];
    collector.onTick((t) => ticks.push({ symbol: t.symbol, last: t.last }));

    await collector.start();

    await collector.subscribe(['XAU/USD', 'XAG/USD']);

    const xauUsd = ticks.find(t => t.symbol === 'XAU/USD')?.last;
    const xagUsd = ticks.find(t => t.symbol === 'XAG/USD')?.last;

    expect(xauUsd).toBeDefined();
    expect(xagUsd).toBeDefined();
    expect(xauUsd!).toBeGreaterThan(0);
    expect(xagUsd!).toBeGreaterThan(0);

    // Should only call metals once for both symbols.
    const metalCalls = fetchMock.mock.calls.filter(c => String(c[0]).includes('/v1/metals/rates')).length;
    expect(metalCalls).toBe(1);

    await collector.stop();
  });
});
