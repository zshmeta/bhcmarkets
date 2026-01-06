/**
 * Risk Gateway
 * ============
 *
 * A thin gateway layer for fast pre-trade risk checks in the order-engine hot path.
 *
 * ARCHITECTURE:
 * - In-memory cache of symbol/user limits (refreshed periodically)
 * - Fast local checks for common cases (size, value, trading enabled)
 * - Delegates complex checks to backend risk service
 *
 * WHY A GATEWAY?
 * - Order matching is latency-sensitive (~1ms target)
 * - Full risk service has DB calls, audit logging, etc.
 * - This gateway provides sub-ms checks with cache
 * - Falls back to backend for edge cases
 *
 * USAGE:
 * ```typescript
 * const gateway = createRiskGateway({ riskService, logger });
 * await gateway.syncLimits(); // Load initial cache
 *
 * // In order submission hot path
 * const result = await gateway.quickCheck(order);
 * if (!result.approved) {
 *   return reject(result.reason);
 * }
 * ```
 */

import type { Logger } from 'pino';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Order input for risk checking.
 */
export interface RiskOrderInput {
    accountId: string;
    userId: string;
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop' | 'stop_limit';
    quantity: number;
    price?: number;
    stopPrice?: number;
}

/**
 * Cached symbol limits for fast access.
 */
export interface CachedSymbolLimits {
    symbol: string;
    tradingEnabled: boolean;
    minOrderSize: number;
    maxOrderSize: number;
    maxPriceDeviation: number;
    maxUserPosition: number;
    tickSize: number;
    lotSize: number;
    updatedAt: Date;
}

/**
 * Cached user limits for fast access.
 */
export interface CachedUserLimits {
    userId: string;
    dailyLossLimit: number;
    maxOrdersPerMinute: number;
    maxSymbolPositionValue: number;
    tradingRestricted: boolean;
    updatedAt: Date;
}

/**
 * Risk check result.
 */
export type RiskCheckResult =
    | { approved: true; warnings?: string[] }
    | { approved: false; code: string; reason: string };

/**
 * Market price cache entry.
 */
interface PriceEntry {
    price: number;
    updatedAt: Date;
}

/**
 * Gateway configuration.
 */
export interface RiskGatewayConfig {
    /** Logger instance */
    logger?: Logger;

    /** Cache refresh interval in ms (default: 30s) */
    cacheRefreshIntervalMs?: number;

    /** Price staleness threshold in ms (default: 5s) */
    priceStaleThresholdMs?: number;

    /** Backend risk service (for complex checks) */
    riskService?: {
        validatePreTrade(input: RiskOrderInput): Promise<RiskCheckResult>;
        getSymbolLimits(symbol: string): Promise<CachedSymbolLimits | null>;
        getUserLimits(userId: string): Promise<CachedUserLimits | null>;
        getAllSymbolLimits(): Promise<CachedSymbolLimits[]>;
    };
}

// =============================================================================
// GATEWAY CLASS
// =============================================================================

/**
 * Risk Gateway - Fast pre-trade risk checking with caching.
 */
export class RiskGateway {
    private symbolLimits: Map<string, CachedSymbolLimits> = new Map();
    private userLimits: Map<string, CachedUserLimits> = new Map();
    private prices: Map<string, PriceEntry> = new Map();
    private circuitBreakerActive = false;
    private globalTradingEnabled = true;

    private refreshTimer?: NodeJS.Timeout;
    private log: Logger | Console;
    private config: Required<Pick<
        RiskGatewayConfig,
        'cacheRefreshIntervalMs' | 'priceStaleThresholdMs'
    >> & Omit<RiskGatewayConfig, 'cacheRefreshIntervalMs' | 'priceStaleThresholdMs'>;

    constructor(config: RiskGatewayConfig = {}) {
        this.log = config.logger ?? console;
        this.config = {
            cacheRefreshIntervalMs: config.cacheRefreshIntervalMs ?? 30_000,
            priceStaleThresholdMs: config.priceStaleThresholdMs ?? 5_000,
            logger: config.logger,
            riskService: config.riskService,
        };
    }

    // ===========================================================================
    // CACHE MANAGEMENT
    // ===========================================================================

    /**
     * Sync limits from backend risk service to local cache.
     */
    async syncLimits(): Promise<void> {
        if (!this.config.riskService) {
            (this.log as Console).warn?.('No risk service configured, using defaults');
            return;
        }

        try {
            // Load all symbol limits
            const symbols = await this.config.riskService.getAllSymbolLimits();
            for (const limit of symbols) {
                this.symbolLimits.set(limit.symbol, limit);
            }

            (this.log as Console).info?.(`Synced ${symbols.length} symbol limits to cache`);
        } catch (error) {
            (this.log as Console).error?.('Failed to sync limits from backend', error);
        }
    }

