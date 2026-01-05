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
   *
   * @param symbol - Symbol to query
   * @param timeframe - Candle timeframe
   * @param count - Number of candles
   */
  async getRecentCandles(symbol: string, timeframe: Timeframe, count: number): Promise<Candle[]> {
    const to = Date.now();
    const from = to - (count * TIMEFRAME_MS[timeframe]);

    return this.getCandles({
      symbol,
      timeframe,
      from,
      to,
      limit: count,
    });
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
