/**
 * Symbol Configuration
 * ====================
 *
 * This file defines all the assets we track across different data sources.
 *
 * KEY CONCEPT: Symbol Mapping
 * ---------------------------
 * Different exchanges use different symbol formats:
 *   - Binance:  "BTCUSDT" (no separator)
 *   - Yahoo:    "BTC-USD" (hyphen separator)
 *   - Internal: "BTC/USD" (slash separator, matches trading industry standard)
 *
 * We use our internal format everywhere in the app, and map to/from
 * exchange-specific formats only at the collector boundary.
 *
 * WHY WE SEPARATE BY ASSET CLASS:
 * - Different data sources are better for different asset classes
 * - Binance is excellent for crypto (free real-time WebSocket)
 * - Yahoo Finance covers everything else adequately for free
 * - This separation allows us to add specialized sources later
 *   (e.g., Polygon.io for US stocks if we need faster updates)
 */

/**
 * Asset categories supported by the system.
 * Maps to different data collection strategies.
 */
export type AssetKind = 'crypto' | 'forex' | 'stock' | 'index' | 'commodity';

/**
 * Complete definition of a tradeable symbol.
 * This is the source of truth for what assets the platform supports.
 */
export interface SymbolDefinition {
  /** Our internal canonical symbol (e.g., "BTC/USD") */
  symbol: string;

  /** Human-readable name for UI display */
  name: string;

  /** Asset category - determines which collector handles it */
  kind: AssetKind;

  /** Base currency/asset (e.g., "BTC" in BTC/USD) */
  base: string;

  /** Quote currency (e.g., "USD" in BTC/USD) */
  quote: string;

  /** Minimum price movement (for display formatting) */
  tickSize: number;

  /** Minimum quantity movement */
  lotSize: number;

  /** Exchange-specific symbol mappings */
  sources: {
    /** Binance WebSocket symbol (e.g., "btcusdt") - lowercase required */
    binance?: string;
    /** Yahoo Finance symbol (e.g., "BTC-USD") */
    yahoo?: string;
  };
}

/**
 * CRYPTOCURRENCY SYMBOLS
 * ======================
 * Source: Binance WebSocket (primary) - FREE, real-time, sub-100ms latency
 *
 * We track the top cryptocurrencies by market cap and trading volume.
 * Binance is the world's largest crypto exchange by volume, so their
 * prices are highly representative of the broader market.
 */
export const CRYPTO_SYMBOLS: SymbolDefinition[] = [
  // Major cryptocurrencies
  { symbol: 'BTC/USD', name: 'Bitcoin', kind: 'crypto', base: 'BTC', quote: 'USD', tickSize: 0.01, lotSize: 0.00001, sources: { binance: 'btcusdt', yahoo: 'BTC-USD' } },
  { symbol: 'ETH/USD', name: 'Ethereum', kind: 'crypto', base: 'ETH', quote: 'USD', tickSize: 0.01, lotSize: 0.0001, sources: { binance: 'ethusdt', yahoo: 'ETH-USD' } },
  { symbol: 'BNB/USD', name: 'BNB', kind: 'crypto', base: 'BNB', quote: 'USD', tickSize: 0.01, lotSize: 0.001, sources: { binance: 'bnbusdt', yahoo: 'BNB-USD' } },
  { symbol: 'XRP/USD', name: 'Ripple', kind: 'crypto', base: 'XRP', quote: 'USD', tickSize: 0.0001, lotSize: 0.1, sources: { binance: 'xrpusdt', yahoo: 'XRP-USD' } },
  { symbol: 'SOL/USD', name: 'Solana', kind: 'crypto', base: 'SOL', quote: 'USD', tickSize: 0.01, lotSize: 0.01, sources: { binance: 'solusdt', yahoo: 'SOL-USD' } },
  { symbol: 'ADA/USD', name: 'Cardano', kind: 'crypto', base: 'ADA', quote: 'USD', tickSize: 0.0001, lotSize: 1, sources: { binance: 'adausdt', yahoo: 'ADA-USD' } },
  { symbol: 'DOGE/USD', name: 'Dogecoin', kind: 'crypto', base: 'DOGE', quote: 'USD', tickSize: 0.00001, lotSize: 1, sources: { binance: 'dogeusdt', yahoo: 'DOGE-USD' } },
  { symbol: 'DOT/USD', name: 'Polkadot', kind: 'crypto', base: 'DOT', quote: 'USD', tickSize: 0.001, lotSize: 0.1, sources: { binance: 'dotusdt', yahoo: 'DOT-USD' } },
  { symbol: 'AVAX/USD', name: 'Avalanche', kind: 'crypto', base: 'AVAX', quote: 'USD', tickSize: 0.01, lotSize: 0.01, sources: { binance: 'avaxusdt', yahoo: 'AVAX-USD' } },
  { symbol: 'LINK/USD', name: 'Chainlink', kind: 'crypto', base: 'LINK', quote: 'USD', tickSize: 0.001, lotSize: 0.01, sources: { binance: 'linkusdt', yahoo: 'LINK-USD' } },
  { symbol: 'MATIC/USD', name: 'Polygon', kind: 'crypto', base: 'MATIC', quote: 'USD', tickSize: 0.0001, lotSize: 1, sources: { binance: 'maticusdt', yahoo: 'MATIC-USD' } },
  { symbol: 'LTC/USD', name: 'Litecoin', kind: 'crypto', base: 'LTC', quote: 'USD', tickSize: 0.01, lotSize: 0.001, sources: { binance: 'ltcusdt', yahoo: 'LTC-USD' } },

  // Stablecoins (useful for monitoring peg stability)
  { symbol: 'USDC/USD', name: 'USD Coin', kind: 'crypto', base: 'USDC', quote: 'USD', tickSize: 0.0001, lotSize: 1, sources: { binance: 'usdcusdt', yahoo: 'USDC-USD' } },
];

