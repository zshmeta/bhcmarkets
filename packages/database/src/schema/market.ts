/**
 * Market Data Schema
 * ==================
 *
 * Tables for market prices, candles, and time-series data.
 */

import {
  pgTable,
  serial,
  varchar,
  decimal,
  timestamp,
  jsonb,
  integer,
  index,
  unique,
  bigserial,
  numeric,
} from 'drizzle-orm/pg-core';

// =============================================================================
// MARKET PRICES
// =============================================================================

/**
 * Market prices table - stores ticks and candles.
 *
 * This table uses a flexible schema with a JSON metadata column
 * to store different types of market data (ticks, candles).
 */
export const marketPrices = pgTable('market_prices', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  symbol: varchar('symbol', { length: 32 }).notNull(),
  price: numeric('price', { precision: 30, scale: 10 }).notNull(),
  currency: varchar('currency', { length: 10 }),
  source: varchar('source', { length: 32 }),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb('metadata'),
}, (table) => ({
  symbolIdx: index('idx_market_prices_symbol').on(table.symbol),
  timestampIdx: index('idx_market_prices_timestamp').on(table.timestamp),
  symbolTimeIdx: index('idx_market_prices_symbol_time').on(table.symbol, table.timestamp),
}));

// =============================================================================
// CANDLES (OHLCV)
// =============================================================================

/**
 * Dedicated candles table for OHLCV data.
 *
 * This table is optimized for candle queries with proper columns
 * instead of JSON metadata.
 */
export const candles = pgTable('candles', {
  id: serial('id').primaryKey(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  timeframe: varchar('timeframe', { length: 5 }).notNull(),
  open: decimal('open', { precision: 20, scale: 8 }).notNull(),
  high: decimal('high', { precision: 20, scale: 8 }).notNull(),
  low: decimal('low', { precision: 20, scale: 8 }).notNull(),
  close: decimal('close', { precision: 20, scale: 8 }).notNull(),
  volume: decimal('volume', { precision: 20, scale: 8 }).default('0'),
  tickCount: integer('tick_count').default(0),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
}, (table) => ({
  symbolTimeframeIdx: index('idx_candles_symbol_tf').on(table.symbol, table.timeframe),
  timestampIdx: index('idx_candles_timestamp').on(table.timestamp),
  uniqueCandle: unique('uniq_candle').on(table.symbol, table.timeframe, table.timestamp),
}));

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type MarketPrice = typeof marketPrices.$inferSelect;
export type NewMarketPrice = typeof marketPrices.$inferInsert;
export type Candle = typeof candles.$inferSelect;
export type NewCandle = typeof candles.$inferInsert;
