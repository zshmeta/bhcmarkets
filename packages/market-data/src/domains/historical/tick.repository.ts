/**
 * Tick Repository
 * ===============
 *
 * Database repository for persisting candles.
 *
 * STORAGE STRATEGY:
 * We store 1-minute candles in the database. Higher timeframes are
 * aggregated on-the-fly from the 1-minute data. This approach:
 * - Reduces storage requirements
 * - Maintains maximum flexibility
 * - Allows retroactive timeframe changes
 *
 * TABLE: market_prices (reusing existing schema)
 * - Already has symbol, price, timestamp, metadata columns
 * - We use metadata to store full OHLCV data
 */

import postgres from 'postgres';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import type { Candle, CandleQuery } from './historical.types.js';
import type { Timeframe } from '../normalizer/data.validators.js';

const log = logger.child({ component: 'tick-repository' });

/**
 * Candle row in database.
 * We store candles as JSON in the metadata column for flexibility.
 */
interface CandleRow {
  id: number;
  symbol: string;
  price: string;
  currency: string | null;
  source: string | null;
  timestamp: Date;
  metadata: {
    type: 'candle';
    timeframe: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    tickCount: number;
  };
}

/**
 * Tick/Candle repository for database operations.
 */
export class TickRepository {
  private client: postgres.Sql | null = null;

  /**
   * Initialize database connection.
   */
  async initialize(): Promise<void> {
    try {
      this.client = postgres(env.DATABASE_URL, {
        max: 10, // Connection pool size
        idle_timeout: 30,
      });

      // Test connection
      await this.client`SELECT 1`;

      log.info('Database connection established');
    } catch (error) {
      log.error({ error }, 'Failed to connect to database');
      throw error;
    }
  }

  /**
   * Save a completed candle to the database.
   */
  async saveCandle(candle: Candle): Promise<void> {
    if (!this.client) {
      log.warn('Database not initialized, skipping candle save');
      return;
    }

    try {
      await this.client`
        INSERT INTO market_prices (symbol, price, currency, source, timestamp, metadata)
        VALUES (
          ${candle.symbol},
          ${candle.close},
          'USD',
          'aggregator',
          ${new Date(candle.timestamp)},
          ${JSON.stringify({
            type: 'candle',
            timeframe: candle.timeframe,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
            tickCount: candle.tickCount,
          })}
        )
      `;

      log.debug({
        symbol: candle.symbol,
        timestamp: new Date(candle.timestamp).toISOString(),
      }, 'Candle saved');
    } catch (error) {
      log.error({ error, candle }, 'Failed to save candle');
    }
  }

  /**
   * Save multiple candles in a batch.
   */
  async saveCandleBatch(candles: Candle[]): Promise<void> {
    if (!this.client || candles.length === 0) return;

    try {
      const values = candles.map(candle => ({
        symbol: candle.symbol,
        price: candle.close,
        currency: 'USD',
        source: 'aggregator',
        timestamp: new Date(candle.timestamp),
        metadata: JSON.stringify({
          type: 'candle',
          timeframe: candle.timeframe,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          tickCount: candle.tickCount,
        }),
      }));

      // Use a transaction for batch insert
      await this.client.begin(async (sql: postgres.TransactionSql) => {
        for (const v of values) {
          await sql`
            INSERT INTO market_prices (symbol, price, currency, source, timestamp, metadata)
            VALUES (${v.symbol}, ${v.price}, ${v.currency}, ${v.source}, ${v.timestamp}, ${v.metadata})
          `;
        }
      });

      log.info({ count: candles.length }, 'Candle batch saved');
    } catch (error) {
      log.error({ error, count: candles.length }, 'Failed to save candle batch');
    }
  }

  /**
   * Query candles from database.
   *
   * @param query - Query parameters
   * @returns Array of candles matching the query
   */
  async queryCandles(query: CandleQuery): Promise<Candle[]> {
    if (!this.client) {
      log.warn('Database not initialized');
      return [];
    }

    try {
      const limit = query.limit || 500;

      const rows = await this.client`
        SELECT id, symbol, price, currency, source, timestamp, metadata
        FROM market_prices
        WHERE symbol = ${query.symbol}
          AND timestamp >= ${new Date(query.from)}
          AND timestamp < ${new Date(query.to)}
          AND metadata->>'type' = 'candle'
          AND metadata->>'timeframe' = ${query.timeframe}
        ORDER BY timestamp ASC
        LIMIT ${limit}
      `;

      return rows.map((row) => {
        const r = row as unknown as CandleRow;
        return {
          symbol: r.symbol,
          timeframe: r.metadata.timeframe as Timeframe,
          open: r.metadata.open,
          high: r.metadata.high,
          low: r.metadata.low,
          close: r.metadata.close,
          volume: r.metadata.volume,
          timestamp: new Date(r.timestamp).getTime(),
          tickCount: r.metadata.tickCount,
          isComplete: true as const,
        };
      });
    } catch (error) {
      log.error({ error, query }, 'Failed to query candles');
      return [];
    }
  }

  /**
   * Get the most recent candles for a symbol.
   *
   * @param symbol - Symbol to query
   * @param timeframe - Candle timeframe
   * @param count - Number of candles to return
   */
  async getRecentCandles(symbol: string, timeframe: string, count: number): Promise<Candle[]> {
    if (!this.client) return [];

    try {
      const rows = await this.client`
        SELECT id, symbol, price, currency, source, timestamp, metadata
        FROM market_prices
        WHERE symbol = ${symbol}
          AND metadata->>'type' = 'candle'
          AND metadata->>'timeframe' = ${timeframe}
        ORDER BY timestamp DESC
        LIMIT ${count}
      `;

      // Reverse to get chronological order
      return rows.reverse().map((row) => {
        const r = row as unknown as CandleRow;
        return {
          symbol: r.symbol,
          timeframe: r.metadata.timeframe as Timeframe,
          open: r.metadata.open,
          high: r.metadata.high,
          low: r.metadata.low,
          close: r.metadata.close,
          volume: r.metadata.volume,
          timestamp: new Date(r.timestamp).getTime(),
          tickCount: r.metadata.tickCount,
          isComplete: true as const,
        };
      });
    } catch (error) {
      log.error({ error }, 'Failed to get recent candles');
      return [];
    }
  }

  /**
   * Close database connection.
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
      log.info('Database connection closed');
    }
  }
}
