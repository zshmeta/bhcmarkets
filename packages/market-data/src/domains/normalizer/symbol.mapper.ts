/**
 * Symbol Mapper
 * =============
 *
 * Bidirectional symbol mapping between exchanges and our internal format.
 *
 * THE SYMBOL PROBLEM:
 * Every exchange, data provider, and trading system uses different symbol formats:
 *   - Binance: "BTCUSDT" (concatenated, no separator)
 *   - Coinbase: "BTC-USD" (hyphen separator)
 *   - Yahoo: "BTC-USD" or "AAPL" (various formats)
 *   - FIX Protocol: "BTC/USD" (slash separator)
 *   - Internal: "BTC/USD" (we use industry standard)
 *
 * This module centralizes all mapping logic so the rest of the app
 * only deals with our internal format.
 */

import {
  ALL_SYMBOLS,
  SYMBOL_MAP,
  type SymbolDefinition,
} from '../../config/symbols.js';

/**
 * Supported external symbol formats.
 */
export type ExternalSource = 'binance' | 'yahoo' | 'coinbase' | 'finnhub';

/**
 * Pre-computed reverse lookup maps.
 * Built once at module load for O(1) lookups.
 */
const reverseMaps = new Map<ExternalSource, Map<string, string>>();

// Build reverse maps for each source
function buildReverseMaps(): void {
  const sources: ExternalSource[] = ['binance', 'yahoo'];

  for (const source of sources) {
    const reverseMap = new Map<string, string>();

    for (const symbol of ALL_SYMBOLS) {
      const externalSymbol = symbol.sources[source as keyof typeof symbol.sources];
      if (externalSymbol) {
        // Store lowercase version for case-insensitive lookup
        reverseMap.set(externalSymbol.toLowerCase(), symbol.symbol);
      }
    }

    reverseMaps.set(source, reverseMap);
  }
}

// Initialize on module load
buildReverseMaps();

/**
 * Convert an external symbol to our internal format.
 *
 * @param externalSymbol - Symbol from external source (e.g., "btcusdt")
 * @param source - Which source the symbol came from
 * @returns Internal symbol or undefined if not found
 *
 * @example
 * toInternal('btcusdt', 'binance') // Returns 'BTC/USD'
 * toInternal('AAPL', 'yahoo')       // Returns 'AAPL'
 * toInternal('unknown', 'binance')  // Returns undefined
 */
export function toInternal(externalSymbol: string, source: ExternalSource): string | undefined {
  const reverseMap = reverseMaps.get(source);
  if (!reverseMap) return undefined;

  return reverseMap.get(externalSymbol.toLowerCase());
}

/**
 * Convert an internal symbol to external format.
 *
 * @param internalSymbol - Our internal symbol (e.g., "BTC/USD")
 * @param source - Target source format
 * @returns External symbol or undefined if no mapping exists
 *
 * @example
 * toExternal('BTC/USD', 'binance') // Returns 'btcusdt'
 * toExternal('AAPL', 'yahoo')      // Returns 'AAPL'
 */
export function toExternal(internalSymbol: string, source: ExternalSource): string | undefined {
  const symbolDef = SYMBOL_MAP.get(internalSymbol);
  if (!symbolDef) return undefined;

  return symbolDef.sources[source as keyof typeof symbolDef.sources];
}

/**
 * Get full symbol definition by internal symbol.
 */
export function getDefinition(internalSymbol: string): SymbolDefinition | undefined {
  return SYMBOL_MAP.get(internalSymbol);
}

/**
 * Check if a symbol is valid (exists in our system).
 */
export function isValidSymbol(internalSymbol: string): boolean {
  return SYMBOL_MAP.has(internalSymbol);
}

/**
 * Format a price according to the symbol's tick size.
 *
 * @param price - Raw price value
 * @param internalSymbol - Symbol to determine formatting
 * @returns Formatted price string
 *
 * @example
 * formatPrice(16543.789, 'BTC/USD')  // Returns "16543.79"
 * formatPrice(1.23456, 'EUR/USD')    // Returns "1.23456"
 */
export function formatPrice(price: number, internalSymbol: string): string {
  const symbolDef = SYMBOL_MAP.get(internalSymbol);
  if (!symbolDef) {
    // Default to 2 decimal places
    return price.toFixed(2);
  }

  // Calculate decimal places from tick size
  // tickSize of 0.01 means 2 decimal places
  // tickSize of 0.00001 means 5 decimal places
  const decimalPlaces = Math.max(0, -Math.floor(Math.log10(symbolDef.tickSize)));

  return price.toFixed(decimalPlaces);
}

/**
 * Format a percentage change for display.
 *
 * @param changePercent - Change as a decimal (e.g., 2.34 for +2.34%)
 * @returns Formatted string with sign (e.g., "+2.34%")
 */
export function formatChange(changePercent: number): string {
  const sign = changePercent >= 0 ? '+' : '';
  return `${sign}${changePercent.toFixed(2)}%`;
}
