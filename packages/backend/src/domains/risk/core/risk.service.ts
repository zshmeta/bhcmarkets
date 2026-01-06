/**
 * Risk Service - Core Business Logic
 *
 * This is the brain of the risk management system.
 * Every order MUST pass through validatePreTrade() before being accepted.
 *
 * The service performs multiple layers of checks:
 *
 * Layer 1 - System Status
 *   - Is the platform accepting orders?
 *   - Is there an active circuit breaker?
 *   - Is this symbol tradable?
 *
 * Layer 2 - User Eligibility
 *   - Is the user's account in good standing?
 *   - Is the user rate-limited?
 *   - Has the user exceeded daily loss limits?
 *
 * Layer 3 - Order Validation
 *   - Is the order size within limits?
 *   - Is the limit price reasonable (fat finger protection)?
 *   - Does the user have sufficient balance/position?
 *
 * Layer 4 - Exposure Management
 *   - Would this order exceed user position limits?
 *   - Would this order exceed house exposure limits?
 *
 * Design Philosophy:
 * - Fail FAST: Check cheapest/most common failures first
 * - Fail SAFE: When in doubt, reject the order
 * - Be TRANSPARENT: Provide clear rejection reasons
 * - Be AUDITABLE: Log all risk decisions
 */

import type {
  RiskCheckInput,
  RiskCheckResult,
  RiskService,
  SymbolExposure,
  SymbolRiskLimits,
  UserRiskLimits,
  UserRiskMetrics,
  UserSymbolExposure,
  CircuitBreakerTrigger,
  RiskRepository,
  PlatformRiskLimits,
  UUID,
} from "./risk.types.js";
import { RiskError } from "./risk.errors.js";
import {
  getDefaultSymbolLimits,
  getDefaultUserLimits,
  RISK_THRESHOLDS,
  DEFAULT_PLATFORM_LIMITS,
} from "./risk.config.js";

// =============================================================================
// DEPENDENCIES
// =============================================================================

/**
 * External dependencies required by the Risk Service.
 */
export interface RiskServiceDependencies {
  /** Repository for persisting risk data */
  repository: RiskRepository;

  /**
   * Function to get user's available balance.
   * Injected from AccountService to avoid circular dependency.
   */
  getAvailableBalance: (accountId: UUID) => Promise<string>;

  /**
   * Function to get user's position for a symbol.
   * Returns quantity as string, null if no position.
   */
  getUserPosition: (
    accountId: UUID,
    symbol: string
  ) => Promise<{ quantity: string; side: string } | null>;

  /**
   * Function to get total user positions across all symbols.
   * Used for aggregate exposure calculation.
   */
  getUserTotalExposure: (userId: UUID) => Promise<number>;

  /**
   * Function to get house net position for a symbol.
   * House position = negative of sum of all user positions.
   */
  getHouseNetPosition: (symbol: string) => Promise<number>;

  /**
   * Optional logger for risk decisions.
   */
  logger?: {
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
  };
}

// =============================================================================
// IN-MEMORY CACHES
// =============================================================================

/**
 * In-memory cache for market prices.
 * Updated by market data service, read by risk checks.
 */
interface PriceCache {
  [symbol: string]: {
    price: number;
    updatedAt: Date;
  };
}

/**
 * In-memory cache for symbol limits.
 * Reloaded periodically or on admin update.
 */
interface LimitsCache {
  symbols: Map<string, SymbolRiskLimits>;
  platform: PlatformRiskLimits;
  lastReload: Date;
}

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

/**
 * Creates a Risk Service instance.
 *
 * @param deps - External dependencies
 * @returns RiskService implementation
 */
