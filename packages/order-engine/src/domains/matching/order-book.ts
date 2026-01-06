/**
 * Order Book - Efficient Price-Time Priority Order Book
 * ======================================================
 *
 * This is a production-grade order book implementation using sorted arrays
 * for bid/ask levels. For extreme high-frequency scenarios, consider a
 * red-black tree or skip list implementation.
 *
 * DESIGN DECISIONS:
 * - Price levels are aggregated (multiple orders at same price)
 * - Orders within a level are sorted by time (FIFO)
 * - Supports partial fills
 * - Provides efficient top-of-book access
 * - Generates incremental updates for WebSocket streaming
 */

import type { EngineOrder, OrderSide, OrderBookSnapshot, OrderBookLevel } from '../../types/order.types.js';
import { logger } from '../../utils/logger.js';

const log = logger.child({ component: 'order-book' });

/**
 * Price level containing orders at the same price.
 */
interface PriceLevel {
  price: number;
  orders: EngineOrder[];
  totalQuantity: number;
}

/**
 * Incremental update for order book changes.
 */
export interface OrderBookUpdate {
  side: OrderSide;
  price: number;
  quantity: number;  // 0 means level removed
  orderCount: number;
}

/**
 * Order Book for a single symbol.
 */
export class OrderBook {
  public readonly symbol: string;

  // Price levels sorted by price (bids: descending, asks: ascending)
  private bids: PriceLevel[] = [];
  private asks: PriceLevel[] = [];

  // Quick order lookup by ID
  private orderIndex: Map<string, { side: OrderSide; levelIndex: number; orderIndex: number }> = new Map();

  // Sequence number for updates
  private updateId = 0;

  // Pending updates for batching
  private pendingUpdates: OrderBookUpdate[] = [];

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Add an order to the book.
   */
  addOrder(order: EngineOrder): OrderBookUpdate | null {
    if (order.side === 'buy') {
      return this.addToBids(order);
    } else {
      return this.addToAsks(order);
    }
  }

  /**
   * Remove an order from the book.
   */
  removeOrder(orderId: string): OrderBookUpdate | null {
    const location = this.orderIndex.get(orderId);
    if (!location) return null;

    const levels = location.side === 'buy' ? this.bids : this.asks;
    const level = levels[location.levelIndex];
    if (!level) return null;

    // Find and remove the order
    const orderIdx = level.orders.findIndex(o => o.id === orderId);
    if (orderIdx === -1) return null;

    const order = level.orders[orderIdx]!;
    const remainingQty = order.quantity - order.filledQuantity;

    level.orders.splice(orderIdx, 1);
    level.totalQuantity -= remainingQty;

    // Remove from index
    this.orderIndex.delete(orderId);

    // Update indices for orders that shifted
    level.orders.forEach((o, idx) => {
      this.orderIndex.set(o.id, { side: location.side, levelIndex: location.levelIndex, orderIndex: idx });
    });

    // Remove level if empty
    if (level.orders.length === 0) {
      levels.splice(location.levelIndex, 1);
      this.reindexLevels(location.side);
    }

    this.updateId++;

    return {
      side: location.side,
      price: level.price,
      quantity: level.totalQuantity,
      orderCount: level.orders.length,
    };
  }

  /**
   * Update order after partial fill.
   */
  updateOrderFill(orderId: string, filledQuantity: number): OrderBookUpdate | null {
    const location = this.orderIndex.get(orderId);
    if (!location) return null;

    const levels = location.side === 'buy' ? this.bids : this.asks;
    const level = levels[location.levelIndex];
    if (!level) return null;

    const order = level.orders[location.orderIndex];
    if (!order) return null;

    const previousRemaining = order.quantity - order.filledQuantity;
    order.filledQuantity = filledQuantity;
    const newRemaining = order.quantity - order.filledQuantity;

    level.totalQuantity -= (previousRemaining - newRemaining);

    // Remove if fully filled
    if (newRemaining <= 0) {
      return this.removeOrder(orderId);
    }

    this.updateId++;

    return {
      side: location.side,
      price: level.price,
      quantity: level.totalQuantity,
      orderCount: level.orders.length,
    };
  }

  /**
   * Get best bid price.
   */
  getBestBid(): number | null {
    return this.bids[0]?.price ?? null;
  }

  /**
   * Get best ask price.
   */
  getBestAsk(): number | null {
    return this.asks[0]?.price ?? null;
  }

  /**
   * Get spread.
   */
  getSpread(): number | null {
    const bid = this.getBestBid();
    const ask = this.getBestAsk();
    if (bid === null || ask === null) return null;
    return ask - bid;
  }

  /**
   * Get order by ID.
   */
  getOrder(orderId: string): EngineOrder | null {
    const location = this.orderIndex.get(orderId);
    if (!location) return null;

    const levels = location.side === 'buy' ? this.bids : this.asks;
    return levels[location.levelIndex]?.orders[location.orderIndex] ?? null;
  }

  /**
   * Get orders at a price level.
   */
  getOrdersAtPrice(side: OrderSide, price: number): EngineOrder[] {
    const levels = side === 'buy' ? this.bids : this.asks;
    const level = levels.find(l => l.price === price);
    return level?.orders.map(o => ({ ...o })) ?? [];
  }

