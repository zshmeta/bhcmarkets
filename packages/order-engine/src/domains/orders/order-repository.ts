/**
 * Order Repository
 * =================
 *
 * Handles order persistence to PostgreSQL database.
 * Uses the shared @repo/database schema.
 */

import { getDbClient, withTransaction } from '../../db/connection.js';
import type { EngineOrder, EngineTrade, Order } from '../../types/order.types.js';
import { logger } from '../../utils/logger.js';

const log = logger.child({ component: 'order-repository' });

// ============================================================================
// ORDER OPERATIONS
// ============================================================================

/**
 * Save a new order to the database.
 */
export async function saveOrder(order: EngineOrder & { timeInForce: string }): Promise<void> {
  const sql = getDbClient();

  try {
    await sql`
      INSERT INTO orders (
        id, account_id, symbol, side, type, time_in_force,
        quantity, filled_quantity, price, stop_price,
        status, client_order_id, created_at, updated_at
      ) VALUES (
        ${order.id},
        ${order.accountId},
        ${order.symbol},
        ${order.side},
        ${order.type},
        ${order.timeInForce},
        ${order.quantity},
        ${order.filledQuantity},
        ${order.price ?? null},
        ${order.stopPrice ?? null},
        'open',
        ${order.clientOrderId ?? null},
        ${new Date(order.timestamp)},
        ${new Date(order.timestamp)}
      )
    `;

    log.debug({ orderId: order.id }, 'Order saved');
  } catch (error) {
    log.error({ error, orderId: order.id }, 'Failed to save order');
    throw error;
  }
}

/**
 * Update order status and filled quantity.
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  filledQuantity: number
): Promise<void> {
  const sql = getDbClient();

  try {
    await sql`
      UPDATE orders
      SET status = ${status},
          filled_quantity = ${filledQuantity},
          updated_at = NOW()
      WHERE id = ${orderId}
    `;

    log.debug({ orderId, status, filledQuantity }, 'Order status updated');
  } catch (error) {
    log.error({ error, orderId }, 'Failed to update order status');
    throw error;
  }
}

/**
 * Cancel an order.
 */
export async function cancelOrder(orderId: string): Promise<boolean> {
  const sql = getDbClient();

  try {
    const result = await sql`
      UPDATE orders
      SET status = 'cancelled',
          updated_at = NOW()
      WHERE id = ${orderId}
        AND status IN ('open', 'partially_filled')
      RETURNING id
    `;

    const cancelled = result.length > 0;
    log.debug({ orderId, cancelled }, 'Order cancellation attempted');
    return cancelled;
  } catch (error) {
    log.error({ error, orderId }, 'Failed to cancel order');
    throw error;
  }
}

/**
 * Get open orders for recovery.
 */
export async function getOpenOrders(symbol?: string): Promise<EngineOrder[]> {
  const sql = getDbClient();

  try {
    let result;

    if (symbol) {
      result = await sql`
        SELECT id, account_id, symbol, side, type, quantity, filled_quantity,
               price, stop_price, client_order_id, created_at
        FROM orders
        WHERE status IN ('open', 'partially_filled')
          AND symbol = ${symbol}
        ORDER BY created_at ASC
      `;
    } else {
      result = await sql`
        SELECT id, account_id, symbol, side, type, quantity, filled_quantity,
               price, stop_price, client_order_id, created_at
        FROM orders
        WHERE status IN ('open', 'partially_filled')
        ORDER BY created_at ASC
      `;
    }

    return result.map((row: any) => ({
      id: row.id,
      accountId: row.account_id,
      symbol: row.symbol,
      side: row.side,
      type: row.type,
      quantity: Number(row.quantity),
      filledQuantity: Number(row.filled_quantity),
      price: row.price ? Number(row.price) : undefined,
      stopPrice: row.stop_price ? Number(row.stop_price) : undefined,
      clientOrderId: row.client_order_id,
      timestamp: new Date(row.created_at).getTime(),
    }));
  } catch (error) {
    log.error({ error, symbol }, 'Failed to get open orders');
    throw error;
  }
}

/**
 * Get orders by account.
 */
