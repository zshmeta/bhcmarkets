/**
 * Yahoo Collector (Stocks via internal yfinance-service)
 * ======================================================
 *
 * This collector used to call yahoo-finance2 directly.
 * It now fetches **stocks only** via an internal REST service ("yfinance-service")
 * to centralize caching + rate limiting and reduce reliability issues.
 *
 * Endpoint expectations (typical):
 * - GET /quote?symbols=AAPL,MSFT
 * - (optional) GET /quote/AAPL
 */
import { BaseCollector } from './base.collector.js';
import {
  STOCK_SYMBOLS,
  type AssetKind,
  type SymbolDefinition,
} from '../../config/index.js';
import { env } from '../../config/env.js';
import type { NormalizedTick, CollectorConfig } from '@repo/sdk';

type YFinanceQuote = {
  symbol?: string;
  current_price?: number;
  volume?: number;
  timestamp?: number | string;
  regular_market_time?: number | string;
};

/**
 * All Yahoo-sourced symbols combined.
 * We handle all non-crypto assets through Yahoo.
 */
const YAHOO_SYMBOLS: SymbolDefinition[] = [...STOCK_SYMBOLS];

/**
 * Map from Yahoo symbol to internal symbol.
 * Example: "AAPL" -> "AAPL", "EURUSD=X" -> "EUR/USD", "^GSPC" -> "SPX"
 */
const YAHOO_TO_INTERNAL = new Map<string, string>(
  YAHOO_SYMBOLS
    .filter(s => s.sources.yahoo)
    .map(s => [s.sources.yahoo!, s.symbol])
);

/**
 * Map from internal symbol to Yahoo symbol.
 */
const INTERNAL_TO_YAHOO = new Map<string, string>(
  YAHOO_SYMBOLS
    .filter(s => s.sources.yahoo)
    .map(s => [s.symbol, s.sources.yahoo!])
);

/**
 * Yahoo Finance polling collector.
 *
 * ARCHITECTURE:
 * Unlike WebSocket collectors that receive push updates, this collector
 * actively polls Yahoo Finance at regular intervals. The poll interval
 * is configurable but defaults to 15 seconds as a balance between:
 * - Data freshness (faster = more current prices)
 * - Rate limit safety (slower = less risk of being blocked)
 * - Resource usage (slower = less CPU/network)
 */
export class YahooCollector extends BaseCollector {
  readonly name = 'yahoo';
  readonly supportedKinds: AssetKind[] = ['stock'];

  /** Poll timer reference */
  private pollTimer: NodeJS.Timeout | null = null;

  /** Symbols currently being polled */
  private polledSymbols: Set<string> = new Set();

  /** Track consecutive failures for individual symbols */
  private symbolFailures = new Map<string, number>();

  /** Last successful poll time per symbol (for staleness detection) */
  private lastPollSuccess = new Map<string, number>();

  /** Skip polling temporarily after rate limiting */
  private cooldownUntilMs = 0;

  /** Serialize polls to avoid overlapping requests */
  private pollQueue: Promise<void> = Promise.resolve();
  private pollInFlight = false;
  private pendingPollSymbols: string[] | null = null;

  constructor(config?: CollectorConfig) {
    super(config);
  }

  // ============================================================
  // ABSTRACT METHOD IMPLEMENTATIONS
  // ============================================================

  /**
   * "Connect" to Yahoo Finance.
   *
   * Since Yahoo is REST-based, there's no persistent connection.
   * We validate that Yahoo is reachable by fetching a test symbol.
   */
  protected async doConnect(): Promise<void> {
    this.log.info('Verifying yfinance-service accessibility (stocks)...');

    const quotes = await this.fetchBatch(['AAPL']);
    const aapl = quotes.find(q => q.symbol === 'AAPL');
    if (!aapl || typeof aapl.current_price !== 'number' || !Number.isFinite(aapl.current_price)) {
      throw new Error('yfinance-service returned invalid data for AAPL');
    }

    this.log.info({ testSymbol: 'AAPL', price: aapl.current_price }, 'yfinance-service connection verified');
  }

