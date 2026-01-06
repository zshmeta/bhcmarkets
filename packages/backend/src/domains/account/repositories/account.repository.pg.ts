/**
 * Account Repository - PostgreSQL Implementation
 *
 * This file implements the AccountRepository interface using PostgreSQL via Drizzle ORM.
 * It handles all direct database interactions for the account domain.
 *
 * Design Notes:
 * - All methods are pure database operations (no business logic)
 * - Business rules and validation happen in the service layer
 * - We use Drizzle's type-safe query builder
 */

import { eq, and } from "drizzle-orm";
import { accounts } from "@repo/database";
import type { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  AccountEntity,
  AccountRepository,
  AccountStatus,
  CreateAccountInput,
  CurrencyCode,
  DecimalString,
  UUID,
} from "../core/account.types.js";

/**
 * Maps a database row to our AccountEntity type.
 * Ensures consistent typing between DB and application.
 */
function toEntity(row: typeof accounts.$inferSelect): AccountEntity {
  return {
    id: row.id,
    userId: row.userId,
    currency: row.currency as CurrencyCode,
    balance: row.balance,
    locked: row.locked,
    accountType: row.accountType,
    status: row.status,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Creates an AccountRepository instance backed by PostgreSQL.
 *
 * @param pool - A PostgreSQL connection pool
 * @returns An object implementing the AccountRepository interface
 *
 * @example
 * ```ts
 * const pool = new Pool({ connectionString: DATABASE_URL });
 * const accountRepo = createAccountRepository(pool);
 *
 * const account = await accountRepo.getById("some-uuid");
 * ```
 */
export function createAccountRepository(pool: Pool): AccountRepository {
  const db: NodePgDatabase = drizzle(pool);

  return {
    /**
     * Retrieves an account by its unique ID.
     * Returns null if no account exists with that ID.
     */
    async getById(id: UUID): Promise<AccountEntity | null> {
      const [row] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, id))
        .limit(1);

      return row ? toEntity(row) : null;
    },

    /**
     * Retrieves a user's account for a specific currency.
     * Returns null if the user doesn't have an account for that currency.
     *
     * @param userId - The user's ID
     * @param currency - The currency code (e.g., "USD", "BTC")
     */
    async getByUserAndCurrency(
      userId: UUID,
      currency: CurrencyCode
    ): Promise<AccountEntity | null> {
      const [row] = await db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, userId),
            eq(accounts.currency, currency)
          )
        )
        .limit(1);

      return row ? toEntity(row) : null;
    },

    /**
     * Lists all accounts belonging to a user.
     * Returns an empty array if the user has no accounts.
     */
    async listByUser(userId: UUID): Promise<AccountEntity[]> {
      const rows = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, userId));

      return rows.map(toEntity);
    },

    /**
     * Checks if an account exists for a given user/currency combination.
     * Useful before creating a new account to prevent duplicates.
     */
    async exists(userId: UUID, currency: CurrencyCode): Promise<boolean> {
      const [row] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, userId),
            eq(accounts.currency, currency)
          )
        )
        .limit(1);

      return row !== undefined;
    },

    /**
     * Creates a new account in the database.
     *
     * @param input - The account creation parameters
     * @returns The newly created account entity
     */
    async create(input: CreateAccountInput): Promise<AccountEntity> {
      const [row] = await db
        .insert(accounts)
        .values({
          userId: input.userId,
          currency: input.currency,
          balance: input.initialBalance ?? "0",
          locked: "0",
          accountType: input.accountType ?? "spot",
          status: "active",
        })
        .returning();

      if (!row) {
        throw new Error("Failed to create account - no row returned");
      }

      return toEntity(row);
    },

    /**
     * Updates only the balance field of an account.
     *
     * ⚠️ This is a low-level operation. The service layer should validate
     * that the new balance is valid before calling this.
     */
    async updateBalance(id: UUID, newBalance: DecimalString): Promise<AccountEntity> {
      const [row] = await db
        .update(accounts)
        .set({
          balance: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, id))
        .returning();

      if (!row) {
        throw new Error(`Account ${id} not found for balance update`);
      }

      return toEntity(row);
    },

    /**
     * Updates only the locked field of an account.
     *
     * ⚠️ This is a low-level operation. The service layer should validate
     * that the new locked amount is valid before calling this.
     */
    async updateLocked(id: UUID, newLocked: DecimalString): Promise<AccountEntity> {
      const [row] = await db
        .update(accounts)
        .set({
          locked: newLocked,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, id))
        .returning();

      if (!row) {
        throw new Error(`Account ${id} not found for locked update`);
      }

      return toEntity(row);
    },

    /**
     * Updates both balance and locked fields atomically.
     *
     * This is used during trade settlement where we need to:
     * 1. Reduce locked funds (order filled)
     * 2. Reduce balance (payment for purchased asset)
     *
     * Doing both in one query ensures consistency.
     */
    async updateBalanceAndLocked(
      id: UUID,
      newBalance: DecimalString,
      newLocked: DecimalString
    ): Promise<AccountEntity> {
      const [row] = await db
        .update(accounts)
        .set({
          balance: newBalance,
          locked: newLocked,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, id))
        .returning();

      if (!row) {
        throw new Error(`Account ${id} not found for balance/locked update`);
      }

      return toEntity(row);
    },

    /**
     * Changes the status of an account.
     *
     * @param id - The account ID
     * @param status - The new status: "active", "locked", or "closed"
     */
    async setStatus(id: UUID, status: AccountStatus): Promise<AccountEntity> {
      const [row] = await db
        .update(accounts)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, id))
        .returning();

      if (!row) {
        throw new Error(`Account ${id} not found for status update`);
      }

      return toEntity(row);
    },
  };
}
