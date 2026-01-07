/**
 * Order Manager Service
 * =====================
 *
 * High-level order management that coordinates:
 * - Order validation
 * - Order persistence
 * - Matching engine
 * - Event publishing
 * - Stop order management
 */

import { randomUUID } from 'crypto';
import type {
  PlaceOrderInput,
  PlaceOrderResult,
  CancelOrderResult,
  EngineOrder,
  EngineTrade,
  Order,
  TimeInForce,
} from '../../types/order.types.js';
import { OrderValidator, getOrderValidator } from './order-validator.js';
import {
  saveOrder,
  updateOrderStatus,
  cancelOrder as cancelOrderInDb,
  getOpenOrders,
  getOrderById,
  saveTrades,
} from './order-repository.js';
import { OrderBookManager, type MatchResult, type ManagerEvent } from '../matching/index.js';
import { publish } from '@repo/database';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

const log = logger.child({ component: 'order-manager' });

// ============================================================================
// STOP ORDER MANAGEMENT
// ============================================================================

interface StopOrder {
  order: EngineOrder;
  timeInForce: TimeInForce;
  triggerPrice: number;
}

class StopOrderManager {
  private stopOrders: Map<string, StopOrder[]> = new Map(); // symbol -> orders

  add(symbol: string, stopOrder: StopOrder): void {
    let orders = this.stopOrders.get(symbol);
    if (!orders) {
      orders = [];
      this.stopOrders.set(symbol, orders);
    }
    orders.push(stopOrder);
  }

