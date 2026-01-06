/**
 * Risk Domain - Type Definitions
 *
 * This file defines all types for the risk management system.
 * Risk management is CRITICAL for a trading platform - the house cannot fail.
 *
 * Risk Layers:
 * 1. Pre-Trade Checks - Before order is accepted
 * 2. Execution Checks - During matching (price slippage, etc.)
 * 3. Post-Trade Monitoring - After execution (exposure, P&L)
 * 4. System-Level Controls - Circuit breakers, kill switches
 *
 * Business Model Context (B-Book):
 * - When users trade, the house takes the opposite position
 * - User BUYS 1 BTC → House is SHORT 1 BTC
 * - User SELLS 1 BTC → House is LONG 1 BTC
 * - We must limit house exposure to prevent catastrophic losses
 */

export type UUID = string;
export type DecimalString = string;

// =============================================================================
// RISK CHECK INPUT/OUTPUT
// =============================================================================

/**
 * Input for pre-trade risk validation.
 * Contains all information needed to assess if an order should be allowed.
 */
export interface RiskCheckInput {
  /** The user's account ID (for the quote currency, e.g., USD) */
  accountId: UUID;

  /** The user ID (for user-level checks) */
  userId: UUID;

  /** Trading pair symbol (e.g., "BTC/USD", "ETH/USD") */
  symbol: string;

  /** Order side: buy or sell */
  side: "buy" | "sell";

  /** Order type */
  type: "market" | "limit" | "stop" | "take_profit";

  /** Limit price (required for limit orders) */
  price?: DecimalString;

  /** Order quantity (in base currency units, e.g., BTC amount) */
  quantity: DecimalString;

  /** Optional: Client's IP for velocity checks */
  clientIp?: string;
}

/**
 * Result of a risk check - either approved or rejected with reason.
 */
export type RiskCheckResult =
  | { approved: true; warnings?: string[] }
  | { approved: false; code: RiskRejectionCode; reason: string };

/**
 * Rejection codes for programmatic handling.
 * Frontend can use these to show appropriate messages.
 */
export type RiskRejectionCode =
  | "INSUFFICIENT_BALANCE" // User doesn't have enough funds
  | "INSUFFICIENT_POSITION" // User doesn't have enough asset to sell
  | "ORDER_SIZE_TOO_SMALL" // Below minimum order size
  | "ORDER_SIZE_TOO_LARGE" // Above maximum single order size
  | "PRICE_DEVIATION" // Limit price too far from market (fat finger protection)
  | "HOUSE_EXPOSURE_LIMIT" // Platform exposure limit reached for this symbol
  | "USER_POSITION_LIMIT" // User has too much exposure to this symbol
  | "USER_DAILY_LOSS_LIMIT" // User exceeded daily loss limit
  | "USER_ORDER_RATE_LIMIT" // Too many orders in short time
  | "SYMBOL_NOT_TRADABLE" // Symbol is halted or not available
  | "MARKET_CLOSED" // Market is closed (for stocks/forex)
  | "CIRCUIT_BREAKER_ACTIVE" // Emergency halt is active
  | "ACCOUNT_RESTRICTED" // User's account has trading restrictions
  | "PRICE_UNAVAILABLE" // Cannot determine market price for validation
  | "INTERNAL_ERROR"; // Unexpected error during risk check

// =============================================================================
// RISK LIMITS CONFIGURATION
// =============================================================================

/**
 * Per-symbol risk limits.
 * Different instruments have different risk profiles.
 */
export interface SymbolRiskLimits {
  /** Trading pair symbol */
  symbol: string;

  /** Is trading currently enabled for this symbol? */
  tradingEnabled: boolean;

  /** Minimum order size (e.g., 0.0001 BTC) */
  minOrderSize: number;

  /** Maximum single order size (e.g., 10 BTC) */
  maxOrderSize: number;

  /** Maximum % deviation from market price for limit orders (e.g., 0.1 = 10%) */
  maxPriceDeviation: number;

  /** Maximum house exposure in base currency units (e.g., 100 BTC) */
  maxHouseExposure: number;

  /** Maximum notional value exposure for the house (e.g., $5,000,000) */
  maxHouseNotionalExposure: number;

  /** Maximum position size per user in base currency (e.g., 5 BTC) */
  maxUserPosition: number;

