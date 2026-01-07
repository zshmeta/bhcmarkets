/**
 * Risk Management Schema
 * ======================
 *
 * Tables for risk limits, circuit breakers, and compliance tracking.
 */

import {
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
  text,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  date,
} from 'drizzle-orm/pg-core';
import { users } from './core.js';

// =============================================================================
// ENUMS
// =============================================================================

export const circuitBreakerTriggerEnum = pgEnum('circuit_breaker_trigger', [
  'manual',
  'house_exposure',
  'price_volatility',
  'system_error',
  'external_event',
]);

// =============================================================================
// SYMBOL RISK LIMITS
// =============================================================================

/**
 * Symbol Risk Limits - Controls per-symbol trading limits
 *
 * These limits protect both users and the house from excessive risk on any single symbol.
 */
export const symbolRiskLimits = pgTable('symbol_risk_limits', {
  symbol: varchar('symbol', { length: 32 }).primaryKey(),
  tradingEnabled: boolean('trading_enabled').default(true).notNull(),
  minOrderSize: numeric('min_order_size', { precision: 28, scale: 8 }).default('0.0001').notNull(),
  maxOrderSize: numeric('max_order_size', { precision: 28, scale: 8 }).default('1000').notNull(),
  lotSize: numeric('lot_size', { precision: 28, scale: 8 }).default('0.0001').notNull(),
  maxPriceDeviation: numeric('max_price_deviation', { precision: 8, scale: 4 }).default('0.05').notNull(),
  maxUserPosition: numeric('max_user_position', { precision: 28, scale: 8 }).default('100').notNull(),
  maxHouseExposure: numeric('max_house_exposure', { precision: 28, scale: 8 }).default('10000').notNull(),
  maxHouseNotionalExposure: numeric('max_house_notional_exposure', { precision: 28, scale: 2 }).default('1000000').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// USER RISK LIMITS
// =============================================================================

/**
 * User Risk Limits - Per-user trading restrictions
 */
export const userRiskLimits = pgTable('user_risk_limits', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  tradingRestricted: boolean('trading_restricted').default(false).notNull(),
  restrictionReason: text('restriction_reason'),
  maxOrdersPerMinute: integer('max_orders_per_minute').default(30).notNull(),
  dailyLossLimit: numeric('daily_loss_limit', { precision: 28, scale: 2 }).default('10000').notNull(),
  maxSymbolPositionValue: numeric('max_symbol_position_value', { precision: 28, scale: 2 }).default('100000').notNull(),
  maxTotalPositionValue: numeric('max_total_position_value', { precision: 28, scale: 2 }).default('500000').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================================
// CIRCUIT BREAKER EVENTS
// =============================================================================

/**
 * Circuit Breaker Events - Audit trail for trading halts
 */
export const circuitBreakerEvents = pgTable('circuit_breaker_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  symbol: varchar('symbol', { length: 32 }),
  trigger: circuitBreakerTriggerEnum('trigger').notNull(),
  reason: text('reason').notNull(),
  activatedAt: timestamp('activated_at', { withTimezone: true }).notNull(),
  activatedBy: uuid('activated_by').references(() => users.id),
  deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
  deactivatedBy: uuid('deactivated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  symbolIdx: index('idx_circuit_breaker_symbol').on(table.symbol),
  activeIdx: index('idx_circuit_breaker_active').on(table.symbol, table.deactivatedAt),
}));

// =============================================================================
// ORDER ATTEMPTS (Rate Limiting)
// =============================================================================

/**
 * Order Attempts - Rate limiting tracking
 */
export const orderAttempts = pgTable('order_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  symbol: varchar('symbol', { length: 32 }),
  wasApproved: boolean('was_approved').default(true).notNull(),
  rejectionCode: varchar('rejection_code', { length: 32 }),
  attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull(),
}, (table) => ({
  userTimeIdx: index('idx_order_attempts_user_time').on(table.userId, table.attemptedAt),
}));

// =============================================================================
// DAILY USER PNL
// =============================================================================

/**
 * Daily User PnL - Aggregated daily P&L for loss limit tracking
 */
export const dailyUserPnl = pgTable('daily_user_pnl', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  realizedPnl: numeric('realized_pnl', { precision: 28, scale: 2 }).default('0').notNull(),
  tradingFees: numeric('trading_fees', { precision: 28, scale: 2 }).default('0').notNull(),
  tradeCount: integer('trade_count').default(0).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userDateIdx: uniqueIndex('uq_daily_user_pnl_user_date').on(table.userId, table.date),
}));
