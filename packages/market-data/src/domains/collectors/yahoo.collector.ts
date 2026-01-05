/**
 * Yahoo Finance Collector
 * =======================
 *
 * Polling-based collector for stocks, forex, indices, and commodities.
 *
 * WHY YAHOO FINANCE:
 * - FREE with no API key required
 * - Covers virtually every tradeable asset globally
 * - Reasonable update frequency (real-time for US markets during hours)
 * - Reliable and well-maintained npm package (yahoo-finance2)
 *
 * LIMITATIONS:
 * - Polling-based (not real-time WebSocket)
 * - Some data has 15-minute delay for free tier
 * - Unofficial rate limits (~2000 requests/hour estimated)
 * - Can be unreliable during high traffic periods
 *
 * STRATEGY:
 * - Batch requests (fetch multiple symbols in one call)
 * - Poll every 15 seconds for stocks/forex
 * - Poll every 30 seconds for indices/commodities
 * - Exponential backoff on rate limit errors
 *
 * DATA SOURCE: yahoo-finance2 npm package
 * - Uses Yahoo's internal API (same as finance.yahoo.com)
 * - quoteSummary() for detailed quotes
 * - Handles cookie/crumb authentication automatically
 */

import yahooFinance from 'yahoo-finance2';
import { BaseCollector } from './base.collector.js';
import {
  FOREX_SYMBOLS,
  STOCK_SYMBOLS,
  INDEX_SYMBOLS,
  COMMODITY_SYMBOLS,
  type AssetKind,
  type SymbolDefinition,
} from '../../config/index.js';
import { env } from '../../config/env.js';
import type { NormalizedTick, CollectorConfig } from './collector.types.js';

/**
 * All Yahoo-sourced symbols combined.
 * We handle all non-crypto assets through Yahoo.
 */
const YAHOO_SYMBOLS: SymbolDefinition[] = [
  ...FOREX_SYMBOLS,
  ...STOCK_SYMBOLS,
  ...INDEX_SYMBOLS,
  ...COMMODITY_SYMBOLS,
];

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
  readonly supportedKinds: AssetKind[] = ['forex', 'stock', 'index', 'commodity'];

  /** Poll timer reference */
  private pollTimer: NodeJS.Timeout | null = null;

  /** Symbols currently being polled */
  private polledSymbols: Set<string> = new Set();

  /** Track consecutive failures for individual symbols */
  private symbolFailures = new Map<string, number>();

  /** Last successful poll time per symbol (for staleness detection) */
  private lastPollSuccess = new Map<string, number>();

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
    this.log.info('Verifying Yahoo Finance accessibility...');

    try {
      // Test with a reliable symbol (Apple is always available)
      const testResult = await yahooFinance.quote('AAPL');

      if (!testResult || !testResult.regularMarketPrice) {
        throw new Error('Yahoo Finance returned invalid data');
      }

      this.log.info({
        testSymbol: 'AAPL',
        price: testResult.regularMarketPrice,
      }, 'Yahoo Finance connection verified');

    } catch (error) {
      this.log.error({ error }, 'Yahoo Finance connection test failed');
      throw error;
    }
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
    await this.pollSymbols(symbols);
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

    this.log.info({ intervalMs: env.YAHOO_POLL_INTERVAL_MS }, 'Starting poll loop');

    this.pollTimer = setInterval(async () => {
      if (this.polledSymbols.size === 0) return;

      const symbols = Array.from(this.polledSymbols);
      await this.pollSymbols(symbols);
    }, env.YAHOO_POLL_INTERVAL_MS);
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
    for (let i = 0; i < yahooSymbols.length; i += env.YAHOO_BATCH_SIZE) {
      batches.push(yahooSymbols.slice(i, i + env.YAHOO_BATCH_SIZE));
    }

    this.log.debug({
      totalSymbols: yahooSymbols.length,
      batches: batches.length,
    }, 'Polling Yahoo Finance');

    // Process each batch
    for (const batch of batches) {
      try {
        await this.fetchBatch(batch);
      } catch (error) {
        this.log.error({ error, batch }, 'Batch fetch failed');

        // Check for rate limiting
        const errorMsg = (error as Error).message?.toLowerCase() || '';
        if (errorMsg.includes('rate') || errorMsg.includes('too many')) {
          this.emitError({
            type: 'rate_limited',
            message: 'Yahoo Finance rate limited',
            source: this.name,
            timestamp: Date.now(),
            retryable: true,
            originalError: error as Error,
          });

          // Back off on rate limit - skip remaining batches this cycle
          break;
        }
      }

      // Small delay between batches to be nice to Yahoo
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
  private async fetchBatch(yahooSymbols: string[]): Promise<void> {
    // Yahoo Finance quote() accepts an array and returns array of quotes
    const quotes = await yahooFinance.quote(yahooSymbols);

    // Handle both single quote and array response
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    for (const quote of quotesArray) {
      if (!quote || !quote.symbol) continue;

      const internalSymbol = YAHOO_TO_INTERNAL.get(quote.symbol);
      if (!internalSymbol) {
        this.log.warn({ yahooSymbol: quote.symbol }, 'Unknown Yahoo symbol');
        continue;
      }

      // Skip if no price data (market might be closed)
      if (quote.regularMarketPrice === undefined || quote.regularMarketPrice === null) {
        this.log.debug({ symbol: internalSymbol }, 'No price data (market may be closed)');
        continue;
      }

      // Build normalized tick
      const tick: NormalizedTick = {
        symbol: internalSymbol,
        last: quote.regularMarketPrice,
        timestamp: quote.regularMarketTime
          ? new Date(quote.regularMarketTime).getTime()
          : Date.now(),
        source: this.name,
      };

      // Add optional fields if available
      if (quote.bid !== undefined && quote.bid !== null) {
        tick.bid = quote.bid;
      }
      if (quote.ask !== undefined && quote.ask !== null) {
        tick.ask = quote.ask;
      }
      if (quote.regularMarketVolume !== undefined) {
        tick.volume = quote.regularMarketVolume;
      }
      if (quote.regularMarketChangePercent !== undefined) {
        tick.changePercent = quote.regularMarketChangePercent;
      }

      // Emit the tick
      this.emitTick(tick);

      // Track success
      this.lastPollSuccess.set(internalSymbol, Date.now());
      this.symbolFailures.delete(internalSymbol);
    }
  }

  /**
   * Simple sleep helper.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
