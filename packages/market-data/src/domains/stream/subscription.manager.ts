/**
 * Subscription Manager
 * ====================
 *
 * Higher-level subscription management with rate limiting and validation.
 */

import { ConnectionManager } from './connection.manager.js';
import { SYMBOL_MAP, ALL_SYMBOLS } from '../../config/symbols.js';
import { logger } from '../../utils/logger.js';
import type {
  ClientMessage,
  SubscribedMessage,
  UnsubscribedMessage,
  ErrorMessage,
} from './stream.types.js';

const log = logger.child({ component: 'subscription-manager' });

/** Maximum symbols a single client can subscribe to */
const MAX_SUBSCRIPTIONS_PER_CLIENT = 100;

/** Rate limit: max subscription requests per minute */
const RATE_LIMIT_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60000;

/**
 * Track rate limiting per client.
 */
interface RateLimitEntry {
  requestCount: number;
  windowStart: number;
}

/**
 * Subscription manager with validation and rate limiting.
 */
export class SubscriptionManager {
  private connectionManager: ConnectionManager;
  private rateLimits = new Map<string, RateLimitEntry>();

  constructor(connectionManager: ConnectionManager) {
    this.connectionManager = connectionManager;

    // Clean up rate limit entries periodically
    setInterval(() => {
      const now = Date.now();
      for (const [clientId, entry] of this.rateLimits) {
        if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
          this.rateLimits.delete(clientId);
        }
      }
    }, RATE_LIMIT_WINDOW_MS);
  }

  /**
   * Process a subscription request from a client.
   *
   * @param clientId - Client making the request
   * @param symbols - Symbols to subscribe to
   * @returns Response message to send back
   */
  handleSubscribe(clientId: string, symbols: string[]): SubscribedMessage | ErrorMessage {
    // Rate limit check
    if (this.isRateLimited(clientId)) {
      return this.errorMessage('RATE_LIMITED', 'Too many subscription requests. Please wait.');
    }

    this.recordRequest(clientId);

    // Validate symbols
    const validSymbols = symbols.filter(s => SYMBOL_MAP.has(s));
    const invalidSymbols = symbols.filter(s => !SYMBOL_MAP.has(s));

    if (invalidSymbols.length > 0) {
      log.debug({ clientId, invalidSymbols }, 'Invalid symbols in subscribe request');
    }

    if (validSymbols.length === 0) {
      return this.errorMessage('INVALID_SYMBOLS', 'No valid symbols provided');
    }

    // Check subscription limit
    const subscription = this.connectionManager.getSubscription(clientId);
    if (subscription) {
      const currentCount = subscription.symbols.size;
      const newCount = validSymbols.filter(s => !subscription.symbols.has(s)).length;

      if (currentCount + newCount > MAX_SUBSCRIPTIONS_PER_CLIENT) {
        return this.errorMessage(
          'SUBSCRIPTION_LIMIT',
          `Maximum ${MAX_SUBSCRIPTIONS_PER_CLIENT} subscriptions per client`
        );
      }
    }

    // Perform subscription
    const subscribed = this.connectionManager.subscribe(clientId, validSymbols);

    return {
      type: 'subscribed',
      symbols: subscribed,
      timestamp: Date.now(),
    };
  }

  /**
   * Process an unsubscribe request.
   */
  handleUnsubscribe(clientId: string, symbols: string[]): UnsubscribedMessage {
    const unsubscribed = this.connectionManager.unsubscribe(clientId, symbols);

    return {
      type: 'unsubscribed',
      symbols: unsubscribed,
      timestamp: Date.now(),
    };
  }

  /**
   * Get all available symbols for a client to subscribe to.
   */
  getAvailableSymbols(): string[] {
    return ALL_SYMBOLS.map(s => s.symbol);
  }

  /**
   * Check if a client is rate limited.
   */
  private isRateLimited(clientId: string): boolean {
    const entry = this.rateLimits.get(clientId);
    if (!entry) return false;

    const now = Date.now();

    // Reset window if expired
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      this.rateLimits.delete(clientId);
      return false;
    }

    return entry.requestCount >= RATE_LIMIT_REQUESTS;
  }

  /**
   * Record a subscription request for rate limiting.
   */
  private recordRequest(clientId: string): void {
    const now = Date.now();
    const entry = this.rateLimits.get(clientId);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      this.rateLimits.set(clientId, { requestCount: 1, windowStart: now });
    } else {
      entry.requestCount++;
    }
  }

  /**
   * Create an error message.
   */
  private errorMessage(code: string, message: string): ErrorMessage {
    return {
      type: 'error',
      code,
      message,
      timestamp: Date.now(),
    };
  }
}