export function createRiskService(deps: RiskServiceDependencies): RiskService {
  const {
    repository,
    getAvailableBalance,
    getUserPosition,
    getHouseNetPosition,
    getUserTotalExposure,
    logger,
  } = deps;

  // --- In-Memory State ---
  const priceCache: PriceCache = {};
  const limitsCache: LimitsCache = {
    symbols: new Map(),
    platform: { ...DEFAULT_PLATFORM_LIMITS },
    lastReload: new Date(0), // Force initial load
  };

  // --- Helper Functions ---

  /**
   * Gets the current market price for a symbol.
   * Returns null if price is unavailable or stale.
   */
  function getPrice(symbol: string): number | null {
    const cached = priceCache[symbol];
    if (!cached) return null;

    // Check staleness
    const ageSeconds = (Date.now() - cached.updatedAt.getTime()) / 1000;
    if (ageSeconds > RISK_THRESHOLDS.PRICE_STALENESS_SECONDS) {
      logger?.warn("stale_price", { symbol, ageSeconds });
      return null;
    }

    return cached.price;
  }

  /**
   * Gets risk limits for a symbol, using defaults if not configured.
   */
  async function getSymbolLimitsInternal(
    symbol: string
  ): Promise<SymbolRiskLimits> {
    // Check cache first
    const cached = limitsCache.symbols.get(symbol);
    if (cached) return cached;

    // Try to load from database
    const stored = await repository.getSymbolLimits(symbol);
    if (stored) {
      limitsCache.symbols.set(symbol, stored);
      return stored;
    }

    // Use defaults based on symbol classification
    const defaults = getDefaultSymbolLimits(symbol);
    limitsCache.symbols.set(symbol, defaults);
    return defaults;
  }

  /**
   * Gets risk limits for a user, using defaults if not configured.
   */
  async function getUserLimitsInternal(userId: UUID): Promise<UserRiskLimits> {
    const stored = await repository.getUserLimits(userId);
    if (stored) return stored;

    return getDefaultUserLimits(userId);
  }

  /**
   * Logs a risk check result for auditing.
   */
  function logRiskDecision(
    input: RiskCheckInput,
    result: RiskCheckResult,
    checkDurationMs: number
  ): void {
    if (!logger) return;

    if (result.approved) {
      logger.info("risk_check_approved", {
        userId: input.userId,
        symbol: input.symbol,
        side: input.side,
        quantity: input.quantity,
        durationMs: checkDurationMs,
        warnings: result.warnings,
      });
    } else {
      logger.warn("risk_check_rejected", {
        userId: input.userId,
        symbol: input.symbol,
        side: input.side,
        quantity: input.quantity,
        code: result.code,
        reason: result.reason,
        durationMs: checkDurationMs,
      });
    }
  }

  // --- Main Risk Check ---

  /**
   * The main pre-trade risk validation function.
   * This is the critical path - every order must pass through here.
   */
  async function validatePreTrade(
    input: RiskCheckInput
  ): Promise<RiskCheckResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      // =======================================================================
      // LAYER 1: SYSTEM STATUS CHECKS
      // =======================================================================

      // 1.1 Check platform trading status
      if (!limitsCache.platform.tradingEnabled) {
        return {
          approved: false,
          code: "CIRCUIT_BREAKER_ACTIVE",
          reason: "Platform trading is currently disabled.",
        };
      }

      // 1.2 Check circuit breaker
      const platformBreaker = await repository.getActiveCircuitBreaker();
      if (platformBreaker) {
        return {
          approved: false,
          code: "CIRCUIT_BREAKER_ACTIVE",
          reason:
            platformBreaker.reason ||
            "Trading is temporarily halted for safety.",
        };
      }

      // 1.3 Check symbol-specific circuit breaker
      const symbolBreaker = await repository.getActiveCircuitBreaker(
        input.symbol
      );
      if (symbolBreaker) {
        return {
          approved: false,
          code: "CIRCUIT_BREAKER_ACTIVE",
          reason: `Trading for ${input.symbol} is temporarily halted.`,
        };
      }

      // 1.4 Check if symbol is tradable
      const symbolLimits = await getSymbolLimitsInternal(input.symbol);
      if (!symbolLimits.tradingEnabled) {
        return {
          approved: false,
          code: "SYMBOL_NOT_TRADABLE",
          reason: `${input.symbol} is not available for trading.`,
        };
      }

      // =======================================================================
      // LAYER 2: USER ELIGIBILITY CHECKS
      // =======================================================================

      const userLimits = await getUserLimitsInternal(input.userId);

      // 2.1 Check if user is restricted
      if (userLimits.tradingRestricted) {
        return {
          approved: false,
          code: "ACCOUNT_RESTRICTED",
          reason:
            userLimits.restrictionReason ||
            "Your account is restricted from trading.",
        };
      }

      // 2.2 Check order rate limit
      const rateWindowStart = new Date(
        Date.now() - RISK_THRESHOLDS.RATE_LIMIT_WINDOW_SECONDS * 1000
      );
      const recentOrders = await repository.getRecentOrderCount(
        input.userId,
        rateWindowStart
      );
      if (recentOrders >= userLimits.maxOrdersPerMinute) {
        return {
          approved: false,
          code: "USER_ORDER_RATE_LIMIT",
          reason: `Too many orders. Please wait before placing more orders.`,
        };
      }

      // 2.3 Check daily loss limit
      const todayPnl = await repository.getTodayRealizedPnl(input.userId);
      if (todayPnl < 0 && Math.abs(todayPnl) >= userLimits.dailyLossLimit) {
        return {
          approved: false,
          code: "USER_DAILY_LOSS_LIMIT",
          reason: `Daily loss limit reached. Trading will resume tomorrow.`,
        };
      }

      // =======================================================================
      // LAYER 3: ORDER VALIDATION
      // =======================================================================

      const orderQuantity = parseFloat(input.quantity);

      // 3.1 Check minimum order size
      if (orderQuantity < symbolLimits.minOrderSize) {
        return {
          approved: false,
          code: "ORDER_SIZE_TOO_SMALL",
          reason: `Minimum order size for ${input.symbol} is ${symbolLimits.minOrderSize}.`,
        };
      }

      // 3.2 Check maximum order size
      if (orderQuantity > symbolLimits.maxOrderSize) {
        return {
          approved: false,
          code: "ORDER_SIZE_TOO_LARGE",
          reason: `Maximum order size for ${input.symbol} is ${symbolLimits.maxOrderSize}.`,
        };
      }

      // 3.3 Check lot size (quantity must be multiple of lot size)
      const lotRemainder = orderQuantity % symbolLimits.lotSize;
      if (lotRemainder > 0.0000001) {
        // Small epsilon for float comparison
        return {
          approved: false,
          code: "ORDER_SIZE_TOO_SMALL",
          reason: `Order quantity must be a multiple of ${symbolLimits.lotSize}.`,
        };
      }

      // 3.4 Get market price (needed for several checks)
      const marketPrice = getPrice(input.symbol);

      // 3.5 For limit orders: check price deviation (fat finger protection)
      if (input.type === "limit" && input.price) {
        if (!marketPrice) {
          // Can't validate limit price without market price
          // This is a WARNING, not a rejection - allow with caution
          warnings.push(
            "Market price unavailable for price deviation check."
          );
        } else {
          const limitPrice = parseFloat(input.price);
          const deviation = Math.abs(limitPrice - marketPrice) / marketPrice;

          if (deviation > symbolLimits.maxPriceDeviation) {
            return {
              approved: false,
              code: "PRICE_DEVIATION",
              reason: `Limit price is ${(deviation * 100).toFixed(1)}% away from market price. Maximum allowed: ${(symbolLimits.maxPriceDeviation * 100).toFixed(1)}%.`,
            };
          }
        }
      }

      // 3.6 For market orders: require valid price feed
      if (input.type === "market" && !marketPrice) {
        return {
          approved: false,
          code: "PRICE_UNAVAILABLE",
          reason: `Market price unavailable for ${input.symbol}. Cannot process market orders.`,
        };
      }

      // 3.7 Calculate order value for balance check
      const orderPrice =
        input.type === "limit" && input.price
          ? parseFloat(input.price)
          : marketPrice || 0;

      // Add 5% buffer for market orders to account for slippage
      const effectivePrice =
        input.type === "market" ? orderPrice * 1.05 : orderPrice;
      const orderValue = orderQuantity * effectivePrice;

      // 3.8 Check balance/position sufficiency
      if (input.side === "buy") {
        // For BUY: Check user has enough quote currency (e.g., USD)
        const availableBalance = parseFloat(
          await getAvailableBalance(input.accountId)
        );
        if (availableBalance < orderValue) {
          return {
            approved: false,
            code: "INSUFFICIENT_BALANCE",
            reason: `Insufficient funds. Required: ${orderValue.toFixed(2)}, Available: ${availableBalance.toFixed(2)}.`,
          };
        }
      } else {
        // For SELL: Check user has enough of the asset
        const position = await getUserPosition(input.accountId, input.symbol);
        const positionQty = position ? parseFloat(position.quantity) : 0;
        if (positionQty < orderQuantity) {
          return {
            approved: false,
            code: "INSUFFICIENT_POSITION",
            reason: `Insufficient ${input.symbol}. Required: ${orderQuantity}, Available: ${positionQty}.`,
          };
        }
      }

      // =======================================================================
      // LAYER 4: EXPOSURE MANAGEMENT
      // =======================================================================

      // 4.1 Check user position limit for this symbol
      const currentPosition = await getUserPosition(
        input.accountId,
        input.symbol
      );
      const currentPositionQty = currentPosition
        ? parseFloat(currentPosition.quantity)
        : 0;

      let newPositionQty: number;
      if (input.side === "buy") {
        newPositionQty = currentPositionQty + orderQuantity;
      } else {
        newPositionQty = currentPositionQty - orderQuantity;
      }

      if (Math.abs(newPositionQty) > symbolLimits.maxUserPosition) {
        return {
          approved: false,
          code: "USER_POSITION_LIMIT",
          reason: `Maximum position for ${input.symbol} is ${symbolLimits.maxUserPosition}. This order would result in ${Math.abs(newPositionQty).toFixed(4)}.`,
        };
      }

      // 4.2 Check house exposure limit
      const currentHousePosition = await getHouseNetPosition(input.symbol);

      // House position moves opposite to user position
      // User BUY -> House SHORT (negative)
      // User SELL -> House LONG (positive)
      let newHousePosition: number;
      if (input.side === "buy") {
        newHousePosition = currentHousePosition - orderQuantity;
      } else {
        newHousePosition = currentHousePosition + orderQuantity;
      }

      const absHousePosition = Math.abs(newHousePosition);

      // Check quantity-based limit
      if (absHousePosition > symbolLimits.maxHouseExposure) {
        return {
          approved: false,
          code: "HOUSE_EXPOSURE_LIMIT",
          reason: `This trade cannot be executed at this time. Please try a smaller size.`,
        };
      }

      // Check notional-based limit (using market price)
      if (marketPrice) {
        const newHouseNotional = absHousePosition * marketPrice;
        if (newHouseNotional > symbolLimits.maxHouseNotionalExposure) {
          return {
            approved: false,
            code: "HOUSE_EXPOSURE_LIMIT",
            reason: `This trade cannot be executed at this time. Please try a smaller size.`,
          };
        }

        // Add warning if approaching limit
        const exposurePercent =
          newHouseNotional / symbolLimits.maxHouseNotionalExposure;
        if (exposurePercent > RISK_THRESHOLDS.EXPOSURE_WARNING_PERCENT) {
          warnings.push(
            `House exposure for ${input.symbol} is at ${(exposurePercent * 100).toFixed(0)}% of limit.`
          );
        }
      }

      // =======================================================================
      // SUCCESS: Order passed all risk checks
      // =======================================================================

      // Record the order attempt for rate limiting
      await repository.recordOrderAttempt(input.userId, new Date());

      const result: RiskCheckResult = {
        approved: true,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

      logRiskDecision(input, result, Date.now() - startTime);
      return result;
    } catch (error) {
      // On any error, fail safe by rejecting the order
      logger?.error("risk_check_error", {
        error: String(error),
        input,
      });

      return {
        approved: false,
        code: "INTERNAL_ERROR",
        reason: "Risk check failed due to a system error. Please try again.",
      };
    }
  }

  // --- Public Service Interface ---

  return {
    validatePreTrade,

    // --- Exposure Queries ---

    async getSymbolExposure(symbol: string): Promise<SymbolExposure | null> {
      const netPosition = await getHouseNetPosition(symbol);
      const price = getPrice(symbol);

      if (!price && netPosition === 0) return null;

      return {
        symbol,
        netPosition: -netPosition, // House position is negative of user positions
        absolutePosition: Math.abs(netPosition),
        markPrice: price || 0,
        notionalValue: Math.abs(netPosition) * (price || 0),
        unrealizedPnl: 0, // TODO: Calculate from entry prices
        userCount: 0, // TODO: Count from positions table
        updatedAt: new Date(),
      };
    },

    async getAllSymbolExposures(): Promise<SymbolExposure[]> {
      // TODO: Query all symbols with positions
      return [];
    },

    async getUserSymbolExposure(
      userId: UUID,
      symbol: string
    ): Promise<UserSymbolExposure | null> {
      // TODO: Implement
      return null;
    },

    async getUserRiskMetrics(userId: UUID): Promise<UserRiskMetrics> {
      const todayPnl = await repository.getTodayRealizedPnl(userId);
      const rateWindowStart = new Date(
        Date.now() - RISK_THRESHOLDS.RATE_LIMIT_WINDOW_SECONDS * 1000
      );
      const recentOrders = await repository.getRecentOrderCount(
        userId,
        rateWindowStart
      );
      const totalExposure = await getUserTotalExposure(userId);

      return {
        userId,
        totalUnrealizedPnl: 0, // TODO: Calculate
        todayRealizedPnl: todayPnl,
        todayTotalPnl: todayPnl, // TODO: Add unrealized
        openPositionCount: 0, // TODO: Query
        totalNotionalExposure: totalExposure,
        recentOrderCount: recentOrders,
        openOrderCount: 0, // TODO: Query
      };
    },

    // --- Limit Management ---

    async getSymbolLimits(symbol: string): Promise<SymbolRiskLimits> {
      return getSymbolLimitsInternal(symbol);
    },

    async updateSymbolLimits(
      symbol: string,
      updates: Partial<SymbolRiskLimits>
    ): Promise<SymbolRiskLimits> {
      const current = await getSymbolLimitsInternal(symbol);
      const updated = { ...current, ...updates, symbol };
      await repository.upsertSymbolLimits(updated);
      limitsCache.symbols.set(symbol, updated);
      return updated;
    },

    async getUserLimits(userId: UUID): Promise<UserRiskLimits> {
      return getUserLimitsInternal(userId);
    },

    async updateUserLimits(
      userId: UUID,
      updates: Partial<UserRiskLimits>
    ): Promise<UserRiskLimits> {
      const current = await getUserLimitsInternal(userId);
      const updated = { ...current, ...updates, userId };
      await repository.upsertUserLimits(updated);
      return updated;
    },

    // --- Circuit Breaker ---

    async activateCircuitBreaker(
      trigger: CircuitBreakerTrigger,
      reason: string,
      symbol?: string,
      adminUserId?: UUID
    ): Promise<void> {
      await repository.createCircuitBreakerEvent({
        trigger,
        reason,
        symbol,
        activatedAt: new Date(),
        activatedBy: adminUserId,
      });

      if (!symbol) {
        limitsCache.platform.circuitBreakerActive = true;
        limitsCache.platform.circuitBreakerReason = reason;
      }

      logger?.warn("circuit_breaker_activated", { trigger, reason, symbol });
    },

    async deactivateCircuitBreaker(symbol?: string): Promise<void> {
      const active = await repository.getActiveCircuitBreaker(symbol);
      if (active) {
        await repository.deactivateCircuitBreaker(active.id, new Date());
      }

      if (!symbol) {
        limitsCache.platform.circuitBreakerActive = false;
        limitsCache.platform.circuitBreakerReason = undefined;
      }

      logger?.info("circuit_breaker_deactivated", { symbol });
    },

    async isCircuitBreakerActive(symbol?: string): Promise<boolean> {
      if (!symbol && limitsCache.platform.circuitBreakerActive) {
        return true;
      }
      const active = await repository.getActiveCircuitBreaker(symbol);
      return active !== null;
    },

    // --- Price Reference ---

    async getMarketPrice(symbol: string): Promise<number | null> {
      return getPrice(symbol);
    },

    async updateMarketPrice(symbol: string, price: number): Promise<void> {
      priceCache[symbol] = {
        price,
        updatedAt: new Date(),
      };
    },
  };
}
