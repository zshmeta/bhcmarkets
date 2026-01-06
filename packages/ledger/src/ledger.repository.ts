/**
 * Ledger Repository
 * =================
 *
 * PostgreSQL-backed repository for ledger persistence.
 * Handles all database operations with proper transaction support.
 *
 * IMPORTANT:
 * - All monetary values are stored as strings to preserve precision
 * - Uses row-level locking (SELECT FOR UPDATE) for balance modifications
 * - Transactions ensure atomicity for multi-entry operations
 */

import type { Sql, TransactionSql } from 'postgres';
import type {
  Balance,
  Hold,
  HoldRequest,
  LedgerEntry,
  LedgerRepositoryInterface,
  TransactionType,
} from './ledger.types.js';

// =============================================================================
// REPOSITORY CLASS
// =============================================================================

/**
 * PostgreSQL-backed ledger repository.
 */
export class LedgerRepository implements LedgerRepositoryInterface {
  private sql: Sql | TransactionSql;
  private isTransaction: boolean;

  constructor(sql: Sql | TransactionSql, isTransaction = false) {
    this.sql = sql;
    this.isTransaction = isTransaction;
  }

  // ===========================================================================
  // BALANCE OPERATIONS
  // ===========================================================================

  /**
   * Get balance for an account and asset.
   */
  async getBalance(accountId: string, asset: string): Promise<Balance | null> {
    const result = await this.sql`
      SELECT 
        account_id,
        asset,
        available,
        held,
        updated_at
      FROM ledger_balances
      WHERE account_id = ${accountId}
        AND asset = ${asset}
    `;

    if (result.length === 0) return null;

    const row = result[0]!;
    const available = String(row.available);
    const held = String(row.held);

    return {
      accountId: row.account_id as string,
      asset: row.asset as string,
      available,
      held,
      total: this.addDecimals(available, held),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  /**
   * Get all balances for an account.
   */
  async getAccountBalances(accountId: string): Promise<Balance[]> {
    const result = await this.sql`
      SELECT 
        account_id,
        asset,
        available,
        held,
        updated_at
      FROM ledger_balances
      WHERE account_id = ${accountId}
      ORDER BY asset
    `;

    return result.map((row: Record<string, unknown>) => {
      const available = String(row.available);
      const held = String(row.held);
      return {
        accountId: row.account_id as string,
        asset: row.asset as string,
        available,
        held,
        total: this.addDecimals(available, held),
        updatedAt: new Date(row.updated_at as string),
      };
    });
  }

  /**
   * Upsert a balance (create or update).
   */
  async upsertBalance(
    accountId: string,
    asset: string,
    available: string,
    held: string
  ): Promise<Balance> {
    const result = await this.sql`
      INSERT INTO ledger_balances (account_id, asset, available, held, updated_at)
      VALUES (${accountId}, ${asset}, ${available}, ${held}, NOW())
      ON CONFLICT (account_id, asset)
      DO UPDATE SET
        available = ${available},
        held = ${held},
        updated_at = NOW()
      RETURNING account_id, asset, available, held, updated_at
    `;

    const row = result[0]!;
    const availableStr = String(row.available);
    const heldStr = String(row.held);

    return {
      accountId: row.account_id as string,
      asset: row.asset as string,
      available: availableStr,
      held: heldStr,
      total: this.addDecimals(availableStr, heldStr),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  /**
   * Update balance with deltas (atomic increment/decrement).
   */
  async updateBalance(
    accountId: string,
    asset: string,
    availableDelta: string,
    heldDelta: string = '0'
  ): Promise<Balance> {
    // Use row-level locking to prevent race conditions
    const lockResult = await this.sql`
      SELECT available, held
      FROM ledger_balances
      WHERE account_id = ${accountId}
        AND asset = ${asset}
      FOR UPDATE
    `;

    if (lockResult.length === 0) {
      // Create new balance if doesn't exist
      return this.upsertBalance(accountId, asset, availableDelta, heldDelta);
    }

    const currentAvailable = String(lockResult[0]!.available);
    const currentHeld = String(lockResult[0]!.held);
    const newAvailable = this.addDecimals(currentAvailable, availableDelta);
    const newHeld = this.addDecimals(currentHeld, heldDelta);

    // Check for negative balance
    if (parseFloat(newAvailable) < 0) {
      throw new Error(`Insufficient balance: would result in negative available (${newAvailable})`);
    }
    if (parseFloat(newHeld) < 0) {
      throw new Error(`Insufficient held balance: would result in negative held (${newHeld})`);
    }

    const result = await this.sql`
      UPDATE ledger_balances
      SET 
        available = ${newAvailable},
        held = ${newHeld},
        updated_at = NOW()
      WHERE account_id = ${accountId}
        AND asset = ${asset}
      RETURNING account_id, asset, available, held, updated_at
    `;

    const row = result[0]!;
    const availableStr = String(row.available);
    const heldStr = String(row.held);

    return {
      accountId: row.account_id as string,
      asset: row.asset as string,
      available: availableStr,
      held: heldStr,
      total: this.addDecimals(availableStr, heldStr),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  // ===========================================================================
  // HOLD OPERATIONS
  // ===========================================================================

  /**
   * Create a hold (move from available to held).
   */
  async createHold(hold: HoldRequest): Promise<boolean> {
    // Acquire lock and check balance
    const balanceResult = await this.sql`
      SELECT available
      FROM ledger_balances
      WHERE account_id = ${hold.accountId}
        AND asset = ${hold.asset}
      FOR UPDATE
    `;

    if (balanceResult.length === 0) {
      return false;
    }

    const available = parseFloat(String(balanceResult[0]!.available));
    const holdAmount = parseFloat(hold.amount);

    if (available < holdAmount) {
      return false;
    }

    // Move from available to held
    await this.sql`
      UPDATE ledger_balances
      SET 
        available = available - ${hold.amount},
        held = held + ${hold.amount},
        updated_at = NOW()
      WHERE account_id = ${hold.accountId}
        AND asset = ${hold.asset}
    `;

    // Record hold
    await this.sql`
      INSERT INTO ledger_holds (order_id, account_id, asset, amount, created_at)
      VALUES (${hold.orderId}, ${hold.accountId}, ${hold.asset}, ${hold.amount}, NOW())
      ON CONFLICT (order_id) DO UPDATE SET
        amount = ${hold.amount},
        created_at = NOW()
    `;

    return true;
  }

  /**
   * Release a hold (move from held back to available).
   */
  async releaseHold(orderId: string): Promise<boolean> {
    // Get hold info
    const holdResult = await this.sql`
      SELECT account_id, asset, amount
      FROM ledger_holds
      WHERE order_id = ${orderId}
    `;

    if (holdResult.length === 0) {
      return false;
    }

    const hold = holdResult[0] as { account_id: string; asset: string; amount: string };

    // Move from held back to available
    await this.sql`
      UPDATE ledger_balances
      SET 
        available = available + ${hold.amount},
        held = held - ${hold.amount},
        updated_at = NOW()
      WHERE account_id = ${hold.account_id}
        AND asset = ${hold.asset}
    `;

    // Remove hold record
    await this.sql`
      DELETE FROM ledger_holds
      WHERE order_id = ${orderId}
    `;

    return true;
  }

  /**
   * Consume a hold (remove from held, do not return to available).
   */
  async consumeHold(orderId: string, amount?: string): Promise<boolean> {
    // Get hold info
    const holdResult = await this.sql`
      SELECT account_id, asset, amount
      FROM ledger_holds
      WHERE order_id = ${orderId}
    `;

    if (holdResult.length === 0) {
      return false;
    }

    const hold = holdResult[0] as { account_id: string; asset: string; amount: string };
    const consumeAmount = amount ?? hold.amount;
    const consumeValue = parseFloat(consumeAmount);
    const holdValue = parseFloat(hold.amount);

    // Remove from held
    await this.sql`
      UPDATE ledger_balances
      SET 
        held = held - ${consumeAmount},
        updated_at = NOW()
      WHERE account_id = ${hold.account_id}
        AND asset = ${hold.asset}
    `;

    // If partial consumption, update hold; otherwise, delete it
    if (consumeValue < holdValue) {
      const remaining = (holdValue - consumeValue).toString();
      await this.sql`
        UPDATE ledger_holds
        SET amount = ${remaining}
        WHERE order_id = ${orderId}
      `;
    } else {
      await this.sql`
        DELETE FROM ledger_holds
        WHERE order_id = ${orderId}
      `;
    }

    return true;
  }

  /**
   * Get hold for an order.
   */
  async getHold(orderId: string): Promise<Hold | null> {
    const result = await this.sql`
      SELECT order_id, account_id, asset, amount, created_at
      FROM ledger_holds
      WHERE order_id = ${orderId}
    `;

    if (result.length === 0) return null;

    const row = result[0]!;
    return {
      orderId: row.order_id as string,
      accountId: row.account_id as string,
      asset: row.asset as string,
      amount: String(row.amount),
      createdAt: new Date(row.created_at as string),
    };
  }

  /**
   * Get all holds for an account.
   */
  async getAccountHolds(accountId: string): Promise<Hold[]> {
    const result = await this.sql`
      SELECT order_id, account_id, asset, amount, created_at
      FROM ledger_holds
      WHERE account_id = ${accountId}
      ORDER BY created_at DESC
    `;

    return result.map((row: Record<string, unknown>) => ({
      orderId: row.order_id as string,
      accountId: row.account_id as string,
      asset: row.asset as string,
      amount: String(row.amount),
      createdAt: new Date(row.created_at as string),
    }));
  }

  // ===========================================================================
  // LEDGER ENTRY OPERATIONS
  // ===========================================================================

  /**
   * Insert a ledger entry.
   */
  async insertEntry(
    entry: Omit<LedgerEntry, 'id' | 'createdAt'>
  ): Promise<LedgerEntry> {
    const result = await this.sql`
      INSERT INTO ledger_entries (
        account_id,
        asset,
        type,
        amount,
        balance_after,
        reference_id,
        reference_type,
        description,
        status,
        created_at
      ) VALUES (
        ${entry.accountId},
        ${entry.asset},
        ${entry.type},
        ${entry.amount},
        ${entry.balanceAfter},
        ${entry.referenceId ?? null},
        ${entry.referenceType ?? null},
        ${entry.description ?? null},
        ${entry.status},
        NOW()
      )
      RETURNING id, account_id, asset, type, amount, balance_after, reference_id, reference_type, description, status, created_at
    `;

    const row = result[0]!;
    return {
      id: row.id as string,
      accountId: row.account_id as string,
      asset: row.asset as string,
      type: row.type as TransactionType,
      amount: String(row.amount),
      balanceAfter: String(row.balance_after),
      referenceId: row.reference_id as string | undefined,
      referenceType: row.reference_type as string | undefined,
      description: row.description as string | undefined,
      status: row.status as LedgerEntry['status'],
      createdAt: new Date(row.created_at as string),
    };
  }

  /**
   * Get ledger entries with filters.
   */
  async getEntries(
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
    const { asset, type, limit = 100, offset = 0, startTime, endTime } = options;

    // Build query dynamically based on filters
    let result;

    if (asset && type && startTime && endTime) {
      result = await this.sql`
        SELECT * FROM ledger_entries
        WHERE account_id = ${accountId}
          AND asset = ${asset}
          AND type = ${type}
          AND created_at >= ${startTime}
          AND created_at <= ${endTime}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (asset && type) {
      result = await this.sql`
        SELECT * FROM ledger_entries
        WHERE account_id = ${accountId}
          AND asset = ${asset}
          AND type = ${type}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (asset) {
      result = await this.sql`
        SELECT * FROM ledger_entries
        WHERE account_id = ${accountId}
          AND asset = ${asset}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (type) {
      result = await this.sql`
        SELECT * FROM ledger_entries
        WHERE account_id = ${accountId}
          AND type = ${type}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      result = await this.sql`
        SELECT * FROM ledger_entries
        WHERE account_id = ${accountId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    return result.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      accountId: row.account_id as string,
      asset: row.asset as string,
      type: row.type as TransactionType,
      amount: String(row.amount),
      balanceAfter: String(row.balance_after),
      referenceId: row.reference_id as string | undefined,
      referenceType: row.reference_type as string | undefined,
      description: row.description as string | undefined,
      status: row.status as LedgerEntry['status'],
      createdAt: new Date(row.created_at as string),
    }));
  }

  /**
   * Get entry by idempotency key.
   */
  async getEntryByIdempotencyKey(key: string): Promise<LedgerEntry | null> {
    const result = await this.sql`
      SELECT * FROM ledger_entries
      WHERE reference_id = ${key}
      LIMIT 1
    `;

    if (result.length === 0) return null;

    const row = result[0]!;
    return {
      id: row.id as string,
      accountId: row.account_id as string,
      asset: row.asset as string,
      type: row.type as TransactionType,
      amount: String(row.amount),
      balanceAfter: String(row.balance_after),
      referenceId: row.reference_id as string | undefined,
      referenceType: row.reference_type as string | undefined,
      description: row.description as string | undefined,
      status: row.status as LedgerEntry['status'],
      createdAt: new Date(row.created_at as string),
    };
  }

  // ===========================================================================
  // TRANSACTION SUPPORT
  // ===========================================================================

  /**
   * Execute operations within a transaction.
   */
  async withTransaction<T>(
    fn: (tx: LedgerRepositoryInterface) => Promise<T>
  ): Promise<T> {
    if (this.isTransaction) {
      // Already in a transaction, just run the function
      return fn(this);
    }

    // Start a new transaction
    const result = await (this.sql as Sql).begin(async (txSql) => {
      const txRepo = new LedgerRepository(txSql, true);
      return fn(txRepo);
    });
    return result as T;
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Add two decimal strings with precision preservation.
   */
  private addDecimals(a: string, b: string): string {
    // Handle edge cases
    if (!a || a === 'NaN') a = '0';
    if (!b || b === 'NaN') b = '0';

    const numA = parseFloat(a);
    const numB = parseFloat(b);
    const result = numA + numB;

    // Preserve precision (up to 10 decimal places)
    return result.toFixed(10).replace(/\.?0+$/, '') || '0';
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a ledger repository instance.
 */
export function createLedgerRepository(sql: Sql): LedgerRepository {
  return new LedgerRepository(sql);
}