    /**
     * Start automatic cache refresh.
     */
    startAutoRefresh(): void {
        if (this.refreshTimer) return;

        this.refreshTimer = setInterval(
            () => this.syncLimits(),
            this.config.cacheRefreshIntervalMs
        );

        // Initial sync
        this.syncLimits();
    }

    /**
     * Stop automatic cache refresh.
     */
    stopAutoRefresh(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = undefined;
        }
    }

    /**
     * Update market price (called by market data service).
     */
    updatePrice(symbol: string, price: number): void {
        this.prices.set(symbol, {
            price,
            updatedAt: new Date(),
        });
    }

    /**
     * Set symbol limits manually (for testing or local override).
     */
    setSymbolLimits(limits: CachedSymbolLimits): void {
        this.symbolLimits.set(limits.symbol, limits);
    }

    /**
     * Set user limits manually.
     */
    setUserLimits(limits: CachedUserLimits): void {
        this.userLimits.set(limits.userId, limits);
    }

    /**
     * Activate circuit breaker (halt all trading).
     */
    activateCircuitBreaker(): void {
        this.circuitBreakerActive = true;
        (this.log as Console).warn?.('Circuit breaker activated - all trading halted');
    }

    /**
     * Deactivate circuit breaker.
     */
    deactivateCircuitBreaker(): void {
        this.circuitBreakerActive = false;
        (this.log as Console).info?.('Circuit breaker deactivated - trading resumed');
    }

    /**
     * Enable/disable global trading.
     */
    setGlobalTrading(enabled: boolean): void {
        this.globalTradingEnabled = enabled;
    }

    // ===========================================================================
    // RISK CHECKS
    // ===========================================================================

    /**
     * Quick pre-trade risk check using cached limits.
     *
     * This is the hot path - optimized for speed with local data.
     * Performs basic checks that don't require DB access:
     * - Circuit breaker status
     * - Trading enabled for symbol
     * - Order size limits
     * - Price deviation (if limit order)
     *
     * Falls back to backend for:
     * - Balance checks
     * - Position limit checks
     * - Daily loss limit checks
     * - Rate limiting
     */
    async quickCheck(order: RiskOrderInput): Promise<RiskCheckResult> {
        // 1. Circuit breaker check (immediate halt)
        if (this.circuitBreakerActive) {
            return {
                approved: false,
                code: 'CIRCUIT_BREAKER_ACTIVE',
                reason: 'Trading is temporarily halted',
            };
        }

        // 2. Global trading check
        if (!this.globalTradingEnabled) {
            return {
                approved: false,
                code: 'TRADING_DISABLED',
                reason: 'Trading is currently disabled',
            };
        }

        // 3. Get symbol limits (from cache)
        const symbolLimits = this.getSymbolLimits(order.symbol);
        if (!symbolLimits) {
            // Symbol not in cache - either unknown or needs backend check
            if (this.config.riskService) {
                return this.config.riskService.validatePreTrade(order);
            }
            return {
                approved: false,
                code: 'SYMBOL_NOT_CONFIGURED',
                reason: `Symbol ${order.symbol} is not configured for trading`,
            };
        }

        // 4. Trading enabled for symbol
        if (!symbolLimits.tradingEnabled) {
            return {
                approved: false,
                code: 'SYMBOL_NOT_TRADABLE',
                reason: `Trading is disabled for ${order.symbol}`,
            };
        }

        // 5. Order size checks
        const sizeCheck = this.checkOrderSize(order.quantity, symbolLimits);
        if (!sizeCheck.approved) {
            return sizeCheck;
        }

        // 6. Price deviation check (for limit orders)
        if (order.type === 'limit' && order.price) {
            const priceCheck = this.checkPriceDeviation(
                order.symbol,
                order.price,
                symbolLimits.maxPriceDeviation
            );
            if (!priceCheck.approved) {
                return priceCheck;
            }
        }

        // 7. User restriction check (if cached)
        const userLimits = this.userLimits.get(order.userId);
        if (userLimits?.tradingRestricted) {
            return {
                approved: false,
                code: 'ACCOUNT_RESTRICTED',
                reason: 'Your account is restricted from trading',
            };
        }

        // 8. If we have a backend service, delegate complex checks
        if (this.config.riskService) {
            return this.config.riskService.validatePreTrade(order);
        }

        // All quick checks passed
        return { approved: true };
    }

    /**
     * Get cached symbol limits.
     */
    getSymbolLimits(symbol: string): CachedSymbolLimits | undefined {
        return this.symbolLimits.get(symbol);
    }

    /**
     * Get current price from cache.
     */
    getPrice(symbol: string): number | null {
        const entry = this.prices.get(symbol);
        if (!entry) return null;

        // Check if price is stale
        const age = Date.now() - entry.updatedAt.getTime();
        if (age > this.config.priceStaleThresholdMs) {
            return null; // Price is stale
        }

        return entry.price;
    }

    // ===========================================================================
    // PRIVATE CHECK METHODS
    // ===========================================================================

    private checkOrderSize(
        quantity: number,
        limits: CachedSymbolLimits
    ): RiskCheckResult {
        if (quantity < limits.minOrderSize) {
            return {
                approved: false,
                code: 'ORDER_SIZE_TOO_SMALL',
                reason: `Order size ${quantity} is below minimum ${limits.minOrderSize}`,
            };
        }

        if (quantity > limits.maxOrderSize) {
            return {
                approved: false,
                code: 'ORDER_SIZE_TOO_LARGE',
                reason: `Order size ${quantity} exceeds maximum ${limits.maxOrderSize}`,
            };
        }

        // Check lot size alignment
        const remainder = quantity % limits.lotSize;
        if (remainder > 0.00000001) { // Allow tiny floating point errors
            return {
                approved: false,
                code: 'INVALID_LOT_SIZE',
                reason: `Order quantity must be a multiple of ${limits.lotSize}`,
            };
        }

        return { approved: true };
    }

    private checkPriceDeviation(
        symbol: string,
        orderPrice: number,
        maxDeviation: number
    ): RiskCheckResult {
        const marketPrice = this.getPrice(symbol);

        // If no market price available, skip this check
        if (marketPrice === null) {
            return { approved: true, warnings: ['Market price unavailable for deviation check'] };
        }

        const deviation = Math.abs(orderPrice - marketPrice) / marketPrice;

        if (deviation > maxDeviation) {
            return {
                approved: false,
                code: 'PRICE_DEVIATION',
                reason: `Limit price ${orderPrice} deviates ${(deviation * 100).toFixed(1)}% from market price ${marketPrice} (max: ${(maxDeviation * 100).toFixed(1)}%)`,
            };
        }

        return { approved: true };
    }

    // ===========================================================================
    // STATISTICS
    // ===========================================================================

    /**
     * Get gateway statistics.
     */
    getStats(): {
        symbolsInCache: number;
        usersInCache: number;
        pricesInCache: number;
        circuitBreakerActive: boolean;
        globalTradingEnabled: boolean;
    } {
        return {
            symbolsInCache: this.symbolLimits.size,
            usersInCache: this.userLimits.size,
            pricesInCache: this.prices.size,
            circuitBreakerActive: this.circuitBreakerActive,
            globalTradingEnabled: this.globalTradingEnabled,
        };
    }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a risk gateway instance.
 */
