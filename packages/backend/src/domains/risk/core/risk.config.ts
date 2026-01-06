/**
 * Risk Domain - Default Configuration
 *
 * This file contains default risk limits and configuration.
 * These values should be tuned based on:
 * - Business model (B-book vs A-book)
 * - Capital reserves
 * - Market volatility of traded instruments
 * - Regulatory requirements
 *
 * IMPORTANT: These are DEFAULTS. Production values should be
 * stored in the database and configurable by admins.
 */

import type {
  SymbolRiskLimits,
  UserRiskLimits,
  PlatformRiskLimits,
} from "./risk.types.js";

// =============================================================================
// PLATFORM-WIDE DEFAULTS
// =============================================================================

/**
 * Default platform-wide risk limits.
 * These are the ultimate backstops for the entire platform.
 */
export const DEFAULT_PLATFORM_LIMITS: PlatformRiskLimits = {
  // Trading is enabled by default
  tradingEnabled: true,

  // Circuit breaker is off by default
  circuitBreakerActive: false,

  // Maximum total exposure across all symbols: $10 million
  // This should be based on your capital reserves
  maxTotalExposure: 10_000_000,

  // Default daily loss limit for new users: $10,000
  defaultDailyLossLimit: 10_000,

  // Default order rate limit: 60 orders per minute
  defaultMaxOrdersPerMinute: 60,
};

// =============================================================================
// SYMBOL-SPECIFIC DEFAULTS
// =============================================================================

/**
 * Default risk limits for different asset classes.
 * Crypto is more volatile, so tighter limits.
 * Forex is more liquid, so larger sizes allowed.
 */

/** Default limits for cryptocurrency pairs (e.g., BTC/USD) */
export const DEFAULT_CRYPTO_LIMITS: Omit<SymbolRiskLimits, "symbol"> = {
  tradingEnabled: true,

  // Minimum order: 0.0001 units (e.g., $10 worth at $100k BTC)
  minOrderSize: 0.0001,

  // Maximum single order: 10 units (e.g., $1M worth at $100k BTC)
  maxOrderSize: 10,

  // Allow 5% deviation from market price for limit orders
  // Crypto is volatile, so we allow more room
  maxPriceDeviation: 0.05,

  // Maximum house exposure: 50 units
  // At $100k BTC, this is $5M max exposure per symbol
  maxHouseExposure: 50,

  // Maximum notional exposure: $5 million
  maxHouseNotionalExposure: 5_000_000,

  // Maximum position per user: 5 units
  maxUserPosition: 5,

  // Price tick size: $0.01
  tickSize: 0.01,

  // Quantity lot size: 0.0001 units
  lotSize: 0.0001,
};

/** Default limits for forex pairs (e.g., EUR/USD) */
export const DEFAULT_FOREX_LIMITS: Omit<SymbolRiskLimits, "symbol"> = {
  tradingEnabled: true,

  // Minimum order: 1,000 units (micro lot)
  minOrderSize: 1000,

  // Maximum single order: 1,000,000 units (10 standard lots)
  maxOrderSize: 1_000_000,

  // Allow 0.5% deviation - forex is less volatile
  maxPriceDeviation: 0.005,

  // Maximum house exposure: 10 million units
  maxHouseExposure: 10_000_000,

  // Maximum notional: $10 million
  maxHouseNotionalExposure: 10_000_000,

  // Maximum per user: 500,000 units (5 standard lots)
  maxUserPosition: 500_000,

  // Price tick: 0.00001 (5 decimal places for forex)
  tickSize: 0.00001,

  // Lot size: 1000 (micro lot)
  lotSize: 1000,
};

/** Default limits for commodities (e.g., XAU/USD - Gold) */
export const DEFAULT_COMMODITY_LIMITS: Omit<SymbolRiskLimits, "symbol"> = {
  tradingEnabled: true,

  // Minimum: 0.01 oz
  minOrderSize: 0.01,

  // Maximum single order: 100 oz
  maxOrderSize: 100,

  // Allow 2% deviation
  maxPriceDeviation: 0.02,

  // Maximum house exposure: 500 oz
  maxHouseExposure: 500,

  // Maximum notional: $1 million
  maxHouseNotionalExposure: 1_000_000,

  // Maximum per user: 50 oz
  maxUserPosition: 50,

  // Price tick: $0.01
  tickSize: 0.01,

  // Lot size: 0.01 oz
  lotSize: 0.01,
};

// =============================================================================
// SYMBOL CLASSIFICATION
// =============================================================================

/**
 * Determines the asset class of a symbol for default limit assignment.
 */
export type AssetClass = "crypto" | "forex" | "commodity" | "stock" | "unknown";