  /** Tick size for price (e.g., 0.01 for USD pairs) */
  tickSize: number;

  /** Lot size for quantity (e.g., 0.0001 for BTC) */
  lotSize: number;
}

/**
 * Per-user risk limits.
 * Can be customized per user tier or individual user.
 */
export interface UserRiskLimits {
  /** User ID */
  userId: UUID;

  /** Maximum daily loss before trading halt (in quote currency, e.g., USD) */
  dailyLossLimit: number;

  /** Maximum orders per minute (rate limiting) */
  maxOrdersPerMinute: number;

  /** Maximum position value per symbol (in quote currency) */
  maxSymbolPositionValue: number;

  /** Maximum total position value across all symbols */
  maxTotalPositionValue: number;

  /** Is this user restricted from trading? */
  tradingRestricted: boolean;

  /** Restriction reason if applicable */
  restrictionReason?: string;
}

/**
 * Platform-wide risk limits.
 * These are the ultimate backstops.
 */
export interface PlatformRiskLimits {
  /** Is the platform accepting new orders? */
  tradingEnabled: boolean;

  /** Circuit breaker active? (emergency halt) */
  circuitBreakerActive: boolean;

  /** Reason for circuit breaker if active */
  circuitBreakerReason?: string;

  /** Maximum total platform exposure (all symbols combined) */
  maxTotalExposure: number;

  /** Default daily loss limit for new users */
  defaultDailyLossLimit: number;

  /** Default max orders per minute for new users */
  defaultMaxOrdersPerMinute: number;
}

// =============================================================================
// EXPOSURE TRACKING
// =============================================================================

/**
 * House exposure for a single symbol.
 * Tracks how much risk the platform is taking on this instrument.
 */
export interface SymbolExposure {
  symbol: string;

  /** Net position in base currency (negative = short, positive = long) */
  netPosition: number;

  /** Absolute position size (always positive) */
  absolutePosition: number;

  /** Current market price */
  markPrice: number;

  /** Notional value = absolutePosition * markPrice */
  notionalValue: number;

  /** Unrealized P&L for the house */
  unrealizedPnl: number;

  /** Number of users with open positions */
  userCount: number;

  /** Last updated timestamp */
  updatedAt: Date;
}

/**
 * User's exposure/position for a single symbol.
 */
export interface UserSymbolExposure {
  userId: UUID;
  symbol: string;

  /** User's net position (positive = long, negative = short) */
  netPosition: number;

  /** Average entry price */
  entryPrice: number;

  /** Current market price */
  markPrice: number;

  /** User's unrealized P&L */
  unrealizedPnl: number;

  /** User's realized P&L today */
  realizedPnlToday: number;
}

/**
 * User's aggregate risk metrics.
 */
export interface UserRiskMetrics {
  userId: UUID;

  /** Total unrealized P&L across all positions */
  totalUnrealizedPnl: number;

  /** Today's realized P&L */
  todayRealizedPnl: number;

  /** Today's total P&L (realized + unrealized) */
  todayTotalPnl: number;

  /** Number of open positions */
  openPositionCount: number;

  /** Total notional exposure */
  totalNotionalExposure: number;

  /** Orders placed in the last minute */
  recentOrderCount: number;

  /** Current open order count */
  openOrderCount: number;
}

// =============================================================================
// CIRCUIT BREAKER
// =============================================================================

/**
 * Conditions that can trigger a circuit breaker.
 * Values match the database enum.
 */
export type CircuitBreakerTrigger =
  | "manual" // Admin triggered
  | "house_exposure" // Platform exposure exceeded threshold
  | "price_volatility" // Price moved too fast (potential manipulation)
  | "system_error" // Multiple system errors detected
  | "external_event"; // External market event

/**
 * Circuit breaker event record.
 */
export interface CircuitBreakerEvent {
  id: UUID;
  trigger: CircuitBreakerTrigger;
  symbol?: string; // null = platform-wide
  reason: string;
  activatedAt: Date;
  deactivatedAt?: Date;
  activatedBy?: UUID; // Admin user ID if manual
  deactivatedBy?: UUID; // Admin who deactivated
}

// =============================================================================
// SERVICE INTERFACE
// =============================================================================

