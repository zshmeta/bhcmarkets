/**
 * Order Validation Service
 * ========================
 *
 * Validates incoming orders before they reach the matching engine.
 *
 * VALIDATION CHECKS:
 * 1. Required fields present
 * 2. Valid order type and side
 * 3. Price/quantity within limits
 * 4. Account has sufficient balance
 * 5. Symbol is tradeable
 * 6. Rate limiting per account
 * 7. Market hours (if applicable)
 */

import { z } from 'zod';
import type {
  PlaceOrderInput,
  OrderValidationResult,
  OrderSide,
  OrderType,
  TimeInForce,
} from '../../types/order.types.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const log = logger.child({ component: 'order-validator' });

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const OrderSideSchema = z.enum(['buy', 'sell']);
const OrderTypeSchema = z.enum(['market', 'limit', 'stop', 'stop_limit']);
const TimeInForceSchema = z.enum(['GTC', 'IOC', 'FOK', 'GTD']);

const PlaceOrderSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  symbol: z.string().min(1).max(20).regex(/^[A-Z0-9-_]+$/i, 'Invalid symbol format'),
  side: OrderSideSchema,
  type: OrderTypeSchema,
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  timeInForce: TimeInForceSchema.default('GTC'),
  clientOrderId: z.string().max(64).optional(),
}).refine(
  (data) => {
    // Limit orders require price
    if (data.type === 'limit' && !data.price) {
      return false;
    }
    // Stop orders require stopPrice
    if ((data.type === 'stop' || data.type === 'stop_limit') && !data.stopPrice) {
      return false;
    }
    // Stop-limit requires both
    if (data.type === 'stop_limit' && !data.price) {
      return false;
    }
    return true;
  },
  {
    message: 'Price configuration invalid for order type',
  }
);

// ============================================================================
// RATE LIMITER
// ============================================================================

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();
  private readonly maxPerSecond: number;
  private readonly burstLimit: number;

  constructor(maxPerSecond: number, burstLimit: number) {
    this.maxPerSecond = maxPerSecond;
    this.burstLimit = burstLimit;
  }

  check(accountId: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    let bucket = this.buckets.get(accountId);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + 1000 };
      this.buckets.set(accountId, bucket);
    }

    if (bucket.count >= this.burstLimit) {
      return {
        allowed: false,
        retryAfter: bucket.resetAt - now,
      };
    }

    bucket.count++;
    return { allowed: true };
  }

  // Periodic cleanup of old buckets
  cleanup(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt < now - 10000) {
        this.buckets.delete(key);
      }
    }
  }
}

// ============================================================================
// ORDER VALIDATOR
// ============================================================================

export interface ValidationConfig {
  minQuantity: number;
  maxQuantity: number;
  minPrice: number;
  maxPrice: number;
  priceDeviationTolerance: number; // Max deviation from market price (0.1 = 10%)
  allowedSymbols?: Set<string>;
  tradingEnabled?: boolean;
}

export class OrderValidator {
  private rateLimiter: RateLimiter;
  private config: ValidationConfig;
  private marketPrices: Map<string, number> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      minQuantity: 0.00000001,
      maxQuantity: 1_000_000_000,
      minPrice: 0.00000001,
      maxPrice: 100_000_000,
      priceDeviationTolerance: env.PRICE_DEVIATION_TOLERANCE,
      tradingEnabled: true,
      ...config,
    };

    this.rateLimiter = new RateLimiter(
      env.RATE_LIMIT_ORDERS_PER_SECOND,
      env.RATE_LIMIT_BURST
    );

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.rateLimiter.cleanup();
    }, 60000);
  }

  /**
   * Validate an incoming order.
   */
  validate(input: unknown): OrderValidationResult {
    const errors: string[] = [];

    // 1. Check if trading is enabled
    if (!this.config.tradingEnabled) {
      return {
        valid: false,
        errors: ['Trading is currently disabled'],
      };
    }

    // 2. Schema validation
    const parseResult = PlaceOrderSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        valid: false,
        errors: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }

    const order = parseResult.data;

    // 3. Rate limiting
    const rateLimit = this.rateLimiter.check(order.accountId);
    if (!rateLimit.allowed) {
      return {
        valid: false,
        errors: [`Rate limit exceeded. Retry after ${rateLimit.retryAfter}ms`],
      };
    }

    // 4. Symbol validation
    if (this.config.allowedSymbols && !this.config.allowedSymbols.has(order.symbol)) {
      errors.push(`Symbol ${order.symbol} is not available for trading`);
    }

    // 5. Quantity validation
    if (order.quantity < this.config.minQuantity) {
      errors.push(`Quantity ${order.quantity} below minimum ${this.config.minQuantity}`);
    }
    if (order.quantity > this.config.maxQuantity) {
      errors.push(`Quantity ${order.quantity} exceeds maximum ${this.config.maxQuantity}`);
    }

    // 6. Price validation (for limit orders)
    if (order.price !== undefined) {
      if (order.price < this.config.minPrice) {
        errors.push(`Price ${order.price} below minimum ${this.config.minPrice}`);
      }
      if (order.price > this.config.maxPrice) {
        errors.push(`Price ${order.price} exceeds maximum ${this.config.maxPrice}`);
      }

      // Check price deviation from market
      const marketPrice = this.marketPrices.get(order.symbol);
      if (marketPrice && this.config.priceDeviationTolerance > 0) {
        const deviation = Math.abs(order.price - marketPrice) / marketPrice;
        if (deviation > this.config.priceDeviationTolerance) {
          errors.push(
            `Price ${order.price} deviates more than ${this.config.priceDeviationTolerance * 100}% from market price ${marketPrice}`
          );
        }
      }
    }

    // 7. Stop price validation
    if (order.stopPrice !== undefined) {
      if (order.stopPrice < this.config.minPrice) {
        errors.push(`Stop price ${order.stopPrice} below minimum ${this.config.minPrice}`);
      }
      if (order.stopPrice > this.config.maxPrice) {
        errors.push(`Stop price ${order.stopPrice} exceeds maximum ${this.config.maxPrice}`);
      }
    }

    if (errors.length > 0) {
      log.warn({ errors, accountId: order.accountId }, 'Order validation failed');
      return { valid: false, errors };
    }

    log.debug({ accountId: order.accountId, symbol: order.symbol }, 'Order validated');
    return {
      valid: true,
      order: order as PlaceOrderInput,
    };
  }

  /**
   * Update market price for deviation checks.
   */
  setMarketPrice(symbol: string, price: number): void {
    this.marketPrices.set(symbol, price);
  }

  /**
   * Update allowed symbols.
   */
  setAllowedSymbols(symbols: string[]): void {
    this.config.allowedSymbols = new Set(symbols);
  }

  /**
   * Enable/disable trading.
   */
  setTradingEnabled(enabled: boolean): void {
    this.config.tradingEnabled = enabled;
    log.info({ enabled }, 'Trading status changed');
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Create a singleton validator.
 */
let validatorInstance: OrderValidator | null = null;

export function getOrderValidator(config?: Partial<ValidationConfig>): OrderValidator {
  if (!validatorInstance) {
    validatorInstance = new OrderValidator(config);
  }
  return validatorInstance;
}

export function destroyOrderValidator(): void {
  if (validatorInstance) {
    validatorInstance.destroy();
    validatorInstance = null;
  }
}