export function createRiskGateway(config?: RiskGatewayConfig): RiskGateway {
    return new RiskGateway(config);
}

// =============================================================================
// DEFAULT SYMBOL LIMITS
// =============================================================================

/**
 * Get default limits for a symbol (for testing/development).
 */
export function getDefaultSymbolLimits(symbol: string): CachedSymbolLimits {
    // Parse the symbol (e.g., "BTC-USD" or "BTC/USD")
    const base = symbol.split(/[-/]/)[0]?.toUpperCase() ?? 'BTC';

    // Default limits based on asset type
    const isCrypto = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'DOT', 'MATIC', 'LINK', 'AVAX'].includes(base);
    const isForex = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'].includes(base);

    if (isCrypto) {
        return {
            symbol,
            tradingEnabled: true,
            minOrderSize: 0.0001,
            maxOrderSize: 100,
            maxPriceDeviation: 0.1, // 10%
            maxUserPosition: 10,
            tickSize: 0.01,
            lotSize: 0.0001,
            updatedAt: new Date(),
        };
    }

    if (isForex) {
        return {
            symbol,
            tradingEnabled: true,
            minOrderSize: 0.01,
            maxOrderSize: 10_000_000,
            maxPriceDeviation: 0.05, // 5%
            maxUserPosition: 1_000_000,
            tickSize: 0.00001,
            lotSize: 0.01,
            updatedAt: new Date(),
        };
    }

    // Default (commodities, stocks)
    return {
        symbol,
        tradingEnabled: true,
        minOrderSize: 0.01,
        maxOrderSize: 10000,
        maxPriceDeviation: 0.1, // 10%
        maxUserPosition: 1000,
        tickSize: 0.01,
        lotSize: 0.01,
        updatedAt: new Date(),
    };
}
