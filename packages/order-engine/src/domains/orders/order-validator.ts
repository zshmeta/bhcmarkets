/**
 * Order Validation Service
 * ========================
 *
 * Validates incoming orders before they reach the matching engine.
 */

import { z } from 'zod';
import type {
  PlaceOrderInput,
  OrderValidationResult,
  OrderSide,
  OrderType,
  TimeInForce,
} from '@repo/sdk';
import { logger } from '@repo/sdk';
import { env } from '../../config/env.js';

const log = logger.child({ component: 'order-validator' });

// ============================================================================
// VALIDATION RESULT INTERFACE
// ============================================================================

// Local extension to include the sanitized order
export interface ValidatorResult extends OrderValidationResult {
  order?: PlaceOrderInput;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const OrderSideSchema = z.enum(['buy', 'sell']);
const OrderTypeSchema = z.enum(['market', 'limit', 'stop', 'stop_limit']);
const TimeInForceSchema = z.enum(['GTC', 'IOC', 'FOK', 'GTD']);

const PlaceOrderSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  userId: z.string().optional(),
  symbol: z.string().min(1).max(64).regex(/^[A-Z0-9][A-Z0-9./_-]*$/i, 'Invalid symbol format'),
  side: OrderSideSchema,
  type: OrderTypeSchema,
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  timeInForce: TimeInForceSchema.default('GTC'),
  clientOrderId: z.string().max(64).optional(),
}).refine(
  (data) => {
    if (data.type === 'limit' && !data.price) return false;
    if ((data.type === 'stop' || data.type === 'stop_limit') && !data.stopPrice) return false;
    if (data.type === 'stop_limit' && !data.price) return false;
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
  priceDeviationTolerance: number;
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
      priceDeviationTolerance: env.PRICE_DEVIATION_TOLERANCE || 0.1,
      tradingEnabled: true,
      ...config,
    };

    this.rateLimiter = new RateLimiter(
      env.RATE_LIMIT_ORDERS_PER_SECOND || 10,
      env.RATE_LIMIT_BURST || 50
    );

    this.cleanupInterval = setInterval(() => {
      this.rateLimiter.cleanup();
    }, 60000);
  }

  /**
   * Validate an incoming order.
   */
  validate(input: unknown): ValidatorResult {
    const errors: string[] = [];

    // 1. Check if trading is enabled
    if (!this.config.tradingEnabled) {
      return {
        valid: false,
        error: 'Trading is currently disabled',
      };
    }

    // 2. Schema validation
    const parseResult = PlaceOrderSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        valid: false,
        error: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }

    const order = parseResult.data;

    // 3. Rate limiting
    const rateLimit = this.rateLimiter.check(order.accountId);
    if (!rateLimit.allowed) {
      return {
        valid: false,
        error: `Rate limit exceeded. Retry after ${rateLimit.retryAfter}ms`,
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

    // 6. Price validation
    if (order.price !== undefined) {
      if (order.price < this.config.minPrice) {
        errors.push(`Price ${order.price} below minimum ${this.config.minPrice}`);
      }
      if (order.price > this.config.maxPrice) {
        errors.push(`Price ${order.price} exceeds maximum ${this.config.maxPrice}`);
      }

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
      return { valid: false, error: errors.join(', ') };
    }

    log.debug({ accountId: order.accountId, symbol: order.symbol }, 'Order validated');
    
    const sdkOrder: PlaceOrderInput = {
        ...order,
        userId: order.userId || order.accountId,
        quantity: order.quantity.toString(),
        price: order.price?.toString(),
        stopPrice: order.stopPrice?.toString(),
    };

    return {
      valid: true,
      order: sdkOrder,
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
