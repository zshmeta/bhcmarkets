/**
 * Indices + Energy Commodities Collector
 * ======================================
 *
 * Strategy:
 * - Indices: internal yfinance-service bulk quote endpoint
 * - Energy commodities: internal yfinance-service bulk quote endpoint
 *
 * Forex + metals are handled by RabbitForexAPI (see RabbitForexCollector).
 */

import { BaseCollector } from './base.collector.js';
import {
  COMMODITY_SYMBOLS,
  INDEX_SYMBOLS,
  type AssetKind,
  type SymbolDefinition,
} from '../../config/symbols.js';
import { env } from '../../config/env.js';
import type { CollectorConfig, NormalizedTick } from './collector.types.js';

type YFinanceQuote = {
  symbol?: string;
  current_price?: number;
  open_price?: number;
  high?: number;
  low?: number;
  volume?: number;
  timestamp?: number | string;
  regular_market_time?: number | string;
};

const ENERGY_COMMODITY_SYMBOLS: SymbolDefinition[] = COMMODITY_SYMBOLS.filter(
  s => s.base !== 'XAU' && s.base !== 'XAG'
);

const INDEX_AND_ENERGY_SYMBOLS: SymbolDefinition[] = [
  ...INDEX_SYMBOLS,
  ...ENERGY_COMMODITY_SYMBOLS,
];

const YFINANCE_TO_INTERNAL = new Map<string, string>(
  INDEX_AND_ENERGY_SYMBOLS
    .filter(s => s.sources.yahoo)
    .map(s => [s.sources.yahoo!, s.symbol])
);

const INTERNAL_TO_YFINANCE = new Map<string, string>(
  INDEX_AND_ENERGY_SYMBOLS
    .filter(s => s.sources.yahoo)
    .map(s => [s.symbol, s.sources.yahoo!])
);

function createAbortSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  // Node will keep the timer alive unless we unref.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (timeout as any).unref?.();
  return controller.signal;
}

function parseTimestamp(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Heuristic: seconds vs ms
    return value < 10_000_000_000 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

function normalizeYFinancePayload(payload: unknown): YFinanceQuote[] {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload as YFinanceQuote[];
  }

  if (typeof payload !== 'object') return [];

  const obj = payload as Record<string, unknown>;
  const candidates = [obj.quotes, obj.data, obj.results, obj.items];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as YFinanceQuote[];
  }

  // If the payload is a map keyed by symbol.
  const out: YFinanceQuote[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (!value || typeof value !== 'object') continue;
    const q = value as Record<string, unknown>;
    const current = q.current_price;
    if (typeof current === 'number' && Number.isFinite(current)) {
      out.push({
        symbol: (q.symbol as string | undefined) ?? key,
        current_price: current,
        volume: typeof q.volume === 'number' ? q.volume : undefined,
        timestamp: (q.timestamp as number | string | undefined)
          ?? (q.regular_market_time as number | string | undefined),
      });
    }
  }
  return out;
}

export class FxCommoditiesCollector extends BaseCollector {
  readonly name = 'fx-commodities';
  readonly supportedKinds: AssetKind[] = ['index', 'commodity'];

  private pollTimer: NodeJS.Timeout | null = null;
  private polledSymbols = new Set<string>();

  private cooldownUntilMs = 0;

  private pollQueue: Promise<void> = Promise.resolve();
  private pollInFlight = false;
  private pendingPollSymbols: string[] | null = null;

  constructor(config?: CollectorConfig) {
    super(config);
  }

  protected async doConnect(): Promise<void> {
    this.log.info('Verifying yfinance-service accessibility...');

    const yfinanceOk = await this.tryFetchYFinance(['^GSPC']);

    if (!yfinanceOk) {
      throw new Error('yfinance-service is unreachable');
    }

    this.log.info({ yfinanceOk }, 'Upstream connectivity verified');
  }

  protected async doDisconnect(): Promise<void> {
    this.stopPolling();
    this.polledSymbols.clear();
  }

  protected async doSubscribe(symbols: string[]): Promise<void> {
    symbols.forEach(s => this.polledSymbols.add(s));

    if (!this.pollTimer) {
      this.startPolling();
    }

    await this.queuePoll(symbols);
  }

