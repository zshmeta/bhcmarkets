/**
 * Trade Repository
 * ================
 *
 * Handles trade persistence to PostgreSQL database.
 */

import { getDbClient, withTransaction } from '@repo/database';
import type { Trade, AccountTrade, TradeStats } from './trade.types.js';
import { logger } from '../../utils/logger.js';

const log = logger.child({ component: 'trade-repository' });

/**
 * Save a batch of trades.
 */
export async function saveTrades(trades: Trade[]): Promise<void> {
  if (trades.length === 0) return;

  const sql = await getDbClient();

  try {
    await withTransaction(async (tx) => {
      for (const trade of trades) {
        await tx`
          INSERT INTO trades (
            id, symbol, maker_order_id, taker_order_id,
            maker_account_id, taker_account_id,
            price, quantity, maker_fee, taker_fee,
            status, created_at, settled_at
          ) VALUES (
            ${trade.id},
            ${trade.symbol},
            ${trade.makerOrderId},
            ${trade.takerOrderId},
            ${trade.makerAccountId},
            ${trade.takerAccountId},
            ${trade.price},
            ${trade.quantity},
            ${trade.makerFee},
            ${trade.takerFee},
            ${trade.status},
            ${trade.createdAt},
            ${trade.settledAt ?? null}
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
 * Get trade by ID.
 */
export async function getTradeById(tradeId: string): Promise<Trade | null> {
  const sql = await getDbClient();

  try {
    const result = await sql`
      SELECT *
      FROM trades
      WHERE id = ${tradeId}
    `;

    if (result.length === 0) return null;

    return mapRowToTrade(result[0]);
  } catch (error) {
    log.error({ error, tradeId }, 'Failed to get trade');
    throw error;
  }
}

/**
 * Get trades for an account.
 */
export async function getAccountTrades(
  accountId: string,
  options: {
    symbol?: string;
    limit?: number;
    offset?: number;
    startTime?: Date;
    endTime?: Date;
  } = {}
): Promise<Trade[]> {
  const sql = await getDbClient();
  const { symbol, limit = 100, offset = 0, startTime, endTime } = options;

  try {
    let result;

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
    } else if (startTime && endTime) {
      result = await sql`
        SELECT *
        FROM trades
        WHERE (maker_account_id = ${accountId} OR taker_account_id = ${accountId})
          AND created_at >= ${startTime}
          AND created_at <= ${endTime}
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

    return result.map(mapRowToTrade);
  } catch (error) {
    log.error({ error, accountId }, 'Failed to get account trades');
    throw error;
  }
}

/**
 * Get recent trades for a symbol.
 */
export async function getRecentTrades(
  symbol: string,
  limit: number = 100
): Promise<Trade[]> {
  const sql = await getDbClient();

  try {
    const result = await sql`
      SELECT *
      FROM trades
      WHERE symbol = ${symbol}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result.map(mapRowToTrade);
  } catch (error) {
    log.error({ error, symbol }, 'Failed to get recent trades');
    throw error;
  }
}

/**
 * Get trade statistics for a symbol (24h).
 */
export async function getSymbolStats(symbol: string): Promise<TradeStats | null> {
  const sql = await getDbClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const result = await sql`
      SELECT
        COUNT(*) as trade_count,
        COALESCE(SUM(price * quantity), 0) as volume,
        COALESCE(MAX(price), 0) as high,
        COALESCE(MIN(price), 0) as low,
        (SELECT price FROM trades WHERE symbol = ${symbol} ORDER BY created_at DESC LIMIT 1) as last_price,
        (SELECT created_at FROM trades WHERE symbol = ${symbol} ORDER BY created_at DESC LIMIT 1) as last_trade_time
      FROM trades
      WHERE symbol = ${symbol}
        AND created_at >= ${since}
    `;

    if (result.length === 0 || result[0]?.trade_count === '0') {
      return null;
    }

    const row = result[0]!;
    return {
      symbol,
      trades24h: parseInt(row.trade_count as string),
      volume24h: Number(row.volume),
      high24h: Number(row.high),
      low24h: Number(row.low),
      lastPrice: Number(row.last_price) || 0,
      lastTradeTime: row.last_trade_time ? new Date(row.last_trade_time as string).getTime() : 0,
    };
  } catch (error) {
    log.error({ error, symbol }, 'Failed to get symbol stats');
    throw error;
  }
}

/**
 * Get 30-day volume for an account (for fee tier calculation).
 */
export async function getAccount30DayVolume(accountId: string): Promise<number> {
  const sql = await getDbClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    const result = await sql`
      SELECT COALESCE(SUM(price * quantity), 0) as volume
      FROM trades
      WHERE (maker_account_id = ${accountId} OR taker_account_id = ${accountId})
        AND created_at >= ${since}
    `;

    return Number(result[0]?.volume ?? 0);
  } catch (error) {
    log.error({ error, accountId }, 'Failed to get 30-day volume');
    throw error;
  }
}

/**
 * Map database row to Trade object.
 */
function mapRowToTrade(row: any): Trade {
  return {
    id: row.id,
    symbol: row.symbol,
    makerOrderId: row.maker_order_id,
    takerOrderId: row.taker_order_id,
    makerAccountId: row.maker_account_id,
    takerAccountId: row.taker_account_id,
    price: Number(row.price),
    quantity: Number(row.quantity),
    makerFee: Number(row.maker_fee),
    takerFee: Number(row.taker_fee),
    status: row.status,
    createdAt: new Date(row.created_at),
    settledAt: row.settled_at ? new Date(row.settled_at) : undefined,
  };
}