  /**
   * Get matching orders for an incoming order.
   * Returns orders that can potentially match (opposite side, crossing price).
   */
  *getMatchingOrders(side: OrderSide, limitPrice?: number): Generator<EngineOrder> {
    const levels = side === 'buy' ? this.asks : this.bids;

    for (const level of levels) {
      // Check price crossing
      if (limitPrice !== undefined) {
        if (side === 'buy' && level.price > limitPrice) break;
        if (side === 'sell' && level.price < limitPrice) break;
      }

      for (const order of level.orders) {
        yield order;
      }
    }
  }

  /**
   * Get full order book snapshot.
   */
  getSnapshot(depth: number = 25): OrderBookSnapshot {
    return {
      symbol: this.symbol,
      bids: this.bids.slice(0, depth).map(this.levelToSnapshot),
      asks: this.asks.slice(0, depth).map(this.levelToSnapshot),
      lastUpdateId: this.updateId,
      timestamp: Date.now(),
    };
  }

  /**
   * Get pending updates and clear them.
   */
  flushUpdates(): OrderBookUpdate[] {
    const updates = this.pendingUpdates;
    this.pendingUpdates = [];
    return updates;
  }

  /**
   * Get statistics.
   */
  getStats(): {
    bidLevels: number;
    askLevels: number;
    totalBidOrders: number;
    totalAskOrders: number;
    bidVolume: number;
    askVolume: number;
  } {
    return {
      bidLevels: this.bids.length,
      askLevels: this.asks.length,
      totalBidOrders: this.bids.reduce((sum, l) => sum + l.orders.length, 0),
      totalAskOrders: this.asks.reduce((sum, l) => sum + l.orders.length, 0),
      bidVolume: this.bids.reduce((sum, l) => sum + l.totalQuantity, 0),
      askVolume: this.asks.reduce((sum, l) => sum + l.totalQuantity, 0),
    };
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private addToBids(order: EngineOrder): OrderBookUpdate {
    const remainingQty = order.quantity - order.filledQuantity;

    // Find insertion point (bids sorted descending)
    let levelIndex = this.bids.findIndex(l => l.price <= order.price);

    if (levelIndex === -1) {
      levelIndex = this.bids.length;
    }

    // Check if level exists at this price
    if (this.bids[levelIndex]?.price === order.price) {
      // Add to existing level
      const level = this.bids[levelIndex]!;
      const orderIndex = level.orders.length;
      level.orders.push(order);
      level.totalQuantity += remainingQty;

      this.orderIndex.set(order.id, { side: 'buy', levelIndex, orderIndex });
    } else {
      // Create new level
      const newLevel: PriceLevel = {
        price: order.price,
        orders: [order],
        totalQuantity: remainingQty,
      };

      this.bids.splice(levelIndex, 0, newLevel);
      this.orderIndex.set(order.id, { side: 'buy', levelIndex, orderIndex: 0 });

      // Reindex subsequent levels
      this.reindexLevels('buy', levelIndex + 1);
    }

    this.updateId++;

    const level = this.bids[levelIndex]!;
    const update: OrderBookUpdate = {
      side: 'buy',
      price: order.price,
      quantity: level.totalQuantity,
      orderCount: level.orders.length,
    };

    this.pendingUpdates.push(update);
    return update;
  }

  private addToAsks(order: EngineOrder): OrderBookUpdate {
    const remainingQty = order.quantity - order.filledQuantity;

    // Find insertion point (asks sorted ascending)
    let levelIndex = this.asks.findIndex(l => l.price >= order.price);

    if (levelIndex === -1) {
      levelIndex = this.asks.length;
    }

    // Check if level exists at this price
    if (this.asks[levelIndex]?.price === order.price) {
      // Add to existing level
      const level = this.asks[levelIndex]!;
      const orderIndex = level.orders.length;
      level.orders.push(order);
      level.totalQuantity += remainingQty;

      this.orderIndex.set(order.id, { side: 'sell', levelIndex, orderIndex });
    } else {
      // Create new level
      const newLevel: PriceLevel = {
        price: order.price,
        orders: [order],
        totalQuantity: remainingQty,
      };

      this.asks.splice(levelIndex, 0, newLevel);
      this.orderIndex.set(order.id, { side: 'sell', levelIndex, orderIndex: 0 });

      // Reindex subsequent levels
      this.reindexLevels('sell', levelIndex + 1);
    }

    this.updateId++;

    const level = this.asks[levelIndex]!;
    const update: OrderBookUpdate = {
      side: 'sell',
      price: order.price,
      quantity: level.totalQuantity,
      orderCount: level.orders.length,
    };

    this.pendingUpdates.push(update);
    return update;
  }

  private reindexLevels(side: OrderSide, fromIndex: number = 0): void {
    const levels = side === 'buy' ? this.bids : this.asks;

    for (let i = fromIndex; i < levels.length; i++) {
      const level = levels[i]!;
      level.orders.forEach((order, orderIndex) => {
        this.orderIndex.set(order.id, { side, levelIndex: i, orderIndex });
      });
    }
  }

  private levelToSnapshot(level: PriceLevel): OrderBookLevel {
    return {
      price: level.price.toString(),
      quantity: level.totalQuantity.toString(),
      orderCount: level.orders.length,
    };
  }
}
