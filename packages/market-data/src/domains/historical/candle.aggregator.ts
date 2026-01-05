/**
 * Candle Aggregator
 * =================
 *
 * Builds OHLCV candles from incoming ticks in real-time.
 *
 * HOW IT WORKS:
 * 1. Incoming ticks are routed to the aggregator
 * 2. Aggregator maintains an in-memory "candle builder" for each symbol/timeframe
 * 3. Each tick updates the builder (high, low, close, volume)
 * 4. When a period ends, the candle is "closed" and emitted
 * 5. Closed candles are persisted to database
 *
 * TIMEFRAME HANDLING:
 * We only build 1-minute candles from ticks. Higher timeframes (5m, 1h, etc.)
 * are aggregated from 1-minute candles on-the-fly or via database queries.
 * This is more efficient than maintaining separate builders for each timeframe.
 *
 * WHY IN-MEMORY:
 * Building candles requires keeping track of OHLC state for each symbol.
 * Writing every tick to DB would be prohibitively slow. Instead:
 * - Build candles in memory
 * - Persist only completed candles
 * - Use Redis for crash recovery (optional future enhancement)
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger.js';
import { getCandleStart, TIMEFRAME_MS, type Timeframe } from '../normalizer/data.validators.js';
import type { EnrichedTick } from '../normalizer/normalizer.types.js';
import type { Candle, CandleBuilder } from './historical.types.js';

/**
 * Handler for completed candles.
 */
export type CandleHandler = (candle: Candle) => void;

/**
 * Candle aggregator that builds OHLCV candles from ticks.
 */
export class CandleAggregator {
  private log = logger.child({ component: 'candle-aggregator' });
  private emitter = new EventEmitter();

  /**
   * In-progress candle builders.
   * Key format: "symbol:timeframe" (e.g., "BTC/USD:1m")
   */
  private builders = new Map<string, CandleBuilder>();

  /** Timer for flushing completed candles */
  private flushTimer: NodeJS.Timeout | null = null;

  /** The base timeframe we build from ticks */
  private readonly baseTimeframe: Timeframe = '1m';

  constructor() {
    // Start the flush timer
    this.startFlushTimer();
  }

  /**
   * Process an incoming tick and update candle builders.
   *
   * @param tick - Enriched tick to process
   */
  processTick(tick: EnrichedTick): void {
    const builderKey = `${tick.symbol}:${this.baseTimeframe}`;
    const periodStart = getCandleStart(tick.timestamp, this.baseTimeframe);

    let builder = this.builders.get(builderKey);

    // Check if we need a new builder (new symbol or new period)
    if (!builder || builder.timestamp !== periodStart) {
      // If there's an existing builder for a different period, it's complete
      if (builder && builder.timestamp !== periodStart) {
        this.closeCandle(builder);
      }

      // Create new builder for this period
      builder = {
        symbol: tick.symbol,
        timeframe: this.baseTimeframe,
        open: tick.last,
        high: tick.last,
        low: tick.last,
        close: tick.last,
        volume: tick.volume || 0,
        timestamp: periodStart,
        tickCount: 1,
      };

      this.builders.set(builderKey, builder);
    } else {
      // Update existing builder
      builder.high = Math.max(builder.high, tick.last);
      builder.low = Math.min(builder.low, tick.last);
      builder.close = tick.last;
      builder.volume += tick.volume || 0;
      builder.tickCount++;
    }
  }

  /**
   * Close a candle and emit it.
   */
  private closeCandle(builder: CandleBuilder): void {
    const candle: Candle = {
      symbol: builder.symbol,
      timeframe: builder.timeframe,
      open: builder.open,
      high: builder.high,
      low: builder.low,
      close: builder.close,
      volume: builder.volume,
      timestamp: builder.timestamp,
      tickCount: builder.tickCount,
      isComplete: true,
    };

    this.log.debug({
      symbol: candle.symbol,
      timestamp: new Date(candle.timestamp).toISOString(),
      ohlc: `${candle.open}/${candle.high}/${candle.low}/${candle.close}`,
      ticks: candle.tickCount,
    }, 'Candle closed');

    this.emitter.emit('candle', candle);
  }

  /**
   * Start the flush timer that closes completed candles.
   *
   * WHY A TIMER:
   * Ticks don't arrive exactly at period boundaries. We need to check
   * periodically if any candles should be closed due to time passing
   * (not just due to new ticks arriving).
   *
   * Example: If we stop receiving BTC ticks at 10:32:45, the 10:32 candle
   * should still close at 10:33:00 even without new ticks.
   */
  private startFlushTimer(): void {
    // Run every 5 seconds to check for candles that should be closed
    this.flushTimer = setInterval(() => {
      this.flushCompletedCandles();
    }, 5000);
  }

