import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FxCommoditiesCollector } from '../src/domains/collectors/fx-commodities.collector.js';

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

describe('FxCommoditiesCollector', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('polls indices/energy via yfinance-service and emits ticks', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/quote')) {
        // Connectivity probe uses ^GSPC; polling may request other symbols.
        return jsonResponse([
          { symbol: '^GSPC', current_price: 4700.12, timestamp: 1700000000 },
          { symbol: 'CL=F', current_price: 72.5, timestamp: 1700000000 },
        ]);
      }

      return jsonResponse({ error: 'not found' }, { status: 404 });
    });

    vi.stubGlobal('fetch', fetchMock);

    const collector = new FxCommoditiesCollector({ rateLimitBackoffMs: 10_000 });

    const ticks: Array<{ symbol: string; last: number }> = [];
    collector.onTick((t) => ticks.push({ symbol: t.symbol, last: t.last }));

    await collector.start();

    await collector.subscribe(['SPX', 'WTI']);

    const spx = ticks.find(t => t.symbol === 'SPX')?.last;
    const wti = ticks.find(t => t.symbol === 'WTI')?.last;

    expect(spx).toBeDefined();
    expect(wti).toBeDefined();
    expect(spx!).toBeGreaterThan(0);
    expect(wti!).toBeGreaterThan(0);

    await collector.stop();
  });
});
