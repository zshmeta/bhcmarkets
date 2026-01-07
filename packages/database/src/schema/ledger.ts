/**
 * Ledger Schema
 * =============
 *
 * Double-entry bookkeeping tables for financial transactions.
 */

import {
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
  text,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// =============================================================================
// ENUMS
// =============================================================================

export const ledgerTransactionTypeEnum = pgEnum('ledger_transaction_type', [
  'deposit',
  'withdrawal',
  'trade_buy',
  'trade_sell',
  'fee',
  'fee_rebate',
  'transfer_in',
  'transfer_out',
  'adjustment',
  'hold',
  'release',
  'margin_call',
  'funding',
  'bonus',
  'referral',
]);

export const ledgerTransactionStatusEnum = pgEnum('ledger_transaction_status', [
  'pending',
  'completed',
  'failed',
  'cancelled',
  'reversed',
]);

// =============================================================================
// LEDGER BALANCES
// =============================================================================

/**
 * Ledger Balances - Real-time balance tracking
 *
 * This is the authoritative source of account balances.
 * Uses available/held model for pending order management.
 */
export const ledgerBalances = pgTable('ledger_balances', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').notNull(),
  asset: varchar('asset', { length: 20 }).notNull(),
  available: numeric('available', { precision: 30, scale: 10 }).default('0').notNull(),
  held: numeric('held', { precision: 30, scale: 10 }).default('0').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  accountAssetIdx: uniqueIndex('uq_ledger_balances_account_asset').on(table.accountId, table.asset),
  accountIdx: index('idx_ledger_balances_account').on(table.accountId),
}));

// =============================================================================
// LEDGER HOLDS
// =============================================================================

/**
 * Ledger Holds - Funds reserved for pending orders
 *
 * When a limit order is placed, funds are moved from 'available' to 'held'.
 * This table tracks which order each hold belongs to.
 */
export const ledgerHolds = pgTable('ledger_holds', {
  orderId: uuid('order_id').primaryKey(),
  accountId: uuid('account_id').notNull(),
  asset: varchar('asset', { length: 20 }).notNull(),
  amount: numeric('amount', { precision: 30, scale: 10 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  accountIdx: index('idx_ledger_holds_account').on(table.accountId),
  assetIdx: index('idx_ledger_holds_asset').on(table.asset),
}));

// =============================================================================
// LEDGER ENTRIES
// =============================================================================

/**
 * Ledger Entries - Immutable transaction history
 *
 * This is the audit trail. Entries are NEVER modified or deleted.
 * Each entry represents a single balance change with full context.
 */
export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id').notNull(),
  asset: varchar('asset', { length: 20 }).notNull(),
  type: ledgerTransactionTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 30, scale: 10 }).notNull(),
  balanceAfter: numeric('balance_after', { precision: 30, scale: 10 }),
  referenceId: varchar('reference_id', { length: 64 }),
  referenceType: varchar('reference_type', { length: 32 }),
  description: text('description'),
  status: ledgerTransactionStatusEnum('status').default('completed').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  accountIdx: index('idx_ledger_entries_account').on(table.accountId),
  accountAssetIdx: index('idx_ledger_entries_account_asset').on(table.accountId, table.asset),
  refIdx: index('idx_ledger_entries_ref').on(table.referenceId),
  typeIdx: index('idx_ledger_entries_type').on(table.type),
  createdAtIdx: index('idx_ledger_entries_created').on(table.createdAt),
}));