/**
 * FOREX SYMBOLS
 * =============
 * Source: Yahoo Finance (polling every 15 seconds)
 *
 * Major and minor currency pairs. Forex markets are open 24/5
 * (Sunday 5pm ET to Friday 5pm ET).
 *
 * NOTE: Yahoo's forex data has ~15 minute delay for free tier.
 * This is acceptable for a demo/learning platform but would need
 * upgrade for live trading.
 */
export const FOREX_SYMBOLS: SymbolDefinition[] = [
  // Major pairs (most liquid, tightest spreads)
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', kind: 'forex', base: 'EUR', quote: 'USD', tickSize: 0.00001, lotSize: 1000, sources: { yahoo: 'EURUSD=X' } },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', kind: 'forex', base: 'GBP', quote: 'USD', tickSize: 0.00001, lotSize: 1000, sources: { yahoo: 'GBPUSD=X' } },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', kind: 'forex', base: 'USD', quote: 'JPY', tickSize: 0.001, lotSize: 1000, sources: { yahoo: 'USDJPY=X' } },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', kind: 'forex', base: 'USD', quote: 'CHF', tickSize: 0.00001, lotSize: 1000, sources: { yahoo: 'USDCHF=X' } },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', kind: 'forex', base: 'AUD', quote: 'USD', tickSize: 0.00001, lotSize: 1000, sources: { yahoo: 'AUDUSD=X' } },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', kind: 'forex', base: 'USD', quote: 'CAD', tickSize: 0.00001, lotSize: 1000, sources: { yahoo: 'USDCAD=X' } },
  { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', kind: 'forex', base: 'NZD', quote: 'USD', tickSize: 0.00001, lotSize: 1000, sources: { yahoo: 'NZDUSD=X' } },

  // Cross pairs
  { symbol: 'EUR/GBP', name: 'Euro / British Pound', kind: 'forex', base: 'EUR', quote: 'GBP', tickSize: 0.00001, lotSize: 1000, sources: { yahoo: 'EURGBP=X' } },
  { symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', kind: 'forex', base: 'EUR', quote: 'JPY', tickSize: 0.001, lotSize: 1000, sources: { yahoo: 'EURJPY=X' } },
  { symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen', kind: 'forex', base: 'GBP', quote: 'JPY', tickSize: 0.001, lotSize: 1000, sources: { yahoo: 'GBPJPY=X' } },
];

/**
 * STOCK SYMBOLS
 * =============
 * Source: Yahoo Finance (polling every 15 seconds)
 *
 * Major US tech stocks and blue chips. These are the most commonly
 * traded equities and provide good examples for the platform.
 *
 * MARKET HOURS: NYSE/NASDAQ open 9:30am-4:00pm ET, Mon-Fri
 * Outside these hours, prices won't update (except pre/post market).
 */
export const STOCK_SYMBOLS: SymbolDefinition[] = [
  // Mega-cap tech (the "Magnificent 7" and friends)
  { symbol: 'AAPL', name: 'Apple Inc.', kind: 'stock', base: 'AAPL', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: 'AAPL' } },
  { symbol: 'MSFT', name: 'Microsoft Corporation', kind: 'stock', base: 'MSFT', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: 'MSFT' } },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', kind: 'stock', base: 'GOOGL', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: 'GOOGL' } },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', kind: 'stock', base: 'AMZN', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: 'AMZN' } },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', kind: 'stock', base: 'NVDA', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: 'NVDA' } },
  { symbol: 'META', name: 'Meta Platforms Inc.', kind: 'stock', base: 'META', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: 'META' } },
  { symbol: 'TSLA', name: 'Tesla Inc.', kind: 'stock', base: 'TSLA', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: 'TSLA' } },

  // Financial sector
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', kind: 'stock', base: 'JPM', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: 'JPM' } },
  { symbol: 'V', name: 'Visa Inc.', kind: 'stock', base: 'V', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: 'V' } },

  // Healthcare
  { symbol: 'JNJ', name: 'Johnson & Johnson', kind: 'stock', base: 'JNJ', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: 'JNJ' } },
];