  remove(orderId: string): boolean {
    for (const [symbol, orders] of this.stopOrders) {
      const index = orders.findIndex((o) => o.order.id === orderId);
      if (index !== -1) {
        orders.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  checkTriggers(symbol: string, currentPrice: number): StopOrder[] {
    const orders = this.stopOrders.get(symbol);
    if (!orders || orders.length === 0) return [];

    const triggered: StopOrder[] = [];
    const remaining: StopOrder[] = [];

    for (const stopOrder of orders) {
      const { order, triggerPrice } = stopOrder;
      let shouldTrigger = false;

      if (order.side === 'buy') {
        // Buy stop triggers when price goes up to trigger price
        shouldTrigger = currentPrice >= triggerPrice;
      } else {
        // Sell stop triggers when price goes down to trigger price
        shouldTrigger = currentPrice <= triggerPrice;
      }

      if (shouldTrigger) {
        triggered.push(stopOrder);
      } else {
        remaining.push(stopOrder);
      }
    }

    this.stopOrders.set(symbol, remaining);
    return triggered;
  }

  getAll(): Map<string, StopOrder[]> {
    return new Map(this.stopOrders);
  }
}

// ============================================================================
// ORDER MANAGER
// ============================================================================

export interface OrderManagerConfig {
  enablePersistence?: boolean;
  enableEventPublishing?: boolean;
  tradeBatchSize?: number;
  tradeFlushIntervalMs?: number;
}

export class OrderManager {
  private validator: OrderValidator;
  private bookManager: OrderBookManager;
  private stopOrderManager: StopOrderManager;
  private pendingTrades: (EngineTrade & { id: string; symbol: string })[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private config: Required<OrderManagerConfig>;

  constructor(config: OrderManagerConfig = {}) {
    this.config = {
      enablePersistence: true,
      enableEventPublishing: true,
      tradeBatchSize: env.TRADE_BATCH_SIZE,
      tradeFlushIntervalMs: env.TRADE_FLUSH_INTERVAL_MS,
      ...config,
    };

    this.validator = getOrderValidator();
    this.bookManager = new OrderBookManager();
    this.stopOrderManager = new StopOrderManager();

    // Subscribe to matching events
    this.bookManager.onEvent(this.handleMatchingEvent.bind(this));

    // Start trade flush interval
    if (this.config.enablePersistence) {
      this.flushInterval = setInterval(() => {
        this.flushTrades().catch((err) => {
          log.error({ error: err }, 'Failed to flush trades');
        });
      }, this.config.tradeFlushIntervalMs);
    }

    log.info('Order manager initialized');
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Place a new order.
   */
  async placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    const orderId = randomUUID();

    // 1. Validate
    const validation = this.validator.validate(input);
    if (!validation.valid) {
      return {
        success: false,
        orderId,
        errors: validation.errors,
      };
    }

    const validOrder = validation.order!;

    // 2. Create engine order
    const engineOrder: EngineOrder = {
      id: orderId,
      accountId: validOrder.accountId,
      symbol: validOrder.symbol,
      side: validOrder.side,
      type: validOrder.type,
      quantity: validOrder.quantity,
      filledQuantity: 0,
      price: validOrder.price!,
      stopPrice: validOrder.stopPrice,
      clientOrderId: validOrder.clientOrderId,
      timestamp: Date.now(),
    };

    try {
      // 3. Handle stop orders
      if (validOrder.type === 'stop' || validOrder.type === 'stop_limit') {
        return await this.handleStopOrder(engineOrder, validOrder.timeInForce);
      }

      // 4. Process regular order
      const result = this.bookManager.processOrder(engineOrder, validOrder.timeInForce);

      // 5. Persist order
      if (this.config.enablePersistence) {
        await saveOrder({ ...engineOrder, timeInForce: validOrder.timeInForce });
        if (result.filledQuantity > 0 || result.status === 'open') {
          await updateOrderStatus(orderId, result.status, result.filledQuantity);
        }
      }

      // 6. Publish event
      if (this.config.enableEventPublishing) {
        await this.publishOrderEvent('order_placed', orderId, validOrder.symbol, {
          status: result.status,
          filledQuantity: result.filledQuantity,
          trades: result.trades.length,
        });
      }

      log.info({
        orderId,
        symbol: validOrder.symbol,
        side: validOrder.side,
        type: validOrder.type,
        status: result.status,
      }, 'Order placed');

      return {
        success: true,
        orderId,
        status: result.status,
        filledQuantity: result.filledQuantity,
        remainingQuantity: result.remainingQuantity,
        averagePrice: result.averagePrice ?? undefined,
        trades: result.trades.map((t) => ({
          price: t.price,
          quantity: t.quantity,
          timestamp: t.timestamp,
        })),
      };
    } catch (error) {
      log.error({ error, orderId }, 'Failed to place order');
      return {
        success: false,
        orderId,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Cancel an order.
   */
  async cancelOrder(orderId: string, accountId: string): Promise<CancelOrderResult> {
    try {
      // Get order to verify ownership and get symbol
      const order = await getOrderById(orderId);

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      if (order.accountId !== accountId) {
        return { success: false, error: 'Not authorized to cancel this order' };
      }

      if (order.status !== 'open' && order.status !== 'partially_filled') {
        return { success: false, error: `Cannot cancel order with status: ${order.status}` };
      }

      // Try to cancel in matching engine
      const result = this.bookManager.cancelOrder(order.symbol, orderId);

      if (result.status === 'cancelled') {
        // Also check stop orders
        this.stopOrderManager.remove(orderId);

        // Update in database
        if (this.config.enablePersistence) {
          await cancelOrderInDb(orderId);
        }

        // Publish event
        if (this.config.enableEventPublishing) {
          await this.publishOrderEvent('order_cancelled', orderId, order.symbol);
        }

        log.info({ orderId, symbol: order.symbol }, 'Order cancelled');
        return { success: true };
      }

      return { success: false, error: result.rejectReason || 'Failed to cancel' };
    } catch (error) {
      log.error({ error, orderId }, 'Failed to cancel order');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get order by ID.
   */
  async getOrder(orderId: string): Promise<Order | null> {
    return getOrderById(orderId);
  }

  /**
   * Update market price (checks stop orders).
   */
  async updateMarketPrice(symbol: string, price: number): Promise<void> {
    this.bookManager.setCurrentPrice(symbol, price);
    this.validator.setMarketPrice(symbol, price);

    // Check stop orders
    const triggered = this.stopOrderManager.checkTriggers(symbol, price);

    for (const stopOrder of triggered) {
      log.info({ orderId: stopOrder.order.id, price }, 'Stop order triggered');

      // Convert stop to market/limit and execute
      const executionOrder: EngineOrder = {
        ...stopOrder.order,
        type: stopOrder.order.type === 'stop' ? 'market' : 'limit',
      };

      const result = this.bookManager.processOrder(executionOrder, stopOrder.timeInForce);

      if (this.config.enablePersistence) {
        await updateOrderStatus(stopOrder.order.id, result.status, result.filledQuantity);
      }

      if (this.config.enableEventPublishing) {
        await this.publishOrderEvent('stop_triggered', stopOrder.order.id, symbol, {
          status: result.status,
        });
      }
    }
  }

  /**
   * Recover orders from database.
   */
  async recoverOrders(symbol?: string): Promise<number> {
    const openOrders = await getOpenOrders(symbol);

    for (const order of openOrders) {
      if (order.type === 'stop' || order.type === 'stop_limit') {
        // Add back to stop order manager
        this.stopOrderManager.add(order.symbol, {
          order,
          timeInForce: 'GTC',
          triggerPrice: order.stopPrice!,
        });
      } else {
        // Load into order book
        this.bookManager.loadOrder(order);
      }
    }

    log.info({ count: openOrders.length, symbol }, 'Orders recovered');
    return openOrders.length;
  }

  /**
   * Get order book snapshot.
   */
  getOrderBookSnapshot(symbol: string, depth?: number) {
    return this.bookManager.getOrderBookSnapshot(symbol, depth);
  }

  /**
   * Get statistics.
   */
  getStats() {
    return this.bookManager.getStats();
  }

  /**
   * Shutdown the order manager.
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    // Flush any pending trades
    await this.flushTrades();

    log.info('Order manager shutdown');
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private async handleStopOrder(
    order: EngineOrder,
    timeInForce: TimeInForce
  ): Promise<PlaceOrderResult> {
    // Add to stop order manager
    this.stopOrderManager.add(order.symbol, {
      order,
      timeInForce,
      triggerPrice: order.stopPrice!,
    });

    // Persist as pending stop order
    if (this.config.enablePersistence) {
      await saveOrder({ ...order, timeInForce });
    }

    log.info({ orderId: order.id, stopPrice: order.stopPrice }, 'Stop order placed');

    return {
      success: true,
      orderId: order.id,
      status: 'open',
      filledQuantity: 0,
      remainingQuantity: order.quantity,
    };
  }

  private handleMatchingEvent(event: ManagerEvent): void {
    if (event.type === 'trade') {
      const trade = event.trade;
      this.pendingTrades.push({
        ...trade,
        id: randomUUID(),
        symbol: event.symbol,
      });

      // Flush if batch size reached
      if (this.pendingTrades.length >= this.config.tradeBatchSize) {
        this.flushTrades().catch((err) => {
          log.error({ error: err }, 'Failed to flush trades');
        });
      }
    }
  }

  private async flushTrades(): Promise<void> {
    if (this.pendingTrades.length === 0) return;

    const trades = this.pendingTrades;
    this.pendingTrades = [];

    try {
      if (this.config.enablePersistence) {
        await saveTrades(trades);
      }

      if (this.config.enableEventPublishing) {
        for (const trade of trades) {
          await publish(`trades:${trade.symbol}`, JSON.stringify(trade));
        }
      }

      log.debug({ count: trades.length }, 'Trades flushed');
    } catch (error) {
      // Put trades back for retry
      this.pendingTrades.unshift(...trades);
      throw error;
    }
  }

  private async publishOrderEvent(
    eventType: string,
    orderId: string,
    symbol: string,
    data?: Record<string, any>
  ): Promise<void> {
    const event = {
      type: eventType,
      orderId,
      symbol,
      timestamp: Date.now(),
      ...data,
    };

    await publish(`orders:${symbol}`, JSON.stringify(event));
  }
}
