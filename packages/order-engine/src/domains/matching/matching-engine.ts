/**
 * Matching Engine - Core Order Matching Logic
 * ============================================
 *
 * This is the heart of the order engine. It receives incoming orders and
 * matches them against the order book using price-time priority.
 *
 * MATCHING RULES:
 * 1. Price priority: Better prices match first
 * 2. Time priority: At same price, earlier orders match first
 * 3. Market orders: Match immediately at best available price
 * 4. Limit orders: Match if price crosses, else add to book
 *
 * ORDER TYPES:
 * - Market: Execute immediately at best price, reject if no liquidity
 * - Limit: Execute at limit price or better, add to book if not filled
 * - Stop: Trigger becomes market order when stop price reached
 * - Stop-Limit: Trigger becomes limit order when stop price reached
 *
 * TIME IN FORCE:
 * - GTC: Good Till Cancelled (stays in book)
 * - IOC: Immediate Or Cancel (fill what's possible, cancel rest)
 * - FOK: Fill Or Kill (fill entirely or reject)
 * - GTD: Good Till Date (expires at specified time)
 */

import type {
  EngineOrder,
  EngineTrade,
  OrderSide,
  OrderType,
  TimeInForce,
  PlaceOrderInput,
} from '../../types/order.types.js';
import { OrderBook, type OrderBookUpdate } from './order-book.js';
import { logger } from '../../utils/logger.js';

const log = logger.child({ component: 'matching-engine' });

/**
 * Result of processing an order.
 */
export interface MatchResult {
  orderId: string;
  status: 'filled' | 'partially_filled' | 'open' | 'rejected' | 'cancelled';
  trades: EngineTrade[];
  filledQuantity: number;
  remainingQuantity: number;
  averagePrice: number | null;
  bookUpdates: OrderBookUpdate[];
  rejectReason?: string;
}

/**
 * Event emitted by the matching engine.
 */
export type MatchingEvent =
  | { type: 'trade'; trade: EngineTrade }
  | { type: 'order_accepted'; order: EngineOrder }
  | { type: 'order_rejected'; orderId: string; reason: string }
  | { type: 'order_cancelled'; orderId: string }
  | { type: 'order_filled'; orderId: string }
  | { type: 'order_partially_filled'; orderId: string; filledQty: number }
  | { type: 'book_update'; update: OrderBookUpdate };

/**
 * Callback for matching events.
 */
export type MatchingEventHandler = (event: MatchingEvent) => void;

/**
 * Matching Engine for a single symbol.
 */
export class MatchingEngine {
  public readonly symbol: string;
  public readonly orderBook: OrderBook;

  private eventHandlers: MatchingEventHandler[] = [];
  private currentPrice: number | null = null;