/**
 * INDEX SYMBOLS
 * =============
 * Source: Yahoo Finance (polling every 30 seconds)
 *
 * Major market indices. These don't trade directly but are useful
 * for showing overall market direction.
 *
 * NOTE: Index values are calculated, not traded, so they update
 * less frequently than individual stocks.
 */
export const INDEX_SYMBOLS: SymbolDefinition[] = [
  // US indices
  { symbol: 'SPX', name: 'S&P 500', kind: 'index', base: 'SPX', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: '^GSPC' } },
  { symbol: 'NDX', name: 'NASDAQ 100', kind: 'index', base: 'NDX', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: '^NDX' } },
  { symbol: 'DJI', name: 'Dow Jones Industrial Average', kind: 'index', base: 'DJI', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: '^DJI' } },
  { symbol: 'VIX', name: 'CBOE Volatility Index', kind: 'index', base: 'VIX', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: '^VIX' } },

  // International indices
  { symbol: 'FTSE', name: 'FTSE 100', kind: 'index', base: 'FTSE', quote: 'GBP', tickSize: 0.01, lotSize: 1, sources: { yahoo: '^FTSE' } },
  { symbol: 'DAX', name: 'DAX', kind: 'index', base: 'DAX', quote: 'EUR', tickSize: 0.01, lotSize: 1, sources: { yahoo: '^GDAXI' } },
  { symbol: 'N225', name: 'Nikkei 225', kind: 'index', base: 'N225', quote: 'JPY', tickSize: 0.01, lotSize: 1, sources: { yahoo: '^N225' } },
];

/**
 * COMMODITY SYMBOLS
 * =================
 * Source: Yahoo Finance (polling every 30 seconds)
 *
 * Major commodities via futures contracts. The "=F" suffix in Yahoo
 * indicates a futures contract.
 */
export const COMMODITY_SYMBOLS: SymbolDefinition[] = [
  // Precious metals
  { symbol: 'XAU/USD', name: 'Gold', kind: 'commodity', base: 'XAU', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: 'GC=F' } },
  { symbol: 'XAG/USD', name: 'Silver', kind: 'commodity', base: 'XAG', quote: 'USD', tickSize: 0.001, lotSize: 1, sources: { yahoo: 'SI=F' } },

  // Energy
  { symbol: 'WTI', name: 'Crude Oil WTI', kind: 'commodity', base: 'WTI', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: 'CL=F' } },
  { symbol: 'BRENT', name: 'Brent Crude Oil', kind: 'commodity', base: 'BRENT', quote: 'USD', tickSize: 0.01, lotSize: 1, sources: { yahoo: 'BZ=F' } },
  { symbol: 'NATGAS', name: 'Natural Gas', kind: 'commodity', base: 'NATGAS', quote: 'USD', tickSize: 0.001, lotSize: 1, sources: { yahoo: 'NG=F' } },
];

/**
 * ALL SYMBOLS
 * ===========
 * Combined list of all tracked symbols. Used by the collector registry
 * to determine which symbols each collector should handle.
 */
export const ALL_SYMBOLS: SymbolDefinition[] = [
  ...CRYPTO_SYMBOLS,
  ...FOREX_SYMBOLS,
  ...STOCK_SYMBOLS,
  ...INDEX_SYMBOLS,
  ...COMMODITY_SYMBOLS,
];

/**
 * Lookup map for fast symbol resolution.
 * O(1) lookup instead of O(n) array search.
 */
export const SYMBOL_MAP = new Map<string, SymbolDefinition>(
  ALL_SYMBOLS.map(s => [s.symbol, s])
);

/**
 * Get symbol definition by canonical symbol name.
 */
export function getSymbolDef(symbol: string): SymbolDefinition | undefined {
  return SYMBOL_MAP.get(symbol);
}

/**
 * Get all symbols handled by a specific source.
 */
export function getSymbolsForSource(source: 'binance' | 'yahoo'): SymbolDefinition[] {
  return ALL_SYMBOLS.filter(s => s.sources[source] !== undefined);
}
