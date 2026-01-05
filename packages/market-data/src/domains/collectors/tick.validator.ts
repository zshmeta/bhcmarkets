/**
 * Tick Validator
 * ==============
 *
 * Validates incoming tick data before it enters the system.
 *
 * WHY VALIDATE:
 * - Data sources can send garbage (malformed JSON, NaN values)
 * - Prevents invalid data from corrupting our cache/database
 * - Catches obvious errors early (negative prices, future timestamps)
 * - Helps debug data source issues
 *
 * VALIDATION RULES:
 * 1. Required fields must be present
 * 2. Prices must be positive numbers
 * 3. Timestamps must be reasonable (not in future, not too old)
 * 4. Symbol must match our known symbols
 */

import { z } from 'zod';
import { SYMBOL_MAP } from '../../config/symbols.js';
import type { NormalizedTick } from './collector.types.js';

/**
 * Maximum age for a tick timestamp (5 minutes).
 * Ticks older than this are considered stale and rejected.
 *
 * WHY 5 MINUTES:
 * - Yahoo Finance can have delays up to 15 minutes, but usually much less
 * - We want to catch obvious clock sync issues
 * - 5 minutes gives enough buffer for network latency
 */
const MAX_TICK_AGE_MS = 5 * 60 * 1000;

/**
 * Maximum time in the future a tick can be (30 seconds).
 * Handles minor clock drift between us and data sources.
 */
const MAX_FUTURE_MS = 30 * 1000;

/**
 * Zod schema for tick validation.
 * Using Zod because it provides excellent error messages
 * and is already in our dependency tree.
 */
const tickSchema = z.object({
  symbol: z.string().min(1),
  last: z.number().positive(),
  bid: z.number().positive().optional(),
  ask: z.number().positive().optional(),
  volume: z.number().min(0).optional(),
  changePercent: z.number().optional(),
  timestamp: z.number().int().positive(),
  source: z.string().min(1),
});

/**
 * Validation result with typed error details.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  tick?: NormalizedTick;
}

/**
 * Validate a single tick.
 *
 * @param tick - The tick to validate
 * @param strictSymbol - If true, reject unknown symbols. If false, allow any symbol.
 * @returns Validation result with error message if invalid
 */
export function validateTick(tick: unknown, strictSymbol = true): ValidationResult {
  // Step 1: Schema validation (types and basic constraints)
  const schemaResult = tickSchema.safeParse(tick);

  if (!schemaResult.success) {
    const firstError = schemaResult.error.errors[0];
    return {
      valid: false,
      error: `Schema error: ${firstError?.path.join('.')}: ${firstError?.message}`,
    };
  }

  const validTick = schemaResult.data as NormalizedTick;

  // Step 2: Symbol validation (must be in our known symbols)
  if (strictSymbol && !SYMBOL_MAP.has(validTick.symbol)) {
    return {
      valid: false,
      error: `Unknown symbol: ${validTick.symbol}`,
    };
  }

  // Step 3: Timestamp validation
  const now = Date.now();

  // Not in the future (with small buffer)
  if (validTick.timestamp > now + MAX_FUTURE_MS) {
    return {
      valid: false,
      error: `Timestamp in future: ${new Date(validTick.timestamp).toISOString()}`,
    };
  }

  // Not too old
  if (validTick.timestamp < now - MAX_TICK_AGE_MS) {
    return {
      valid: false,
      error: `Timestamp too old: ${new Date(validTick.timestamp).toISOString()}`,
    };
  }

  // Step 4: Bid/Ask spread validation (if both present)
  // Ask should be >= Bid (can be equal for very liquid markets)
  if (validTick.bid !== undefined && validTick.ask !== undefined) {
    if (validTick.ask < validTick.bid) {
      return {
        valid: false,
        error: `Invalid spread: bid (${validTick.bid}) > ask (${validTick.ask})`,
      };
    }

    // Spread shouldn't be more than 10% (extreme but catches obvious errors)
    const spreadPct = ((validTick.ask - validTick.bid) / validTick.bid) * 100;
    if (spreadPct > 10) {
      return {
        valid: false,
        error: `Spread too wide: ${spreadPct.toFixed(2)}% (bid=${validTick.bid}, ask=${validTick.ask})`,
      };
    }
  }

  // Step 5: Price sanity check
  // Last price should be within bid-ask spread if both are present
  if (validTick.bid !== undefined && validTick.ask !== undefined) {
    // Allow small tolerance for timing differences
    const tolerance = (validTick.ask - validTick.bid) * 0.1;
    if (validTick.last < validTick.bid - tolerance || validTick.last > validTick.ask + tolerance) {
      // Don't reject, but this is suspicious - just log in caller
      // Some markets have quirks where last price can be outside spread
    }
  }

  return {
    valid: true,
    tick: validTick,
  };
}

/**
 * Batch validate multiple ticks.
 * Returns only the valid ticks.
 *
 * @param ticks - Array of ticks to validate
 * @param strictSymbol - If true, reject unknown symbols
 * @returns Object with valid ticks and error count
 */
export function validateTicks(
  ticks: unknown[],
  strictSymbol = true
): { valid: NormalizedTick[]; errorCount: number; errors: string[] } {
  const valid: NormalizedTick[] = [];
  const errors: string[] = [];

  for (const tick of ticks) {
    const result = validateTick(tick, strictSymbol);
    if (result.valid && result.tick) {
      valid.push(result.tick);
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  return {
    valid,
    errorCount: errors.length,
    errors: errors.slice(0, 10), // Limit error messages
  };
}