  /**
   * Check all builders and close any that belong to completed periods.
   */
  private flushCompletedCandles(): void {
    const now = Date.now();
    const currentPeriodStart = getCandleStart(now, this.baseTimeframe);

    for (const [key, builder] of this.builders) {
      // If the builder's period is before the current period, it's complete
      if (builder.timestamp < currentPeriodStart) {
        this.closeCandle(builder);
        this.builders.delete(key);
      }
    }
  }

  /**
   * Get the current in-progress candle for a symbol.
   * Returns null if no candle is being built.
   */
  getCurrentCandle(symbol: string): Candle | null {
    const builderKey = `${symbol}:${this.baseTimeframe}`;
    const builder = this.builders.get(builderKey);

    if (!builder) return null;

    return {
      symbol: builder.symbol,
      timeframe: builder.timeframe,
      open: builder.open,
      high: builder.high,
      low: builder.low,
      close: builder.close,
      volume: builder.volume,
      timestamp: builder.timestamp,
      tickCount: builder.tickCount,
      isComplete: false,
    };
  }

  /**
   * Get all current in-progress candles.
   */
  getAllCurrentCandles(): Candle[] {
    const candles: Candle[] = [];

    for (const builder of this.builders.values()) {
      candles.push({
        symbol: builder.symbol,
        timeframe: builder.timeframe,
        open: builder.open,
        high: builder.high,
        low: builder.low,
        close: builder.close,
        volume: builder.volume,
        timestamp: builder.timestamp,
        tickCount: builder.tickCount,
        isComplete: false,
      });
    }

    return candles;
  }

  /**
   * Subscribe to completed candle events.
   */
  onCandle(handler: CandleHandler): void {
    this.emitter.on('candle', handler);
  }

  /**
   * Unsubscribe from candle events.
   */
  offCandle(handler: CandleHandler): void {
    this.emitter.off('candle', handler);
  }

  /**
   * Stop the aggregator and flush any remaining candles.
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Close and emit all in-progress candles
    for (const [key, builder] of this.builders) {
      this.closeCandle(builder);
      this.builders.delete(key);
    }

    this.log.info('Candle aggregator stopped');
  }

  /**
   * Get statistics about the aggregator.
   */
  getStats(): { activeBuilders: number; symbols: string[] } {
    const symbols = new Set<string>();
    for (const builder of this.builders.values()) {
      symbols.add(builder.symbol);
    }

    return {
      activeBuilders: this.builders.size,
      symbols: Array.from(symbols),
    };
  }
}

/**
 * Aggregate 1-minute candles into higher timeframes.
 *
 * @param candles - Array of 1-minute candles (must be sorted by timestamp)
 * @param targetTimeframe - Target timeframe to aggregate to
 * @returns Array of aggregated candles
 *
 * @example
 * // Aggregate 60 one-minute candles into one 1-hour candle
 * const hourlyCandles = aggregateCandles(minuteCandles, '1h');
 */
export function aggregateCandles(candles: Candle[], targetTimeframe: Timeframe): Candle[] {
  if (candles.length === 0) return [];

  const targetPeriodMs = TIMEFRAME_MS[targetTimeframe];
  const result: Candle[] = [];

  let currentBuilder: CandleBuilder | null = null;

  for (const candle of candles) {
    const periodStart = getCandleStart(candle.timestamp, targetTimeframe);

    if (!currentBuilder || currentBuilder.timestamp !== periodStart) {
      // Save previous builder
      if (currentBuilder) {
        result.push({
          ...currentBuilder,
          timeframe: targetTimeframe,
          isComplete: true,
        });
      }

      // Start new builder
      currentBuilder = {
        symbol: candle.symbol,
        timeframe: targetTimeframe,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        timestamp: periodStart,
        tickCount: candle.tickCount,
      };
    } else {
      // Aggregate into current builder
      currentBuilder.high = Math.max(currentBuilder.high, candle.high);
      currentBuilder.low = Math.min(currentBuilder.low, candle.low);
      currentBuilder.close = candle.close;
      currentBuilder.volume += candle.volume;
      currentBuilder.tickCount += candle.tickCount;
    }
  }

  // Don't forget the last candle
  if (currentBuilder) {
    result.push({
      ...currentBuilder,
      timeframe: targetTimeframe,
      isComplete: true,
    });
  }

  return result;
}
