/**
 * Historical Types
 * ================
 *
 * Types for candle aggregation and historical data storage.
 */

import type { Timeframe } from '../normalizer/data.validators.js';

/**
 * OHLCV Candle - The universal format for candlestick/bar data.
 *
 * OHLCV stands for:
 * - Open: First price in the period
 * - High: Highest price in the period
 * - Low: Lowest price in the period
 * - Close: Last price in the period
 * - Volume: Total trading volume in the period
 *
 * TradingView and every other charting library expects this format.
 */
export interface Candle {
  /** Symbol this candle is for */
  symbol: string;

  /** Candle timeframe (1m, 5m, 1h, etc.) */
  timeframe: Timeframe;

  /** Opening price (first tick in period) */
  open: number;

  /** Highest price in period */
  high: number;

  /** Lowest price in period */
  low: number;

  /** Closing price (last tick in period) */
  close: number;

  /** Trading volume (sum of all tick volumes) */
  volume: number;

  /** Period start timestamp (Unix milliseconds) */
  timestamp: number;

  /** Number of ticks that formed this candle */
  tickCount: number;

  /** Whether this candle is still being formed */
  isComplete: boolean;
}

/**
 * Query parameters for fetching historical candles.
 */
export interface CandleQuery {
  /** Symbol to fetch candles for */
  symbol: string;

  /** Timeframe of candles */
  timeframe: Timeframe;

  /** Start time (Unix ms, inclusive) */
  from: number;

  /** End time (Unix ms, exclusive) */
  to: number;

  /** Maximum number of candles to return */
  limit?: number;
}

/**
 * In-memory candle being built from ticks.
 * Once complete, this gets persisted to the database.
 */
export interface CandleBuilder {
  symbol: string;
  timeframe: Timeframe;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
  tickCount: number;
}