/**
 * Classifies a symbol into an asset class based on naming convention.
 *
 * Convention:
 * - Crypto: Contains BTC, ETH, SOL, etc. (or ends with -USD, -USDT)
 * - Forex: Standard 6-letter pairs (EURUSD, GBPUSD) or with slash
 * - Commodity: XAU, XAG, OIL, etc.
 */
export function classifySymbol(symbol: string): AssetClass {
  const upper = symbol.toUpperCase().replace("/", "");

  // Crypto detection
  const cryptoTokens = [
    "BTC",
    "ETH",
    "SOL",
    "XRP",
    "ADA",
    "DOT",
    "DOGE",
    "AVAX",
    "MATIC",
    "LINK",
    "UNI",
    "USDT",
    "USDC",
  ];
  if (cryptoTokens.some((token) => upper.includes(token))) {
    return "crypto";
  }

  // Commodity detection
  const commodityTokens = ["XAU", "XAG", "OIL", "WTI", "BRENT", "NATGAS"];
  if (commodityTokens.some((token) => upper.includes(token))) {
    return "commodity";
  }

  // Forex detection (6 letter codes like EURUSD)
  const forexPattern = /^[A-Z]{6}$/;
  const forexCurrencies = [
    "EUR",
    "USD",
    "GBP",
    "JPY",
    "CHF",
    "AUD",
    "NZD",
    "CAD",
  ];
  if (forexPattern.test(upper)) {
    const base = upper.slice(0, 3);
    const quote = upper.slice(3);
    if (forexCurrencies.includes(base) && forexCurrencies.includes(quote)) {
      return "forex";
    }
  }

  // Slash format forex (EUR/USD)
  if (symbol.includes("/")) {
    const [base, quote] = symbol.toUpperCase().split("/");
    if (
      base &&
      quote &&
      forexCurrencies.includes(base) &&
      forexCurrencies.includes(quote)
    ) {
      return "forex";
    }
  }

  return "unknown";
}

/**
 * Gets default risk limits for a symbol based on its asset class.
 */
export function getDefaultSymbolLimits(symbol: string): SymbolRiskLimits {
  const assetClass = classifySymbol(symbol);

  switch (assetClass) {
    case "crypto":
      return { symbol, ...DEFAULT_CRYPTO_LIMITS };
    case "forex":
      return { symbol, ...DEFAULT_FOREX_LIMITS };
    case "commodity":
      return { symbol, ...DEFAULT_COMMODITY_LIMITS };
    default:
      // For unknown symbols, use conservative crypto-like limits
      return { symbol, ...DEFAULT_CRYPTO_LIMITS, tradingEnabled: false };
  }
}

// =============================================================================
// USER DEFAULTS
// =============================================================================

/**
 * Gets default risk limits for a new user.
 */
export function getDefaultUserLimits(userId: string): UserRiskLimits {
  return {
    userId,

    // Daily loss limit: $10,000
    dailyLossLimit: DEFAULT_PLATFORM_LIMITS.defaultDailyLossLimit,

    // Rate limit: 60 orders per minute
    maxOrdersPerMinute: DEFAULT_PLATFORM_LIMITS.defaultMaxOrdersPerMinute,

    // Maximum position value per symbol: $100,000
    maxSymbolPositionValue: 100_000,

    // Maximum total position value: $500,000
    maxTotalPositionValue: 500_000,

    // Not restricted by default
    tradingRestricted: false,
  };
}

// =============================================================================
// RISK THRESHOLDS
// =============================================================================

/**
 * Thresholds that trigger warnings or automatic actions.
 */
export const RISK_THRESHOLDS = {
  /**
   * Exposure warning threshold (% of max).
   * When house exposure reaches this %, emit a warning.
   */
  EXPOSURE_WARNING_PERCENT: 0.7, // 70%

  /**
   * Exposure critical threshold (% of max).
   * When reached, consider enabling circuit breaker.
   */
  EXPOSURE_CRITICAL_PERCENT: 0.9, // 90%

  /**
   * Price staleness threshold (seconds).
   * If market price is older than this, reject market orders.
   */
  PRICE_STALENESS_SECONDS: 60,

  /**
   * Rate limit window (seconds).
   * How far back to look when counting orders.
   */
  RATE_LIMIT_WINDOW_SECONDS: 60,

  /**
   * Minimum liquidity depth required for market orders.
   * Below this, market orders should be rejected.
   */
  MIN_LIQUIDITY_DEPTH: 0.1, // 10% of order size

  /**
   * Daily P&L reset time (UTC hour).
   * When does the "trading day" reset for daily limits.
   */
  DAILY_RESET_HOUR_UTC: 0, // Midnight UTC
};
