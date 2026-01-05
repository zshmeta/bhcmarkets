/**
 * Data Validators
 * ===============
 *
 * Additional validation utilities for market data.
 */

import { z } from 'zod';

/**
 * Validate that a timeframe string is valid.
 */
export const timeframeSchema = z.enum(['1m', '5m', '15m', '1h', '4h', '1d', '1w']);

export type Timeframe = z.infer<typeof timeframeSchema>;

/**
 * Timeframe duration in milliseconds.
 */
export const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
};

/**
 * Get the start timestamp of the candle period containing a given timestamp.
 *
 * @param timestamp - Any timestamp in milliseconds
 * @param timeframe - The candle timeframe
 * @returns Start of the candle period
 *
 * @example
 * // For 1-minute candles at 10:32:45
 * getCandleStart(timestamp, '1m') // Returns timestamp for 10:32:00
 */
export function getCandleStart(timestamp: number, timeframe: Timeframe): number {
  const periodMs = TIMEFRAME_MS[timeframe];
  return Math.floor(timestamp / periodMs) * periodMs;
}

/**
 * Check if a timestamp belongs to the current candle period.
 */
export function isCurrentPeriod(timestamp: number, timeframe: Timeframe): boolean {
  const currentStart = getCandleStart(Date.now(), timeframe);
  const tickStart = getCandleStart(timestamp, timeframe);
  return currentStart === tickStart;
}