export async function getOrdersByAccount(
  accountId: string,
  options: {
    symbol?: string;
    status?: string[];
    limit?: number;
    offset?: number;
  } = {}
): Promise<Order[]> {
  const sql = getDbClient();
  const { symbol, status, limit = 100, offset = 0 } = options;

  try {
    let result;

    if (symbol && status) {
      result = await sql`
        SELECT *
        FROM orders
        WHERE account_id = ${accountId}
          AND symbol = ${symbol}
          AND status = ANY(${status})
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (symbol) {
      result = await sql`
        SELECT *
        FROM orders
        WHERE account_id = ${accountId}
          AND symbol = ${symbol}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (status) {
      result = await sql`
        SELECT *
        FROM orders
        WHERE account_id = ${accountId}
          AND status = ANY(${status})
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      result = await sql`
        SELECT *
        FROM orders
        WHERE account_id = ${accountId}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    return result.map((row: any) => ({
      id: row.id,
      accountId: row.account_id,
      symbol: row.symbol,
      side: row.side,
      type: row.type,
      timeInForce: row.time_in_force,
      quantity: Number(row.quantity),
      filledQuantity: Number(row.filled_quantity),
      price: row.price ? Number(row.price) : undefined,
      stopPrice: row.stop_price ? Number(row.stop_price) : undefined,
      status: row.status,
      clientOrderId: row.client_order_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  } catch (error) {
    log.error({ error, accountId }, 'Failed to get orders');
    throw error;
  }
}

/**
 * Get single order by ID.
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const sql = getDbClient();

  try {
    const result = await sql`
      SELECT *
      FROM orders
      WHERE id = ${orderId}
    `;

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      accountId: row.account_id,
      symbol: row.symbol,
      side: row.side,
      type: row.type,
      timeInForce: row.time_in_force,
      quantity: Number(row.quantity),
      filledQuantity: Number(row.filled_quantity),
      price: row.price ? Number(row.price) : undefined,
      stopPrice: row.stop_price ? Number(row.stop_price) : undefined,
      status: row.status,
      clientOrderId: row.client_order_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  } catch (error) {
    log.error({ error, orderId }, 'Failed to get order');
    throw error;
  }
}

// ============================================================================
// TRADE OPERATIONS
// ============================================================================

/**
 * Save a batch of trades.
 */
export async function saveTrades(trades: (EngineTrade & { id: string; symbol: string })[]): Promise<void> {
  if (trades.length === 0) return;

  const sql = getDbClient();

  try {
    await withTransaction(async (tx) => {
      for (const trade of trades) {
        await tx`
          INSERT INTO trades (
            id, symbol, maker_order_id, taker_order_id,
            maker_account_id, taker_account_id,
            price, quantity, created_at
          ) VALUES (
            ${trade.id},
            ${trade.symbol},
            ${trade.makerOrderId},
            ${trade.takerOrderId},
            ${trade.makerAccountId},
            ${trade.takerAccountId},
            ${trade.price},
            ${trade.quantity},
            ${new Date(trade.timestamp)}
          )
        `;
      }
    });

    log.debug({ count: trades.length }, 'Trades saved');
  } catch (error) {
    log.error({ error, count: trades.length }, 'Failed to save trades');
    throw error;
  }
}

/**
 * Get trades by account.
 */
export async function getTradesByAccount(
  accountId: string,
  options: {
    symbol?: string;
    limit?: number;
    offset?: number;
    startTime?: Date;
    endTime?: Date;
  } = {}
): Promise<any[]> {
  const sql = getDbClient();
  const { symbol, limit = 100, offset = 0, startTime, endTime } = options;

  try {
    let result;

    // Build query based on options
    if (symbol && startTime && endTime) {
      result = await sql`
        SELECT *
        FROM trades
        WHERE (maker_account_id = ${accountId} OR taker_account_id = ${accountId})
          AND symbol = ${symbol}
          AND created_at >= ${startTime}
          AND created_at <= ${endTime}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (symbol) {
      result = await sql`
        SELECT *
        FROM trades
        WHERE (maker_account_id = ${accountId} OR taker_account_id = ${accountId})
          AND symbol = ${symbol}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      result = await sql`
        SELECT *
        FROM trades
        WHERE maker_account_id = ${accountId} OR taker_account_id = ${accountId}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    return result.map((row: any) => ({
      id: row.id,
      symbol: row.symbol,
      makerOrderId: row.maker_order_id,
      takerOrderId: row.taker_order_id,
      makerAccountId: row.maker_account_id,
      takerAccountId: row.taker_account_id,
      price: Number(row.price),
      quantity: Number(row.quantity),
      createdAt: new Date(row.created_at),
    }));
  } catch (error) {
    log.error({ error, accountId }, 'Failed to get trades');
    throw error;
  }
}

/**
 * Get recent trades for a symbol.
 */
export async function getRecentTrades(
  symbol: string,
  limit: number = 100
): Promise<any[]> {
  const sql = getDbClient();

  try {
    const result = await sql`
      SELECT id, symbol, price, quantity, created_at
      FROM trades
      WHERE symbol = ${symbol}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result.map((row: any) => ({
      id: row.id,
      symbol: row.symbol,
      price: Number(row.price),
      quantity: Number(row.quantity),
      timestamp: new Date(row.created_at).getTime(),
    }));
  } catch (error) {
    log.error({ error, symbol }, 'Failed to get recent trades');
    throw error;
  }
}