  constructor(symbol: string) {
    this.symbol = symbol;
    this.orderBook = new OrderBook(symbol);
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Process an incoming order.
   */
  processOrder(order: EngineOrder, timeInForce: TimeInForce = 'GTC'): MatchResult {
    const result: MatchResult = {
      orderId: order.id,
      status: 'open',
      trades: [],
      filledQuantity: 0,
      remainingQuantity: order.quantity,
      averagePrice: null,
      bookUpdates: [],
    };

    try {
      // Handle different order types
      switch (order.type) {
        case 'market':
          this.matchMarketOrder(order, result);
          break;

        case 'limit':
          this.matchLimitOrder(order, result, timeInForce);
          break;

        case 'stop':
        case 'stop_limit':
          // Stop orders are handled by the OrderManager when triggered
          // Here we just validate and reject if submitted directly
          result.status = 'rejected';
          result.rejectReason = 'Stop orders must be submitted through OrderManager';
          break;

        default:
          result.status = 'rejected';
          result.rejectReason = `Unknown order type: ${order.type}`;
      }

      // Calculate average price
      if (result.trades.length > 0) {
        const totalValue = result.trades.reduce((sum, t) => sum + t.price * t.quantity, 0);
        result.averagePrice = totalValue / result.filledQuantity;

        // Update current market price
        this.currentPrice = result.trades[result.trades.length - 1]!.price;
      }

      // Determine final status
      if (result.filledQuantity >= order.quantity) {
        result.status = 'filled';
        this.emit({ type: 'order_filled', orderId: order.id });
      } else if (result.filledQuantity > 0) {
        result.status = 'partially_filled';
        this.emit({ type: 'order_partially_filled', orderId: order.id, filledQty: result.filledQuantity });
      }

      result.remainingQuantity = order.quantity - result.filledQuantity;

      log.debug({
        orderId: order.id,
        status: result.status,
        filledQuantity: result.filledQuantity,
        trades: result.trades.length,
      }, 'Order processed');

    } catch (error) {
      log.error({ error, orderId: order.id }, 'Error processing order');
      result.status = 'rejected';
      result.rejectReason = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  /**
   * Cancel an order.
   */
  cancelOrder(orderId: string): MatchResult {
    const update = this.orderBook.removeOrder(orderId);

    if (update) {
      this.emit({ type: 'order_cancelled', orderId });
      this.emit({ type: 'book_update', update });

      return {
        orderId,
        status: 'cancelled',
        trades: [],
        filledQuantity: 0,
        remainingQuantity: 0,
        averagePrice: null,
        bookUpdates: [update],
      };
    }

    return {
      orderId,
      status: 'rejected',
      trades: [],
      filledQuantity: 0,
      remainingQuantity: 0,
      averagePrice: null,
      bookUpdates: [],
      rejectReason: 'Order not found',
    };
  }

  /**
   * Get current market price.
   */
  getCurrentPrice(): number | null {
    return this.currentPrice;
  }

  /**
   * Set current market price (from external feed).
   */
  setCurrentPrice(price: number): void {
    this.currentPrice = price;
  }

  /**
   * Register event handler.
   */
  onEvent(handler: MatchingEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index !== -1) this.eventHandlers.splice(index, 1);
    };
  }

  /**
   * Load existing orders into the book (for recovery).
   */
  loadOrder(order: EngineOrder): void {
    this.orderBook.addOrder(order);
    log.debug({ orderId: order.id, price: order.price }, 'Loaded order');
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private matchMarketOrder(order: EngineOrder, result: MatchResult): void {
    const matchingOrders = this.orderBook.getMatchingOrders(order.side);

    for (const makerOrder of matchingOrders) {
      if (order.filledQuantity >= order.quantity) break;

      const trade = this.executeTrade(order, makerOrder);
      if (trade) {
        result.trades.push(trade);
        result.filledQuantity += trade.quantity;

        // Update maker order in book
        const update = this.orderBook.updateOrderFill(
          makerOrder.id,
          makerOrder.filledQuantity
        );
        if (update) {
          result.bookUpdates.push(update);
          this.emit({ type: 'book_update', update });
        }
      }
    }

    // Market orders that can't fill are rejected
    if (result.filledQuantity === 0) {
      result.status = 'rejected';
      result.rejectReason = 'No liquidity';
    } else if (result.filledQuantity < order.quantity) {
      // Partial fill - rest is cancelled for market orders
      result.status = 'partially_filled';
    }
  }

  private matchLimitOrder(
    order: EngineOrder,
    result: MatchResult,
    timeInForce: TimeInForce
  ): void {
    // First try to match against existing orders
    const matchingOrders = this.orderBook.getMatchingOrders(order.side, order.price);

    for (const makerOrder of matchingOrders) {
      if (order.filledQuantity >= order.quantity) break;

      const trade = this.executeTrade(order, makerOrder);
      if (trade) {
        result.trades.push(trade);
        result.filledQuantity += trade.quantity;

        // Update maker order
        const update = this.orderBook.updateOrderFill(
          makerOrder.id,
          makerOrder.filledQuantity
        );
        if (update) {
          result.bookUpdates.push(update);
          this.emit({ type: 'book_update', update });
        }
      }
    }

    // Handle time-in-force
    const remaining = order.quantity - order.filledQuantity;

    if (remaining > 0) {
      switch (timeInForce) {
        case 'IOC':
          // Cancel remaining
          result.status = result.filledQuantity > 0 ? 'partially_filled' : 'cancelled';
          break;

        case 'FOK':
          // Reject if not fully filled
          if (result.filledQuantity < order.quantity) {
            result.status = 'rejected';
            result.rejectReason = 'Could not fill entire order (FOK)';
            // Rollback trades? In production, this needs careful handling
          }
          break;

        case 'GTC':
        case 'GTD':
          // Add remaining to order book
          order.filledQuantity = result.filledQuantity;
          const update = this.orderBook.addOrder(order);
          result.bookUpdates.push(update);
          result.status = result.filledQuantity > 0 ? 'partially_filled' : 'open';

          this.emit({ type: 'order_accepted', order });
          this.emit({ type: 'book_update', update });
          break;
      }
    }
  }

  private executeTrade(taker: EngineOrder, maker: EngineOrder): EngineTrade | null {
    const takerRemaining = taker.quantity - taker.filledQuantity;
    const makerRemaining = maker.quantity - maker.filledQuantity;

    if (takerRemaining <= 0 || makerRemaining <= 0) {
      return null;
    }

    const tradeQuantity = Math.min(takerRemaining, makerRemaining);
    const tradePrice = maker.price; // Maker price (price-time priority)

    const trade: EngineTrade = {
      makerOrderId: maker.id,
      takerOrderId: taker.id,
      makerAccountId: maker.accountId,
      takerAccountId: taker.accountId,
      price: tradePrice,
      quantity: tradeQuantity,
      timestamp: Date.now(),
    };

    // Update fill quantities
    taker.filledQuantity += tradeQuantity;
    maker.filledQuantity += tradeQuantity;

    // Emit trade event
    this.emit({ type: 'trade', trade });

    log.debug({
      takerOrderId: taker.id,
      makerOrderId: maker.id,
      price: tradePrice,
      quantity: tradeQuantity,
    }, 'Trade executed');

    return trade;
  }

  private emit(event: MatchingEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        log.error({ error, event }, 'Error in event handler');
      }
    }
  }
}