  /**
   * Stop polling.
   */
  protected async doDisconnect(): Promise<void> {
    this.stopPolling();
    this.polledSymbols.clear();
    this.symbolFailures.clear();
    this.lastPollSuccess.clear();
  }

  /**
   * Start polling for subscribed symbols.
   */
  protected async doSubscribe(symbols: string[]): Promise<void> {
    symbols.forEach(s => this.polledSymbols.add(s));

    // If not already polling, start
    if (!this.pollTimer) {
      this.startPolling();
    }

    // Do an immediate poll for the new symbols
    this.log.info({ symbols }, 'Fetching initial quotes');
    await this.queuePoll(symbols);
  }

  /**
   * Remove symbols from polling.
   */
  protected async doUnsubscribe(symbols: string[]): Promise<void> {
    symbols.forEach(s => {
      this.polledSymbols.delete(s);
      this.symbolFailures.delete(s);
      this.lastPollSuccess.delete(s);
    });

    // If no more symbols, stop polling
    if (this.polledSymbols.size === 0) {
      this.stopPolling();
    }
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  /**
   * Start the polling loop.
   */
  private startPolling(): void {
    if (this.pollTimer) return;

    this.log.info({ intervalMs: env.YFINANCE_STOCKS_POLL_INTERVAL_MS }, 'Starting poll loop');

    this.pollTimer = setInterval(async () => {
      if (this.polledSymbols.size === 0) return;

      const symbols = Array.from(this.polledSymbols);
      void this.queuePoll(symbols);
    }, env.YFINANCE_STOCKS_POLL_INTERVAL_MS);
  }

  /**
   * Queue a poll operation to ensure we never have overlapping Yahoo requests.
   * Overlap can amplify rate limiting and create bursts.
   */
  private queuePoll(internalSymbols: string[]): Promise<void> {
    // Coalesce: if polls are slow, keep only the most recent requested symbols.
    this.pendingPollSymbols = internalSymbols;

    if (this.pollInFlight) {
      return this.pollQueue;
    }

    this.pollInFlight = true;
    this.pollQueue = (async () => {
      while (this.pendingPollSymbols) {
        const symbols = this.pendingPollSymbols;
        this.pendingPollSymbols = null;
        try {
          await this.pollSymbols(symbols);
        } catch {
          // pollSymbols is already defensive; keep loop alive regardless.
        }
      }
    })().finally(() => {
      this.pollInFlight = false;
    });

    return this.pollQueue;
  }

  /**
   * Stop the polling loop.
   */
  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      this.log.info('Stopped poll loop');
    }
  }

  /**
   * Poll a batch of symbols.
   *
   * BATCHING STRATEGY:
   * Yahoo Finance works best with batched requests. We:
   * 1. Split symbols into batches (default 20 per batch)
   * 2. Process batches sequentially (to avoid overwhelming Yahoo)
   * 3. Convert each successful quote to a normalized tick
   */
  private async pollSymbols(internalSymbols: string[]): Promise<void> {
    const now = Date.now();
    if (now < this.cooldownUntilMs) {
      this.log.warn({ cooldownMs: this.cooldownUntilMs - now }, 'In cooldown; skipping poll');
      return;
    }

    // Convert internal symbols to Yahoo symbols
    const yahooSymbols = internalSymbols
      .map(s => INTERNAL_TO_YAHOO.get(s))
      .filter(Boolean) as string[];

    if (yahooSymbols.length === 0) {
      this.log.warn('No Yahoo symbols to poll');
      return;
    }

    // Split into batches
    const batches: string[][] = [];
    for (let i = 0; i < yahooSymbols.length; i += env.YFINANCE_BATCH_SIZE) {
      batches.push(yahooSymbols.slice(i, i + env.YFINANCE_BATCH_SIZE));
    }

    this.log.debug({
      totalSymbols: yahooSymbols.length,
      batches: batches.length,
    }, 'Polling Yahoo Finance');

    // Process each batch
    for (const batch of batches) {
      try {
        const quotes = await this.fetchBatch(batch);

        for (const quote of quotes) {
          if (!quote || !quote.symbol) continue;

          const internalSymbol = YAHOO_TO_INTERNAL.get(quote.symbol);
          if (!internalSymbol) {
            this.log.debug({ yahooSymbol: quote.symbol }, 'Unknown symbol from yfinance-service');
            continue;
          }

          const price = quote.current_price;
          if (price === undefined || price === null || typeof price !== 'number' || !Number.isFinite(price)) {
            this.log.debug({ symbol: internalSymbol }, 'No price data (market may be closed)');
            continue;
          }

          const tick: NormalizedTick = {
            symbol: internalSymbol,
            last: price,
            timestamp: this.parseTimestamp(quote.timestamp)
              ?? this.parseTimestamp(quote.regular_market_time)
              ?? Date.now(),
            source: this.name,
          };

          if (typeof quote.volume === 'number' && Number.isFinite(quote.volume)) {
            tick.volume = quote.volume;
          }

          this.emitTick(tick);
          this.lastPollSuccess.set(internalSymbol, Date.now());
          this.symbolFailures.delete(internalSymbol);
        }
      } catch (error) {
        this.log.error({ error, batch }, 'Batch fetch failed');

        // Check for rate limiting
        const errorMsg = (error as Error).message?.toLowerCase() || '';
        if (errorMsg.includes('rate') || errorMsg.includes('too many')) {
          this.emitError({
            type: 'rate_limited',
            message: 'yfinance-service rate limited',
            source: this.name,
            timestamp: Date.now(),
            retryable: true,
            originalError: error as Error,
          });

          this.cooldownUntilMs = Date.now() + this.config.rateLimitBackoffMs;

          // Back off on rate limit - skip remaining batches this cycle
          break;
        }
      }

      // Small delay between batches to be nice to upstream
      if (batches.length > 1) {
        await this.sleep(500);
      }
    }
  }

  /**
   * Fetch a batch of symbols from Yahoo Finance.
   *
   * We use the `quote` endpoint which returns:
   * - regularMarketPrice: Current/last price
   * - bid/ask: Best bid and ask prices (for some symbols)
   * - regularMarketChange: Price change from previous close
   * - regularMarketChangePercent: Percent change
   * - regularMarketVolume: Trading volume
   */
  private async fetchBatch(yahooSymbols: string[]): Promise<YFinanceQuote[]> {
    const url = new URL('/quote', env.YFINANCE_SERVICE_BASE_URL);
    url.searchParams.set('symbols', yahooSymbols.join(','));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: this.createAbortSignal(8000),
    });

    if (res.status === 429) {
      throw new Error('yfinance-service rate limited (HTTP 429)');
    }
    if (!res.ok) {
      throw new Error(`yfinance-service error (HTTP ${res.status})`);
    }

    const payload = await res.json();
    return this.normalizePayload(payload);
  }

  private createAbortSignal(timeoutMs: number): AbortSignal {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (timeout as any).unref?.();
    return controller.signal;
  }

  private parseTimestamp(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value < 10_000_000_000 ? value * 1000 : value;
    }
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return undefined;
  }

  private normalizePayload(payload: unknown): YFinanceQuote[] {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload as YFinanceQuote[];
    if (typeof payload !== 'object') return [];

    const obj = payload as Record<string, unknown>;
    const candidates = [obj.quotes, obj.data, obj.results, obj.items];
    for (const c of candidates) {
      if (Array.isArray(c)) return c as YFinanceQuote[];
    }

    const out: YFinanceQuote[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (!value || typeof value !== 'object') continue;
      const q = value as Record<string, unknown>;
      const current = q.current_price;
      if (typeof current === 'number' && Number.isFinite(current)) {
        out.push({
          symbol: (q.symbol as string | undefined) ?? key,
          current_price: current,
          volume: typeof q.volume === 'number' ? (q.volume as number) : undefined,
          timestamp: (q.timestamp as number | string | undefined)
            ?? (q.regular_market_time as number | string | undefined),
        });
      }
    }
    return out;
  }

  /**
   * Simple sleep helper.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