  protected async doUnsubscribe(symbols: string[]): Promise<void> {
    symbols.forEach(s => this.polledSymbols.delete(s));

    if (this.polledSymbols.size === 0) {
      this.stopPolling();
    }
  }

  private startPolling(): void {
    if (this.pollTimer) return;

    this.log.info({ intervalMs: env.FX_COMMODITIES_POLL_INTERVAL_MS }, 'Starting poll loop');

    this.pollTimer = setInterval(() => {
      if (this.polledSymbols.size === 0) return;
      void this.queuePoll(Array.from(this.polledSymbols));
    }, env.FX_COMMODITIES_POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (!this.pollTimer) return;
    clearInterval(this.pollTimer);
    this.pollTimer = null;
    this.log.info('Stopped poll loop');
  }

  private queuePoll(internalSymbols: string[]): Promise<void> {
    this.pendingPollSymbols = internalSymbols;

    if (this.pollInFlight) return this.pollQueue;

    this.pollInFlight = true;
    this.pollQueue = (async () => {
      while (this.pendingPollSymbols) {
        const symbols = this.pendingPollSymbols;
        this.pendingPollSymbols = null;
        try {
          await this.pollSymbols(symbols);
        } catch {
          // pollSymbols is defensive.
        }
      }
    })().finally(() => {
      this.pollInFlight = false;
    });

    return this.pollQueue;
  }

  private async pollSymbols(internalSymbols: string[]): Promise<void> {
    const now = Date.now();
    if (now < this.cooldownUntilMs) {
      this.log.warn({ cooldownMs: this.cooldownUntilMs - now }, 'In cooldown; skipping poll');
      return;
    }

    // Indices + energy commodities via internal yfinance-service
    if (internalSymbols.length > 0) {
      try {
        await this.pollYFinance(internalSymbols);
      } catch (error) {
        this.log.error({ error }, 'Index/commodity poll failed');
      }
    }
  }

  private async pollYFinance(internalSymbols: string[]): Promise<void> {
    const yfinanceSymbols = internalSymbols
      .map(s => INTERNAL_TO_YFINANCE.get(s))
      .filter(Boolean) as string[];

    if (yfinanceSymbols.length === 0) return;

    const batches: string[][] = [];
    for (let i = 0; i < yfinanceSymbols.length; i += env.YFINANCE_BATCH_SIZE) {
      batches.push(yfinanceSymbols.slice(i, i + env.YFINANCE_BATCH_SIZE));
    }

    for (const batch of batches) {
      const quotes = await this.fetchYFinanceBatch(batch);

      for (const quote of quotes) {
        const remoteSymbol = quote.symbol;
        if (!remoteSymbol) continue;

        const internal = YFINANCE_TO_INTERNAL.get(remoteSymbol);
        if (!internal) continue;

        const price = quote.current_price;
        if (typeof price !== 'number' || !Number.isFinite(price)) continue;

        const tick: NormalizedTick = {
          symbol: internal,
          last: price,
          volume: typeof quote.volume === 'number' ? quote.volume : undefined,
          timestamp: parseTimestamp(quote.timestamp) ?? parseTimestamp(quote.regular_market_time) ?? Date.now(),
          source: this.name,
        };

        this.emitTick(tick);
      }
    }
  }

  private async tryFetchYFinance(testSymbols: string[]): Promise<boolean> {
    try {
      await this.fetchYFinanceBatch(testSymbols);
      return true;
    } catch {
      return false;
    }
  }

  private async fetchYFinanceBatch(symbols: string[]): Promise<YFinanceQuote[]> {
    const url = new URL('/quote', env.YFINANCE_SERVICE_BASE_URL);
    url.searchParams.set('symbols', symbols.join(','));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: createAbortSignal(8000),
    });

    if (res.status === 429) {
      this.cooldownUntilMs = Date.now() + this.config.rateLimitBackoffMs;
      this.emitError({
        type: 'rate_limited',
        message: 'yfinance-service rate limited (HTTP 429)',
        source: this.name,
        timestamp: Date.now(),
        retryable: true,
      });
      throw new Error('yfinance-service rate limited (HTTP 429)');
    }

    if (!res.ok) {
      throw new Error(`yfinance-service error (HTTP ${res.status})`);
    }

    const payload = await res.json();
    return normalizeYFinancePayload(payload);
  }
}
