/**
 * Position Repository
 * ===================
 *
 * Handles position persistence to PostgreSQL database.
 */

import { getDbClient } from '../../db/connection.js';
import type { EnginePosition, PositionSnapshot } from './position.types.js';
import { logger } from '../../utils/logger.js';

const log = logger.child({ component: 'position-repository' });

/**
 * Save or update a position.
 */
export async function upsertPosition(position: EnginePosition): Promise<void> {
  const sql = await getDbClient();

  try {
    await sql`
      INSERT INTO positions (
        account_id, symbol, quantity, average_entry_price,
        realized_pnl, cost_basis, updated_at
      ) VALUES (
        ${position.accountId},
        ${position.symbol},
        ${position.quantity},
        ${position.averageEntryPrice},
        ${position.realizedPnl},
        ${position.costBasis},
        NOW()
      )
      ON CONFLICT (account_id, symbol)
      DO UPDATE SET
        quantity = EXCLUDED.quantity,
        average_entry_price = EXCLUDED.average_entry_price,
        realized_pnl = EXCLUDED.realized_pnl,
        cost_basis = EXCLUDED.cost_basis,
        updated_at = NOW()
    `;

    log.debug({ accountId: position.accountId, symbol: position.symbol }, 'Position saved');
  } catch (error) {
    log.error({ error, position }, 'Failed to save position');
    throw error;
  }
}

/**
 * Get position by account and symbol.
 */
export async function getPosition(
  accountId: string,
  symbol: string
): Promise<EnginePosition | null> {
  const sql = await getDbClient();

  try {
    const result = await sql`
      SELECT account_id, symbol, quantity, average_entry_price,
             realized_pnl, cost_basis
      FROM positions
      WHERE account_id = ${accountId}
        AND symbol = ${symbol}
    `;

    if (result.length === 0) return null;

    const row = result[0]!;
    return {
      accountId: row.account_id as string,
      symbol: row.symbol as string,
      quantity: Number(row.quantity),
      averageEntryPrice: Number(row.average_entry_price),
      realizedPnl: Number(row.realized_pnl),
      costBasis: Number(row.cost_basis),
      openQuantity: Math.abs(Number(row.quantity)),
      closedQuantity: 0,
    };
  } catch (error) {
    log.error({ error, accountId, symbol }, 'Failed to get position');
    throw error;
  }
}

/**
 * Get all positions for an account.
 */
export async function getAccountPositions(accountId: string): Promise<EnginePosition[]> {
  const sql = await getDbClient();

  try {
    const result = await sql`
      SELECT account_id, symbol, quantity, average_entry_price,
             realized_pnl, cost_basis
      FROM positions
      WHERE account_id = ${accountId}
        AND quantity != 0
    `;

    return result.map((row: any) => ({
      accountId: row.account_id,
      symbol: row.symbol,
      quantity: Number(row.quantity),
      averageEntryPrice: Number(row.average_entry_price),
      realizedPnl: Number(row.realized_pnl),
      costBasis: Number(row.cost_basis),
      openQuantity: Math.abs(Number(row.quantity)),
      closedQuantity: 0,
    }));
  } catch (error) {
    log.error({ error, accountId }, 'Failed to get account positions');
    throw error;
  }
}

/**
 * Get all open positions.
 */
export async function getAllOpenPositions(): Promise<EnginePosition[]> {
  const sql = await getDbClient();

  try {
    const result = await sql`
      SELECT account_id, symbol, quantity, average_entry_price,
             realized_pnl, cost_basis
      FROM positions
      WHERE quantity != 0
    `;

    return result.map((row: any) => ({
      accountId: row.account_id,
      symbol: row.symbol,
      quantity: Number(row.quantity),
      averageEntryPrice: Number(row.average_entry_price),
      realizedPnl: Number(row.realized_pnl),
      costBasis: Number(row.cost_basis),
      openQuantity: Math.abs(Number(row.quantity)),
      closedQuantity: 0,
    }));
  } catch (error) {
    log.error({ error }, 'Failed to get all positions');
    throw error;
  }
}

/**
 * Get position history (closed positions).
 */
export async function getPositionHistory(
  accountId: string,
  options: {
    symbol?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<any[]> {
  const sql = await getDbClient();
  const { symbol, limit = 100, offset = 0 } = options;

  try {
    let result;

    if (symbol) {
      result = await sql`
        SELECT *
        FROM position_history
        WHERE account_id = ${accountId}
          AND symbol = ${symbol}
        ORDER BY closed_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      result = await sql`
        SELECT *
        FROM position_history
        WHERE account_id = ${accountId}
        ORDER BY closed_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    return result.map((row: any) => ({
      id: row.id,
      accountId: row.account_id,
      symbol: row.symbol,
      side: row.side,
      quantity: Number(row.quantity),
      entryPrice: Number(row.entry_price),
      exitPrice: Number(row.exit_price),
      realizedPnl: Number(row.realized_pnl),
      openedAt: new Date(row.opened_at),
      closedAt: new Date(row.closed_at),
    }));
  } catch (error) {
    log.error({ error, accountId }, 'Failed to get position history');
    throw error;
  }
}

/**
 * Save position to history when closed.
 */
export async function savePositionHistory(
  position: EnginePosition,
  exitPrice: number
): Promise<void> {
  const sql = await getDbClient();

  try {
    await sql`
      INSERT INTO position_history (
        account_id, symbol, side, quantity,
        entry_price, exit_price, realized_pnl, closed_at
      ) VALUES (
        ${position.accountId},
        ${position.symbol},
        ${position.quantity > 0 ? 'long' : 'short'},
        ${Math.abs(position.quantity)},
        ${position.averageEntryPrice},
        ${exitPrice},
        ${position.realizedPnl},
        NOW()
      )
    `;

    log.debug({ accountId: position.accountId, symbol: position.symbol }, 'Position history saved');
  } catch (error) {
    log.error({ error, position }, 'Failed to save position history');
    throw error;
  }
}
