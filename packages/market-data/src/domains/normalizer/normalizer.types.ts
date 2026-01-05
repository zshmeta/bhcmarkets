/**
 * Normalizer Types
 * ================
 *
 * Types for the normalization layer that transforms raw exchange data
 * into our canonical format.
 */

import type { AssetKind } from '../../config/symbols.js';

/**
 * Enriched tick with additional computed fields.
 * This is what consumers receive after normalization.
 */
export interface EnrichedTick {
  // Core fields from NormalizedTick
  symbol: string;
  last: number;
  bid?: number;
  ask?: number;
  volume?: number;
  changePercent?: number;
  timestamp: number;
  source: string;

  // Enriched fields
  /** Asset kind (crypto, forex, etc.) */
  kind: AssetKind;

  /** Human-readable name */
  name: string;

  /** Midpoint price (bid+ask)/2 if available, else last */
  mid: number;

  /** Spread in price units (ask - bid) */
  spread?: number;

  /** Spread as percentage of mid price */
  spreadPercent?: number;

  /** Price formatted for display */
  priceFormatted: string;

  /** Change formatted for display (e.g., "+2.34%") */
  changeFormatted?: string;
}

/**
 * Batch of ticks for a specific timeframe.
 * Used for building candles.
 */
export interface TickBatch {
  symbol: string;
  ticks: EnrichedTick[];
  startTime: number;
  endTime: number;
}
