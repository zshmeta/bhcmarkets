/**
 * Order Book Manager
 * ==================
 *
 * Manages multiple order books (one per symbol) and provides
 * a unified interface for the order engine service.
 *
 * Responsibilities:
 * - Create/destroy order books per symbol
 * - Route orders to appropriate symbol
 * - Aggregate statistics across all books
 * - Handle multi-symbol operations
 */

import { MatchingEngine, type MatchResult, type MatchingEvent, type MatchingEventHandler } from './matching-engine.js';
import { OrderBook, type OrderBookSnapshot, type OrderBookUpdate } from './order-book.js';
import type { EngineOrder, TimeInForce } from '../../types/order.types.js';
import { logger } from '../../utils/logger.js';

const log = logger.child({ component: 'order-book-manager' });

/**
 * Aggregated statistics for all order books.
 */
export interface OrderBookManagerStats {
  totalSymbols: number;
  totalBidOrders: number;
  totalAskOrders: number;
  totalBidVolume: number;
  totalAskVolume: number;
  symbolStats: Map<string, {
    bidOrders: number;
    askOrders: number;
    bidVolume: number;
    askVolume: number;
    spread: number | null;
    midPrice: number | null;
  }>;
}

/**
 * Event emitted by the manager with symbol context.
 */
export interface ManagerEvent extends MatchingEvent {
  symbol: string;
}

export type ManagerEventHandler = (event: ManagerEvent) => void;

/**
 * Manages all order books and matching engines.
 */
export class OrderBookManager {
  private engines: Map<string, MatchingEngine> = new Map();
  private eventHandlers: ManagerEventHandler[] = [];
  private activeSymbols: Set<string> = new Set();

  constructor(private readonly symbols: string[] = []) {
    // Pre-initialize engines for known symbols
    for (const symbol of symbols) {
      this.getOrCreateEngine(symbol);
    }
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Process an order for any symbol.
   */
  processOrder(order: EngineOrder, timeInForce: TimeInForce = 'GTC'): MatchResult {
    const engine = this.getOrCreateEngine(order.symbol);
    return engine.processOrder(order, timeInForce);
  }

  /**
   * Cancel an order by ID and symbol.
   */
  cancelOrder(symbol: string, orderId: string): MatchResult {
    const engine = this.engines.get(symbol);

    if (!engine) {
      return {
        orderId,
        status: 'rejected',
        trades: [],
        filledQuantity: 0,
        remainingQuantity: 0,
        averagePrice: null,
        bookUpdates: [],
        rejectReason: `No order book for symbol: ${symbol}`,
      };
    }

    return engine.cancelOrder(orderId);
  }

  /**
   * Get order book snapshot for a symbol.
   */
  getOrderBookSnapshot(symbol: string, depth?: number): OrderBookSnapshot | null {
    const engine = this.engines.get(symbol);
    return engine?.orderBook.getSnapshot(depth) ?? null;
  }

  /**
   * Get all pending order book updates for a symbol.
   */
  flushUpdates(symbol: string): OrderBookUpdate[] {
    const engine = this.engines.get(symbol);
    return engine?.orderBook.flushUpdates() ?? [];
  }

  /**
   * Get all pending updates for all symbols.
   */
  flushAllUpdates(): Map<string, OrderBookUpdate[]> {
    const updates = new Map<string, OrderBookUpdate[]>();

    for (const [symbol, engine] of this.engines) {
      const symbolUpdates = engine.orderBook.flushUpdates();
      if (symbolUpdates.length > 0) {
        updates.set(symbol, symbolUpdates);
      }
    }

    return updates;
  }

  /**
   * Get best bid/ask for a symbol.
   */
  getBestPrices(symbol: string): { bid: number | null; ask: number | null; spread: number | null } {
    const engine = this.engines.get(symbol);

    if (!engine) {
      return { bid: null, ask: null, spread: null };
    }

    const { orderBook } = engine;
    return {
      bid: orderBook.getBestBid(),
      ask: orderBook.getBestAsk(),
      spread: orderBook.getSpread(),
    };
  }

  /**
   * Get current market price for a symbol.
   */
  getCurrentPrice(symbol: string): number | null {
    const engine = this.engines.get(symbol);
    return engine?.getCurrentPrice() ?? null;
  }

  /**
   * Set market price for a symbol (from external feed).
   */
  setCurrentPrice(symbol: string, price: number): void {
    const engine = this.getOrCreateEngine(symbol);
    engine.setCurrentPrice(price);
  }

  /**
   * Load an order into the book (for recovery).
   */
  loadOrder(order: EngineOrder): void {
    const engine = this.getOrCreateEngine(order.symbol);
    engine.loadOrder(order);
  }

  /**
   * Get statistics for all order books.
   */
  getStats(): OrderBookManagerStats {
    let totalBidOrders = 0;
    let totalAskOrders = 0;
    let totalBidVolume = 0;
    let totalAskVolume = 0;
    const symbolStats = new Map<string, any>();

    for (const [symbol, engine] of this.engines) {
      const stats = engine.orderBook.getStats();
      totalBidOrders += stats.bidOrders;
      totalAskOrders += stats.askOrders;
      totalBidVolume += stats.totalBidVolume;
      totalAskVolume += stats.totalAskVolume;

      symbolStats.set(symbol, {
        bidOrders: stats.bidOrders,
        askOrders: stats.askOrders,
        bidVolume: stats.totalBidVolume,
        askVolume: stats.totalAskVolume,
        spread: engine.orderBook.getSpread(),
        midPrice: engine.orderBook.getMidPrice(),
      });
    }

    return {
      totalSymbols: this.engines.size,
      totalBidOrders,
      totalAskOrders,
      totalBidVolume,
      totalAskVolume,
      symbolStats,
    };
  }

  /**
   * Get all active symbols.
   */
  getActiveSymbols(): string[] {
    return Array.from(this.activeSymbols);
  }

  /**
   * Check if a symbol has an active order book.
   */
  hasOrderBook(symbol: string): boolean {
    return this.engines.has(symbol);
  }

  /**
   * Register event handler for all symbols.
   */
  onEvent(handler: ManagerEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index !== -1) this.eventHandlers.splice(index, 1);
    };
  }

  /**
   * Clear all order books (for testing or shutdown).
   */
  clear(): void {
    this.engines.clear();
    this.activeSymbols.clear();
    log.info('All order books cleared');
  }

  /**
   * Remove a specific symbol's order book.
   */
  removeSymbol(symbol: string): boolean {
    const removed = this.engines.delete(symbol);
    if (removed) {
      this.activeSymbols.delete(symbol);
      log.info({ symbol }, 'Order book removed');
    }
    return removed;
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private getOrCreateEngine(symbol: string): MatchingEngine {
    let engine = this.engines.get(symbol);

    if (!engine) {
      engine = new MatchingEngine(symbol);
      this.engines.set(symbol, engine);
      this.activeSymbols.add(symbol);

      // Forward events with symbol context
      engine.onEvent((event) => {
        this.emitManagerEvent(symbol, event);
      });

      log.info({ symbol }, 'Created order book');
    }

    return engine;
  }

  private emitManagerEvent(symbol: string, event: MatchingEvent): void {
    const managerEvent: ManagerEvent = { ...event, symbol };

    for (const handler of this.eventHandlers) {
      try {
        handler(managerEvent);
      } catch (error) {
        log.error({ error, symbol, event: event.type }, 'Error in event handler');
      }
    }
  }
}
