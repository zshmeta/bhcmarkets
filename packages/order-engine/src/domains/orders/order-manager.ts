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
  OrderBookSnapshot,
  TimeInForce,
} from '@repo/sdk';
import { logger } from '@repo/sdk';
import type { Order as DbOrder } from '@repo/sdk';
import { OrderValidator, getOrderValidator } from './order-validator.js';
import {
  saveOrder,
  updateOrderStatus,
  cancelOrder as cancelOrderInDb,
  getOpenOrders,
  getOrderById,
  saveTrades,
} from './order-repository.js';
import { OrderBookManager, type OrderBookManagerStats, type ManagerEvent } from '../matching/order-book-manager.js';
import { env } from '../../config/env.js';

const log = logger.child({ component: 'order-manager' });

// Stub publish function since it's not exported from SDK currently
async function publish(channel: string, message: string) {
  // TODO: Integrate proper Redis publisher
  log.debug({ channel, message }, 'Publishing event (stub)');
}

// ============================================================================
// STOP ORDER MANAGEMENT
// ============================================================================

interface StopOrder {
  order: EngineOrder;
  timeInForce: TimeInForce;
  triggerPrice: number;
}

class StopOrderManager {
  private stopOrders: Map<string, StopOrder[]> = new Map();

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
        shouldTrigger = currentPrice >= triggerPrice;
      } else {
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
          log.error({ err }, 'Failed to flush trades');
        });
      }, this.config.tradeFlushIntervalMs);
    }

    log.info('Order manager initialized');
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  async placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    const orderId = randomUUID();

    // 1. Validate
    const validation = this.validator.validate(input);
    if (!validation.valid || !validation.order) {
      return {
        success: false,
        error: validation.error || 'Validation failed',
      };
    }

    // `validation.order` is `PlaceOrderInput` (strings). Convert to `EngineOrder` (numbers).
    const validOrder = validation.order;
    const price = validOrder.price ? parseFloat(validOrder.price) : undefined;
    const stopPrice = validOrder.stopPrice ? parseFloat(validOrder.stopPrice) : undefined;
    const quantity = parseFloat(validOrder.quantity);

    if (isNaN(quantity) || (validOrder.type === 'limit' && (price === undefined || isNaN(price)))) {
       return { success: false, error: 'Invalid numeric values' };
    }

    // 2. Create engine order
    const engineOrder: EngineOrder = {
      id: orderId,
      accountId: validOrder.accountId,
      symbol: validOrder.symbol,
      side: validOrder.side,
      type: validOrder.type,
      quantity: quantity,
      filledQuantity: 0,
      price: (price ?? 0) as number, // Safe coercion
      stopPrice: (stopPrice ?? 0) as number,
      timestamp: Date.now(),
    };

    try {
      // 3. Handle stop orders
      if (validOrder.type === 'stop' || validOrder.type === 'stop_limit') {
        return await this.handleStopOrder(engineOrder, (validOrder.timeInForce ?? 'GTC') as TimeInForce);
      }

      // 4. Process regular order
      const result = this.bookManager.processOrder(engineOrder, (validOrder.timeInForce ?? 'GTC') as TimeInForce);

      // 5. Persist order
      if (this.config.enablePersistence) {
        // cast to PersistedOrder (add clientOrderId)
        await saveOrder({
             ...engineOrder, 
             timeInForce: (validOrder.timeInForce ?? 'GTC') as string,
             clientOrderId: validOrder.clientOrderId || undefined
        });

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
        order: undefined, // Or populate if we want to return the full order object
      };
    } catch (error) {
      log.error({ error, orderId }, 'Failed to place order');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async cancelOrder(orderId: string, accountId: string): Promise<CancelOrderResult> {
    try {
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

      const result = this.bookManager.cancelOrder(order.symbol, orderId);

      if (result.status === 'cancelled') {
        this.stopOrderManager.remove(orderId);

        if (this.config.enablePersistence) {
          await cancelOrderInDb(orderId);
        }

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

  async getOrder(orderId: string): Promise<DbOrder | null> {
    return getOrderById(orderId);
  }

  async updateMarketPrice(symbol: string, price: number): Promise<void> {
    this.bookManager.setCurrentPrice(symbol, price);
    this.validator.setMarketPrice(symbol, price);

    const triggered = this.stopOrderManager.checkTriggers(symbol, price);

    for (const stopOrder of triggered) {
      log.info({ orderId: stopOrder.order.id, price }, 'Stop order triggered');

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

  async recoverOrders(symbol?: string): Promise<number> {
    const openOrders = await getOpenOrders(symbol);

    for (const order of openOrders) {
      if (order.type === 'stop' || order.type === 'stop_limit') {
        this.stopOrderManager.add(order.symbol, {
          order,
          timeInForce: 'GTC', // TODO: Load this from DB if persisted
          triggerPrice: order.stopPrice!,
        });
      } else {
        this.bookManager.loadOrder(order);
      }
    }

    log.info({ count: openOrders.length, symbol }, 'Orders recovered');
    return openOrders.length;
  }

  getOrderBookSnapshot(symbol: string, depth?: number): OrderBookSnapshot | null {
    return this.bookManager.getOrderBookSnapshot(symbol, depth);
  }

  getStats(): OrderBookManagerStats {
    return this.bookManager.getStats();
  }

  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
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
    this.stopOrderManager.add(order.symbol, {
      order,
      timeInForce,
      triggerPrice: order.stopPrice!,
    });

    if (this.config.enablePersistence) {
      await saveOrder({ ...order, timeInForce });
    }

    log.info({ orderId: order.id, stopPrice: order.stopPrice }, 'Stop order placed');

    return {
      success: true,
      // order: ... (optional)
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

      if (this.pendingTrades.length >= this.config.tradeBatchSize) {
        this.flushTrades().catch((err) => {
          log.error({ err }, 'Failed to flush trades');
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
