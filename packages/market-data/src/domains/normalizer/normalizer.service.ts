/**
 * Normalizer Service
 * ==================
 *
 * Transforms raw ticks from collectors into enriched, validated ticks
 * ready for consumption by the rest of the system.
 *
 * PIPELINE:
 * Raw Tick (from collector)
 *   ↓
 * Validation (schema + business rules)
 *   ↓
 * Enrichment (add computed fields, formatting)
 *   ↓
 * EnrichedTick (to cache, websocket, candle builder)
 *
 * WHY A SEPARATE SERVICE:
 * - Keeps collectors simple (just fetch data)
 * - Centralizes validation and transformation logic
 * - Easy to add new enrichment logic without touching collectors
 * - Single place to add metrics/logging for data quality
 */

import { EventEmitter } from 'events';
import { SYMBOL_MAP } from '../../config/symbols.js';
import { logger } from '../../utils/logger.js';
import { formatPrice, formatChange } from './symbol.mapper.js';
import type { NormalizedTick } from '../collectors/collector.types.js';
import type { EnrichedTick } from './normalizer.types.js';

/**
 * Handler for enriched ticks.
 */
export type EnrichedTickHandler = (tick: EnrichedTick) => void;

/**
 * Normalizer service that transforms and enriches incoming ticks.
 */
export class NormalizerService {
  private log = logger.child({ component: 'normalizer' });
  private emitter = new EventEmitter();

  /** Track last tick per symbol for deduplication */
  private lastTicks = new Map<string, { price: number; timestamp: number }>();

  /** Metrics */
  private processedCount = 0;
  private duplicateCount = 0;

  constructor() {
    // Log metrics every minute
    setInterval(() => {
      if (this.processedCount > 0) {
        this.log.debug({
          processed: this.processedCount,
          duplicates: this.duplicateCount,
        }, 'Normalizer metrics');
      }
      this.processedCount = 0;
      this.duplicateCount = 0;
    }, 60000);
  }

  /**
   * Process a raw tick from a collector.
   * Validates, enriches, and emits the result.
   *
   * @param tick - Raw normalized tick from collector
   * @returns Enriched tick or null if invalid/duplicate
   */
  process(tick: NormalizedTick): EnrichedTick | null {
    this.processedCount++;

    // Get symbol definition
    const symbolDef = SYMBOL_MAP.get(tick.symbol);
    if (!symbolDef) {
      this.log.warn({ symbol: tick.symbol }, 'Unknown symbol');
      return null;
    }

    // Check for duplicates
    // If same price and timestamp within 100ms, skip
    const lastTick = this.lastTicks.get(tick.symbol);
    if (lastTick) {
      const isSamePrice = Math.abs(lastTick.price - tick.last) < Number.EPSILON;
      const isRecent = Math.abs(lastTick.timestamp - tick.timestamp) < 100;

      if (isSamePrice && isRecent) {
        this.duplicateCount++;
        return null;
      }
    }

    // Update last tick tracker
    this.lastTicks.set(tick.symbol, { price: tick.last, timestamp: tick.timestamp });

    // Calculate derived values
    const mid = tick.bid && tick.ask
      ? (tick.bid + tick.ask) / 2
      : tick.last;

    const spread = tick.bid && tick.ask
      ? tick.ask - tick.bid
      : undefined;

    const spreadPercent = spread && mid > 0
      ? (spread / mid) * 100
      : undefined;

    // Build enriched tick
    const enriched: EnrichedTick = {
      // Pass through original fields
      symbol: tick.symbol,
      last: tick.last,
      bid: tick.bid,
      ask: tick.ask,
      volume: tick.volume,
      changePercent: tick.changePercent,
      timestamp: tick.timestamp,
      source: tick.source,

      // Add enriched fields
      kind: symbolDef.kind,
      name: symbolDef.name,
      mid,
      spread,
      spreadPercent,
      priceFormatted: formatPrice(tick.last, tick.symbol),
      changeFormatted: tick.changePercent !== undefined
        ? formatChange(tick.changePercent)
        : undefined,
    };

    // Emit the enriched tick
    this.emitter.emit('tick', enriched);

    return enriched;
  }

  /**
   * Process multiple ticks in batch.
   */
  processBatch(ticks: NormalizedTick[]): EnrichedTick[] {
    const results: EnrichedTick[] = [];

    for (const tick of ticks) {
      const enriched = this.process(tick);
      if (enriched) {
        results.push(enriched);
      }
    }

    return results;
  }

  /**
   * Subscribe to enriched ticks.
   */
  onTick(handler: EnrichedTickHandler): void {
    this.emitter.on('tick', handler);
  }

  /**
   * Unsubscribe from enriched ticks.
   */
  offTick(handler: EnrichedTickHandler): void {
    this.emitter.off('tick', handler);
  }

  /**
   * Get the last known tick for a symbol.
   */
  getLastTick(symbol: string): { price: number; timestamp: number } | undefined {
    return this.lastTicks.get(symbol);
  }

  /**
   * Clear internal state (for testing).
   */
  reset(): void {
    this.lastTicks.clear();
    this.processedCount = 0;
    this.duplicateCount = 0;
  }
}
