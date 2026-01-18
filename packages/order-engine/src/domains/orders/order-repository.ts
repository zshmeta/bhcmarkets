
/**
 * Order Repository
 * =================
 *
 * Handles order persistence to PostgreSQL database.
 * Uses the shared @repo/database schema.
 */

import { getDbClient } from '@repo/database';
// Import types explicitly from order.types.js to avoid conflict with trading.types.js
import type {
  EngineOrder,
  EngineTrade,
  OrderStatus,
  OrderSide,
  Order as SdkOrder,
  TimeInForce
} from '@repo/sdk';
import { env } from '../../config/env.js';
import { logger } from '@repo/sdk';

const log = logger.child({ component: 'order-repository' });

async function getSql() {
  return getDbClient({ connectionString: env.DATABASE_URL });
}

// ============================================================================
// ORDER OPERATIONS
// ============================================================================

/**
 * Save a new order to the database.
 */

type PersistedOrder = EngineOrder & {
  timeInForce: string,
  clientOrderId?: string
};

export async function saveOrder(order: PersistedOrder): Promise<void> {
  const sql = await getSql();

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
  const sql = await getSql();

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
  try {
    const sql = await getSql();
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
  const sql = await getSql();

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
      price: row.price ? Number(row.price) : 0,
      stopPrice: row.stop_price ? Number(row.stop_price) : 0,
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
): Promise<SdkOrder[]> {
  const sql = await getSql();
  const { symbol, status, limit = 100, offset = 0 } = options;

  try {
    let result;

    if (symbol && status) {
      result = await sql`
        SELECT o.*, a.user_id
        FROM orders o
        JOIN accounts a ON a.id = o.account_id
        WHERE o.account_id = ${accountId}
          AND o.symbol = ${symbol}
          AND o.status = ANY(${status})
        ORDER BY o.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (symbol) {
      result = await sql`
        SELECT o.*, a.user_id
        FROM orders o
        JOIN accounts a ON a.id = o.account_id
        WHERE o.account_id = ${accountId}
          AND o.symbol = ${symbol}
        ORDER BY o.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (status) {
      result = await sql`
        SELECT o.*, a.user_id
        FROM orders o
        JOIN accounts a ON a.id = o.account_id
        WHERE o.account_id = ${accountId}
          AND o.status = ANY(${status})
        ORDER BY o.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      result = await sql`
        SELECT o.*, a.user_id
        FROM orders o
        JOIN accounts a ON a.id = o.account_id
        WHERE o.account_id = ${accountId}
        ORDER BY o.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    return result.map((row: any) => ({
      id: row.id,
      accountId: row.account_id,
      userId: row.user_id,
      symbol: row.symbol,
      side: row.side,
      type: row.type,
      timeInForce: row.time_in_force as TimeInForce,
      quantity: String(row.quantity),
      filledQuantity: String(row.filled_quantity),
      remainingQuantity: String(Number(row.quantity) - Number(row.filled_quantity)),
      price: row.price ? String(row.price) : null,
      stopPrice: row.stop_price ? String(row.stop_price) : null,
      averageFillPrice: row.average_fill_price ? String(row.average_fill_price) : null,
      status: row.status as OrderStatus,
      clientOrderId: row.client_order_id,
      // Ensure Dates are used as expected by SDK
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
      cancelReason: row.cancel_reason ?? undefined,
      // If SDK expects strings for nullables, these casts handle it.
      // Actually checking SDK again: for Order, it expects Date objects for timestamps?
      // Yes: createdAt: Date; updatedAt: Date;
    } as unknown as SdkOrder));
  } catch (error) {
    log.error({ error, accountId }, 'Failed to get orders');
    throw error;
  }
}

/**
 * Get single order by ID.
 */
export async function getOrderById(orderId: string): Promise<SdkOrder | null> {
  const sql = await getSql();

  try {
    const result = (await sql`
      SELECT o.*, a.user_id
      FROM orders o
      JOIN accounts a ON a.id = o.account_id
      WHERE o.id = ${orderId}
      LIMIT 1
    `) as any[];

    const row = result[0] as any;
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      accountId: row.account_id,
      userId: row.user_id,
      symbol: row.symbol,
      side: row.side,
      type: row.type,
      status: row.status as OrderStatus,
      timeInForce: row.time_in_force as TimeInForce,
      price: row.price ? String(row.price) : null,
      stopPrice: row.stop_price ? String(row.stop_price) : null,
      quantity: String(row.quantity),
      filledQuantity: String(row.filled_quantity),
      remainingQuantity: String(Number(row.quantity) - Number(row.filled_quantity)),
      averageFillPrice: row.average_fill_price ? String(row.average_fill_price) : null,
      clientOrderId: row.client_order_id,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
      cancelReason: row.cancel_reason ?? undefined,
    } as unknown as SdkOrder;
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

  try {
    // Ensure the singleton DB client is initialized with the env connection string.
    const sql = await getSql();

    await sql.begin(async (tx) => {
      // postgres.js transactions are template-tag functions at runtime.
      // We cast tx to any or strict definition if available, but for now strict any is safest.
      const sqlTx = tx as any;
      for (const trade of trades) {
        await sqlTx`
          INSERT INTO execution_trades (
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
  const sql = await getSql();
  const { symbol, limit = 100, offset = 0, startTime, endTime } = options;

  try {
    let result;

    // Build query based on options
    if (symbol && startTime && endTime) {
      result = await sql`
        SELECT *
        FROM execution_trades
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
        FROM execution_trades
        WHERE (maker_account_id = ${accountId} OR taker_account_id = ${accountId})
          AND symbol = ${symbol}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      result = await sql`
        SELECT *
        FROM execution_trades
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
  const sql = await getSql();

  try {
    const result = await sql`
      SELECT id, symbol, price, quantity, created_at
      FROM execution_trades
      WHERE symbol = ${symbol}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result.map((row: any) => ({
      id: row.id,
      symbol: row.symbol,
      price: String(row.price),
      quantity: String(row.quantity),
      timestamp: String(new Date(row.created_at).getTime()),
    }));
  } catch (error) {
    log.error({ error, symbol }, 'Failed to get recent trades');
    throw error;
  }
}
