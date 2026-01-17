/**
 * Historical Service
 * ==================
 *
 * High-level service for historical data operations.
 * Coordinates between candle aggregator, repository, and cache.
 */

import { CandleAggregator, aggregateCandles } from './candle.aggregator.js';
import { TickRepository } from './tick.repository.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';
import { TIMEFRAME_MS, type Timeframe } from '../normalizer/data.validators.js';
import type { EnrichedTick } from '../normalizer/normalizer.types.js';
import type { Candle, CandleQuery } from './historical.types.js';

const log = logger.child({ component: 'historical-service' });

/**
 * Historical data service.
 * Provides a unified interface for candle aggregation and storage.
 */
export class HistoricalService {
  private aggregator: CandleAggregator;
  private repository: TickRepository;

  /** Buffer for batch-saving candles */
  private candleBuffer: Candle[] = [];
  private readonly BUFFER_SIZE = 100;
  private bufferFlushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.aggregator = new CandleAggregator();
    this.repository = new TickRepository();

    // Wire up candle completion to persistence
    this.aggregator.onCandle((candle) => {
      this.bufferCandle(candle);
    });
  }

  /**
   * Initialize the service (connects to database).
   */
  async initialize(): Promise<void> {
    await this.repository.initialize();

    // Start buffer flush timer (flush every 10 seconds)
    this.bufferFlushTimer = setInterval(() => {
      this.flushBuffer();
    }, 10000);

    log.info('Historical service initialized');
  }

  /**
   * Backfill historical data for a symbol.
   * Uses Binance for crypto, Yahoo Finance for stocks/forex/indices/commodities.
   * Only backfills if the symbol has fewer than MIN_CANDLES candles.
   * 
   * @param symbol - Internal symbol (e.g., "BTC/USD", "AAPL", "EUR/USD")
   * @param limit - Number of 1-minute candles to fetch (default 500)
   */
  async backfillSymbol(symbol: string, limit = 1000, minCandles = 0): Promise<number> {
    // First get symbol definition to determine max candles needed
    const { getSymbolDef } = await import('../../config/symbols.js');
    const symbolDef = getSymbolDef(symbol);
    // All asset types: 100k candles max
    const maxCandles = 100000;

    // Check if we already have sufficient data
    // Query the full maxCandles count to properly check total
    const existing = await this.repository.getRecentCandles(symbol, '1m', maxCandles);

    log.info({ symbol, existingCount: existing.length, limit, maxCandles }, 'Backfill check');
    if (existing.length >= maxCandles) {
      log.info({ symbol, count: existing.length }, 'Symbol has sufficient candles, skipping backfill');
      return 0;
    }

    if (!symbolDef) {
      log.warn({ symbol }, 'Unknown symbol, skipping backfill');
      return 0;
    }
    log.info({ symbol, kind: symbolDef.kind, binance: symbolDef.sources.binance, yahoo: symbolDef.sources.yahoo }, 'Symbol definition found');

    try {
      if (symbolDef.kind === 'crypto') {
        return await this.backfillFromBinance(symbol, symbolDef.sources.binance, limit);
      } else {
        return await this.backfillFromYahoo(symbol, symbolDef.sources.yahoo, limit);
      }
    } catch (error) {
      log.error({ error, symbol, kind: symbolDef.kind }, 'Failed to backfill symbol');
      return 0;
    }
  }

  /**
   * Backfill from Binance (for crypto).
   * Fetches historical data BEFORE the earliest existing candle to avoid duplicates.
   */
  private async backfillFromBinance(symbol: string, binanceSymbol: string | undefined, limit: number): Promise<number> {
    if (!binanceSymbol) {
      log.warn({ symbol }, 'No Binance mapping, skipping');
      return 0;
    }

    // Find the earliest existing candle to fetch data BEFORE it
    const existing = await this.repository.getRecentCandles(symbol, '1m', 1);
    let endTime: number | undefined;

    if (existing.length > 0) {
      // Get the oldest candle we have and fetch data before it
      const oldestCandles = await this.repository.queryCandles({
        symbol,
        timeframe: '1m',
        from: 0,
        to: Date.now(),
        limit: 1,
      });
      if (oldestCandles.length > 0) {
        endTime = oldestCandles[0]!.timestamp;
        log.info({ symbol, endTime: new Date(endTime).toISOString() }, 'Fetching historical data before earliest candle');
      }
    }

    // Build URL with optional endTime to get older data
    let url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol.toUpperCase()}&interval=1m&limit=${limit}`;
    if (endTime) {
      url += `&endTime=${endTime}`;
    }

    log.info({ symbol, binanceSymbol, limit, endTime }, 'Backfilling from Binance');

    const response = await fetch(url);
    if (!response.ok) {
      log.warn({ symbol, status: response.status }, 'Binance klines fetch failed');
      return 0;
    }

    const klines = await response.json() as Array<(string | number)[]>;
    const candles: Candle[] = klines.map((k) => ({
      symbol,
      timeframe: '1m' as Timeframe,
      open: parseFloat(k[1] as string),
      high: parseFloat(k[2] as string),
      low: parseFloat(k[3] as string),
      close: parseFloat(k[4] as string),
      volume: parseFloat(k[5] as string),
      timestamp: Number(k[0]),
      tickCount: parseInt(k[8] as string, 10) || 1,
      isComplete: true as const,
    }));

    await this.repository.saveCandleBatch(candles);
    log.info({ symbol, count: candles.length }, 'Backfilled from Binance');
    return candles.length;
  }

  /**
   * Backfill from Yahoo Finance (for stocks, forex, indices, commodities).
   * Fetches hourly (1h) data for deep history - YFinance provides ~6000 hourly candles (~9 months).
   * We store as 1h timeframe and aggregation handles conversion to higher/lower timeframes.
   */
  private async backfillFromYahoo(symbol: string, yahooSymbol: string | undefined, limit: number): Promise<number> {
    if (!yahooSymbol) {
      log.warn({ symbol }, 'No Yahoo mapping, skipping');
      return 0;
    }

    // Find the earliest existing candle to fetch data BEFORE it
    const existing = await this.repository.getRecentCandles(symbol, '1h', 1);
    let endTs = Date.now();

    if (existing.length > 0) {
      // Get the oldest candle we have and fetch data before it
      const oldestCandles = await this.repository.queryCandles({
        symbol,
        timeframe: '1h',
        from: 0,
        to: Date.now(),
        limit: 1,
      });
      if (oldestCandles.length > 0) {
        endTs = oldestCandles[0]!.timestamp;
        log.info({ symbol, endTs: new Date(endTs).toISOString() }, 'Fetching historical data before earliest candle');
      }
    }

    // YFinance provides ~9 months of hourly data. Request 365 days to maximize history.
    const oneYearAgo = endTs - (365 * 24 * 60 * 60 * 1000);

    const formatDate = (ts: number) => new Date(ts).toISOString().split('T')[0];
    const start = formatDate(oneYearAgo);
    const end = formatDate(endTs);

    const baseUrl = env.YFINANCE_SERVICE_BASE_URL || 'http://100.100.13.10:8000';
    // Use 1h interval for deep history (YFinance provides ~6000 hourly candles)
    const url = `${baseUrl}/historical/${encodeURIComponent(yahooSymbol)}?start=${start}&end=${end}&interval=1h`;

    log.info({ symbol, yahooSymbol, url }, 'Backfilling from YFinance Service (1h interval)');

    let retryCount = 0;
    while (retryCount < 3) {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          log.warn({ symbol, status: response.status, attempt: retryCount + 1 }, 'YFinance Service fetch failed');
          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }

        const data = await response.json() as {
          symbol: string;
          prices: Array<{
            timestamp: string;
            open: number;
            high: number;
            low: number;
            close: number;
            volume: number;
          }>;
        };

        if (!data.prices || data.prices.length === 0) {
          log.warn({ symbol }, 'YFinance Service returned empty prices');
          return 0;
        }

        // Store as 1h candles - the aggregation layer handles conversion
        const candles: Candle[] = data.prices.map(p => ({
          symbol,
          timeframe: '1h' as Timeframe,
          open: p.open,
          high: p.high,
          low: p.low,
          close: p.close,
          volume: p.volume,
          timestamp: new Date(p.timestamp).getTime(),
          tickCount: 1,
          isComplete: true as const,
        }));

        await this.repository.saveCandleBatch(candles);
        log.info({ symbol, count: candles.length }, 'Backfilled from YFinance Service (1h)');
        return candles.length;

      } catch (err) {
        log.error({ error: err, symbol, attempt: retryCount + 1 }, 'Error backfilling from YFinance Service');
        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    return 0;
  }

  /**
   * Generate mock candles for demo purposes when external API fails.
   */
  private async generateMockCandles(symbol: string, limit: number): Promise<number> {
    log.info({ symbol, limit }, 'Generating mock historical data');

    // Seed price based on symbol hash to keep it consistent-ish
    let seed = 0;
    for (let i = 0; i < symbol.length; i++) seed += symbol.charCodeAt(i);

    // Baseline prices for common assets (fallback)
    let price = 100;
    if (symbol.includes('EUR')) price = 1.08;
    else if (symbol.includes('JPY')) price = 145.50;
    else if (symbol.includes('BTC')) price = 65000;
    else if (symbol.includes('ETH')) price = 3500;
    else if (symbol.includes('SPX')) price = 5200;
    else if (symbol.includes('AAPL')) price = 180;

    const now = Date.now();
    const candles: Candle[] = [];
    const volatility = 0.002; // 0.2% volatility per minute

    // Generate candles going backwards
    for (let i = limit - 1; i >= 0; i--) {
      const time = now - (i * 60 * 1000);

      // Random walk
      const change = 1 + (Math.random() - 0.5) * volatility;
      const close = price * change;
      const open = price;
      const high = Math.max(open, close) * (1 + Math.random() * 0.001);
      const low = Math.min(open, close) * (1 - Math.random() * 0.001);
      const volume = Math.floor(Math.random() * 10000) + 1000;

      candles.push({
        symbol,
        timeframe: '1m' as Timeframe,
        open,
        high,
        low,
        close,
        volume,
        timestamp: time,
        tickCount: 10,
        isComplete: true as const
      });

      // Set next starting price
      price = close;
    }

    await this.repository.saveCandleBatch(candles);
    log.info({ symbol, count: candles.length }, 'Generated mock data');
    return candles.length;
  }

  /**
   * Backfill multiple symbols in parallel (with rate limiting).
   * 
   * @param symbols - Array of internal symbols
   * @param batchSize - How many symbols to fetch concurrently (default 5)
   */
  async backfillSymbols(symbols: string[], batchSize = 5): Promise<Map<string, number>> {
    const results = new Map<string, number>();

    log.info({ count: symbols.length, batchSize }, 'Starting historical backfill');

    // Process in batches to avoid rate limiting
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(s => this.backfillSymbol(s).then(count => ({ symbol: s, count })));

      const batchResults = await Promise.all(promises);
      batchResults.forEach(r => results.set(r.symbol, r.count));

      // Rate limit delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const totalCandles = Array.from(results.values()).reduce((a, b) => a + b, 0);
    log.info({ symbols: symbols.length, totalCandles }, 'Historical backfill complete');

    return results;
  }


  /**
   * Process an incoming tick.
   * Updates the candle aggregator.
   */
  processTick(tick: EnrichedTick): void {
    this.aggregator.processTick(tick);
  }

  /**
   * Get historical candles for a symbol.
   *
   * TIMEFRAME HANDLING:
   * - 1m candles are stored directly in DB
   * - Higher timeframes are aggregated from 1m candles on-the-fly
   * - This is efficient for reasonable query sizes
   *
   * @param query - Query parameters
   * @returns Array of candles
   */
  async getCandles(query: CandleQuery): Promise<Candle[]> {
    // If requesting 1m candles, query directly
    if (query.timeframe === '1m') {
      return this.repository.queryCandles(query);
    }

    // For higher timeframes, fetch 1m candles and aggregate
    const minuteCandles = await this.repository.queryCandles({
      ...query,
      timeframe: '1m',
      // Increase limit to account for aggregation
      limit: (query.limit || 500) * getTimeframeMultiplier(query.timeframe),
    });

    return aggregateCandles(minuteCandles, query.timeframe);
  }

  /**
   * Get recent candles (convenience method for TradingView).
   * Uses repository.getRecentCandles which doesn't filter by time range.
   *
   * @param symbol - Symbol to query
   * @param timeframe - Candle timeframe
   * @param count - Number of candles
   */
  async getRecentCandles(symbol: string, timeframe: Timeframe, count: number): Promise<Candle[]> {
    // For 1m candles, use direct repository query (no time filtering)
    if (timeframe === '1m') {
      return this.repository.getRecentCandles(symbol, timeframe, count);
    }

    // For higher timeframes, fetch more 1m candles and aggregate
    const multiplier = getTimeframeMultiplier(timeframe);
    const minuteCandles = await this.repository.getRecentCandles(symbol, '1m', count * multiplier);
    return aggregateCandles(minuteCandles, timeframe);
  }

  /**
   * Get current in-progress candle for a symbol.
   */
  getCurrentCandle(symbol: string): Candle | null {
    return this.aggregator.getCurrentCandle(symbol);
  }

  /**
   * Get all in-progress candles.
   */
  getAllCurrentCandles(): Candle[] {
    return this.aggregator.getAllCurrentCandles();
  }

  /**
   * Buffer a completed candle for batch saving.
   */
  private bufferCandle(candle: Candle): void {
    this.candleBuffer.push(candle);

    // Flush if buffer is full
    if (this.candleBuffer.length >= this.BUFFER_SIZE) {
      this.flushBuffer();
    }
  }

  /**
   * Flush buffered candles to database.
   */
  private async flushBuffer(): Promise<void> {
    if (this.candleBuffer.length === 0) return;

    const toSave = [...this.candleBuffer];
    this.candleBuffer = [];

    await this.repository.saveCandleBatch(toSave);
  }

  /**
   * Stop the service and clean up.
   */
  async stop(): Promise<void> {
    // Stop buffer timer
    if (this.bufferFlushTimer) {
      clearInterval(this.bufferFlushTimer);
      this.bufferFlushTimer = null;
    }

    // Flush remaining candles
    await this.flushBuffer();

    // Stop aggregator
    this.aggregator.stop();

    // Close database
    await this.repository.close();

    log.info('Historical service stopped');
  }

  /**
   * Get service statistics.
   */
  getStats(): { aggregator: ReturnType<CandleAggregator['getStats']>; bufferSize: number } {
    return {
      aggregator: this.aggregator.getStats(),
      bufferSize: this.candleBuffer.length,
    };
  }
}

/**
 * Get multiplier for timeframe (how many 1m candles make one of this timeframe).
 */
function getTimeframeMultiplier(timeframe: Timeframe): number {
  return TIMEFRAME_MS[timeframe] / TIMEFRAME_MS['1m'];
}