/**
 * Risk Service Interface.
 *
 * This is the main entry point for all risk-related operations.
 * The OrderService MUST call validatePreTrade before accepting any order.
 */
export interface RiskService {
  // --- Pre-Trade Validation (CRITICAL PATH) ---

  /**
   * Validates an order before it's accepted.
   * This is the primary risk gate - if this rejects, order must not proceed.
   *
   * Checks performed:
   * 1. Account balance / position sufficiency
   * 2. Order size limits (min/max)
   * 3. Price deviation from market (fat finger protection)
   * 4. User position limits
   * 5. User daily loss limits
   * 6. User order rate limits
   * 7. House exposure limits
   * 8. Symbol trading status
   * 9. Platform circuit breaker status
   */
  validatePreTrade(input: RiskCheckInput): Promise<RiskCheckResult>;

  // --- Exposure Queries ---

  /** Get house exposure for a symbol */
  getSymbolExposure(symbol: string): Promise<SymbolExposure | null>;

  /** Get house exposure for all symbols */
  getAllSymbolExposures(): Promise<SymbolExposure[]>;

  /** Get user's exposure for a symbol */
  getUserSymbolExposure(
    userId: UUID,
    symbol: string
  ): Promise<UserSymbolExposure | null>;

  /** Get user's aggregate risk metrics */
  getUserRiskMetrics(userId: UUID): Promise<UserRiskMetrics>;

  // --- Limit Management ---

  /** Get risk limits for a symbol */
  getSymbolLimits(symbol: string): Promise<SymbolRiskLimits>;

  /** Update risk limits for a symbol (admin) */
  updateSymbolLimits(
    symbol: string,
    limits: Partial<SymbolRiskLimits>
  ): Promise<SymbolRiskLimits>;

  /** Get risk limits for a user */
  getUserLimits(userId: UUID): Promise<UserRiskLimits>;

  /** Update risk limits for a user (admin) */
  updateUserLimits(
    userId: UUID,
    limits: Partial<UserRiskLimits>
  ): Promise<UserRiskLimits>;

  // --- Circuit Breaker ---

  /** Activate circuit breaker for a symbol or platform-wide */
  activateCircuitBreaker(
    trigger: CircuitBreakerTrigger,
    reason: string,
    symbol?: string,
    adminUserId?: UUID
  ): Promise<void>;

  /** Deactivate circuit breaker */
  deactivateCircuitBreaker(symbol?: string): Promise<void>;

  /** Check if circuit breaker is active */
  isCircuitBreakerActive(symbol?: string): Promise<boolean>;

  // --- Price Reference ---

  /** Get current market price for risk calculations */
  getMarketPrice(symbol: string): Promise<number | null>;

  /** Update market price (called by market data service) */
  updateMarketPrice(symbol: string, price: number): Promise<void>;
}

// =============================================================================
// REPOSITORY INTERFACE
// =============================================================================

/**
 * Repository for persisting risk-related data.
 */
export interface RiskRepository {
  // Symbol limits
  getSymbolLimits(symbol: string): Promise<SymbolRiskLimits | null>;
  upsertSymbolLimits(limits: SymbolRiskLimits): Promise<void>;
  getAllSymbolLimits(): Promise<SymbolRiskLimits[]>;

  // User limits
  getUserLimits(userId: UUID): Promise<UserRiskLimits | null>;
  upsertUserLimits(limits: UserRiskLimits): Promise<void>;

  // Circuit breaker events
  createCircuitBreakerEvent(
    event: Omit<CircuitBreakerEvent, "id">
  ): Promise<CircuitBreakerEvent>;
  getActiveCircuitBreaker(symbol?: string): Promise<CircuitBreakerEvent | null>;
  deactivateCircuitBreaker(
    id: UUID,
    deactivatedAt: Date,
    deactivatedBy?: UUID
  ): Promise<void>;

  // Order rate tracking (for rate limiting)
  recordOrderAttempt(userId: UUID, timestamp: Date): Promise<void>;
  getRecentOrderCount(userId: UUID, sinceTimestamp: Date): Promise<number>;

  // Daily P&L tracking
  getTodayRealizedPnl(userId: UUID): Promise<number>;

  // Cleanup
  cleanupOldOrderAttempts(olderThan: Date): Promise<number>;
}
