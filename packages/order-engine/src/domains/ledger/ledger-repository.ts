/**
 * Ledger Repository
 * =================
 *
 * Handles ledger persistence to PostgreSQL database.
 */

import { getDbClient, withTransaction } from '../../db/connection.js';
import type { Balance, LedgerEntry, TransactionType } from './ledger.types.js';
import { logger } from '../../utils/logger.js';

const log = logger.child({ component: 'ledger-repository' });

/**
 * Get balance for account and asset.
 */
export async function getBalance(accountId: string, asset: string): Promise<Balance | null> {
  const sql = await getDbClient();

  try {
    const result = await sql`
      SELECT account_id, asset, available, held, updated_at
      FROM balances
      WHERE account_id = ${accountId}
        AND asset = ${asset}
    `;

    if (result.length === 0) return null;

    const row = result[0]!;
    return {
      accountId: row.account_id as string,
      asset: row.asset as string,
      available: Number(row.available),
      held: Number(row.held),
      total: Number(row.available) + Number(row.held),
      updatedAt: new Date(row.updated_at as string),
    };
  } catch (error) {
    log.error({ error, accountId, asset }, 'Failed to get balance');
    throw error;
  }
}

/**
 * Get all balances for an account.
 */
export async function getAccountBalances(accountId: string): Promise<Balance[]> {
  const sql = await getDbClient();

  try {
    const result = await sql`
      SELECT account_id, asset, available, held, updated_at
      FROM balances
      WHERE account_id = ${accountId}
    `;

    return result.map((row: any) => ({
      accountId: row.account_id,
      asset: row.asset,
      available: Number(row.available),
      held: Number(row.held),
      total: Number(row.available) + Number(row.held),
      updatedAt: new Date(row.updated_at),
    }));
  } catch (error) {
    log.error({ error, accountId }, 'Failed to get account balances');
    throw error;
  }
}

/**
 * Update balance (credit or debit).
 */
export async function updateBalance(
  accountId: string,
  asset: string,
  availableDelta: number,
  heldDelta: number = 0
): Promise<Balance> {
  const sql = await getDbClient();

  try {
    const result = await sql`
      INSERT INTO balances (account_id, asset, available, held, updated_at)
      VALUES (${accountId}, ${asset}, ${availableDelta}, ${heldDelta}, NOW())
      ON CONFLICT (account_id, asset)
      DO UPDATE SET
        available = balances.available + ${availableDelta},
        held = balances.held + ${heldDelta},
        updated_at = NOW()
      RETURNING account_id, asset, available, held, updated_at
    `;

    const row = result[0]!;
    return {
      accountId: row.account_id as string,
      asset: row.asset as string,
      available: Number(row.available),
      held: Number(row.held),
      total: Number(row.available) + Number(row.held),
      updatedAt: new Date(row.updated_at as string),
    };
  } catch (error) {
    log.error({ error, accountId, asset, availableDelta }, 'Failed to update balance');
    throw error;
  }
}

/**
 * Create a hold (move from available to held).
 */
export async function createHold(
  accountId: string,
  asset: string,
  amount: number,
  orderId: string
): Promise<boolean> {
  const sql = await getDbClient();

  try {
    await withTransaction(async (tx) => {
      // Check available balance
      const balanceResult = await tx`
        SELECT available
        FROM balances
        WHERE account_id = ${accountId}
          AND asset = ${asset}
        FOR UPDATE
      `;

      if (balanceResult.length === 0 || Number(balanceResult[0]?.available) < amount) {
        throw new Error('Insufficient balance');
      }

      // Move from available to held
      await tx`
        UPDATE balances
        SET available = available - ${amount},
            held = held + ${amount},
            updated_at = NOW()
        WHERE account_id = ${accountId}
          AND asset = ${asset}
      `;

      // Record hold
      await tx`
        INSERT INTO balance_holds (order_id, account_id, asset, amount, created_at)
        VALUES (${orderId}, ${accountId}, ${asset}, ${amount}, NOW())
      `;
    });

    return true;
  } catch (error) {
    log.error({ error, accountId, asset, amount, orderId }, 'Failed to create hold');
    return false;
  }
}

/**
 * Release a hold (move from held back to available).
 */
export async function releaseHold(orderId: string): Promise<boolean> {
  const sql = await getDbClient();

  try {
    await withTransaction(async (tx) => {
      // Get hold info
      const holdResult = await tx`
        SELECT account_id, asset, amount
        FROM balance_holds
        WHERE order_id = ${orderId}
      `;

      if (holdResult.length === 0) {
        throw new Error('Hold not found');
      }

      const hold = holdResult[0] as { account_id: string; asset: string; amount: number };
      const { account_id, asset, amount } = hold;

      // Move from held back to available
      await tx`
        UPDATE balances
        SET available = available + ${amount},
            held = held - ${amount},
            updated_at = NOW()
        WHERE account_id = ${account_id}
          AND asset = ${asset}
      `;

      // Remove hold record
      await tx`
        DELETE FROM balance_holds
        WHERE order_id = ${orderId}
      `;
    });

    return true;
  } catch (error) {
    log.error({ error, orderId }, 'Failed to release hold');
    return false;
  }
}

/**
 * Insert ledger entry.
 */
export async function insertLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<void> {
  const sql = await getDbClient();

  try {
    await sql`
      INSERT INTO ledger_entries (
        account_id, asset, type, amount, balance,
        reference_id, reference_type, description, created_at
      ) VALUES (
        ${entry.accountId},
        ${entry.asset},
        ${entry.type},
        ${entry.amount},
        ${entry.balance},
        ${entry.referenceId ?? null},
        ${entry.referenceType ?? null},
        ${entry.description ?? null},
        NOW()
      )
    `;
  } catch (error) {
    log.error({ error, entry }, 'Failed to insert ledger entry');
    throw error;
  }
}

/**
 * Get ledger entries for an account.
 */
export async function getLedgerEntries(
  accountId: string,
  options: {
    asset?: string;
    type?: TransactionType;
    limit?: number;
    offset?: number;
    startTime?: Date;
    endTime?: Date;
  } = {}
): Promise<LedgerEntry[]> {
  const sql = await getDbClient();
  const { asset, type, limit = 100, offset = 0, startTime, endTime } = options;

  try {
    let result;

    if (asset && type && startTime && endTime) {
      result = await sql`
        SELECT *
        FROM ledger_entries
        WHERE account_id = ${accountId}
          AND asset = ${asset}
          AND type = ${type}
          AND created_at >= ${startTime}
          AND created_at <= ${endTime}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (asset) {
      result = await sql`
        SELECT *
        FROM ledger_entries
        WHERE account_id = ${accountId}
          AND asset = ${asset}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      result = await sql`
        SELECT *
        FROM ledger_entries
        WHERE account_id = ${accountId}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    return result.map((row: any) => ({
      id: row.id,
      accountId: row.account_id,
      asset: row.asset,
      type: row.type,
      amount: Number(row.amount),
      balance: Number(row.balance),
      referenceId: row.reference_id,
      referenceType: row.reference_type,
      description: row.description,
      createdAt: new Date(row.created_at),
    }));
  } catch (error) {
    log.error({ error, accountId }, 'Failed to get ledger entries');
    throw error;
  }
}
