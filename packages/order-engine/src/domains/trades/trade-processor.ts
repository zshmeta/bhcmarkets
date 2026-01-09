/**
 * Trade Processor
 * ===============
 *
 * Handles trade execution, settlement, and lifecycle.
 *
 * RESPONSIBILITIES:
 * - Accept trades from matching engine
 * - Calculate and apply fees
 * - Update positions
 * - Settle balances via ledger
 * - Persist trades
 * - Emit trade events
 */

import { randomUUID } from 'crypto';
import type {
  Trade,
  TradeExecution,
  TradeSettlement,
  TradeEvent,
  AccountTrade,
  TradeStats,
} from './trade.types.js';
import { FeeCalculator, type FeeTier } from './fee-calculator.js';
import type { PositionManager } from '../positions/position-manager.js';
import type { LedgerService } from '../ledger/ledger-adapter.js';
import { logger } from '../../utils/logger.js';
import { getDbClient, trades as tradesTable } from '@repo/database';

const log = logger.child({ component: 'trade-processor' });

type TradeEventHandler = (event: TradeEvent) => void;

export interface TradeProcessorConfig {
  enableSettlement?: boolean;
  batchSize?: number;
  flushIntervalMs?: number;
}

export class TradeProcessor {
  private feeCalculator: FeeCalculator;
  private positionManager: PositionManager | null = null;
  private ledgerService: LedgerService | null = null;
  private eventHandlers: TradeEventHandler[] = [];

  private pendingTrades: Trade[] = [];
  private processedTrades: Map<string, Trade> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;

  // Stats tracking
  private tradeStats: Map<string, TradeStats> = new Map();
  private config: Required<TradeProcessorConfig>;

  constructor(config: TradeProcessorConfig = {}, feeTiers?: FeeTier[]) {
    this.config = {
      enableSettlement: true,
      batchSize: 100,
      flushIntervalMs: 1000,
      ...config,
    };

    this.feeCalculator = new FeeCalculator(feeTiers);

    // Start flush interval
    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => {
        log.error({ error: err }, 'Failed to flush trades');
      });
    }, this.config.flushIntervalMs);
  }

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /**
   * Set position manager for position updates.
   */
  setPositionManager(pm: PositionManager): void {
    this.positionManager = pm;
  }

  /**
   * Set ledger service for balance settlements.
   */
  setLedgerService(ls: LedgerService): void {
    this.ledgerService = ls;
  }

  // ===========================================================================
  // TRADE PROCESSING
  // ===========================================================================

  /**
   * Process a trade execution from matching engine.
   */
  async processTrade(execution: TradeExecution): Promise<Trade> {
    const tradeId = randomUUID();
    const tradeValue = execution.price * execution.quantity;

    // Calculate fees
    const fees = this.feeCalculator.calculateFees(
      execution.makerAccountId,
      execution.takerAccountId,
      tradeValue
    );

    // Update volumes for fee tier calculation
    this.feeCalculator.updateVolume(execution.makerAccountId, tradeValue);
    this.feeCalculator.updateVolume(execution.takerAccountId, tradeValue);

    // Create trade record
    const trade: Trade = {
      id: tradeId,
      symbol: execution.symbol,
      makerOrderId: execution.makerOrderId,
      takerOrderId: execution.takerOrderId,
      makerAccountId: execution.makerAccountId,
      takerAccountId: execution.takerAccountId,
      price: execution.price,
      quantity: execution.quantity,
      makerFee: fees.makerFee,
      takerFee: fees.takerFee,
      status: 'pending',
      createdAt: new Date(execution.timestamp),
    };

    // Update positions
    if (this.positionManager) {
      // Maker side is the resting order side
      const takerSide = execution.makerSide === 'buy' ? 'sell' : 'buy';

      // Update maker position
      this.positionManager.updateFromTrade({
        accountId: execution.makerAccountId,
        symbol: execution.symbol,
        side: execution.makerSide,
        quantity: execution.quantity,
        price: execution.price,
        tradeId,
        timestamp: execution.timestamp,
      });

      // Update taker position
      this.positionManager.updateFromTrade({
        accountId: execution.takerAccountId,
        symbol: execution.symbol,
        side: takerSide,
        quantity: execution.quantity,
        price: execution.price,
        tradeId,
        timestamp: execution.timestamp,
      });
    }

    // Settle via ledger
    if (this.config.enableSettlement && this.ledgerService) {
      try {
        await this.settleTrade(trade, execution.makerSide);
        trade.status = 'settled';
        trade.settledAt = new Date();
      } catch (error) {
        log.error({ error, tradeId }, 'Trade settlement failed');
        trade.status = 'failed';
      }
    } else {
      trade.status = 'settled'; // No settlement needed
      trade.settledAt = new Date();
    }

    // Update stats
    this.updateTradeStats(trade);

    // Add to pending for batch persistence
    this.pendingTrades.push(trade);
    this.processedTrades.set(trade.id, trade);

    // Check if batch size reached
    if (this.pendingTrades.length >= this.config.batchSize) {
      await this.flush();
    }

    // Emit event
    this.emit({
      type: trade.status === 'settled' ? 'trade_settled' : 'trade_failed',
      trade,
      timestamp: Date.now(),
    });

    log.debug({
      tradeId,
      symbol: trade.symbol,
      price: trade.price,
      quantity: trade.quantity,
      status: trade.status,
    }, 'Trade processed');

    return trade;
  }

  /**
   * Settle a trade through the ledger.
   */
  private async settleTrade(trade: Trade, makerSide: 'buy' | 'sell'): Promise<void> {
    if (!this.ledgerService) return;

    const tradeValue = trade.price * trade.quantity;

    if (makerSide === 'buy') {
      // Maker bought, taker sold
      // Maker: pays quote currency, receives base
      // Taker: pays base currency, receives quote
      await this.ledgerService.recordTrade({
        tradeId: trade.id,
        buyerAccountId: trade.makerAccountId,
        sellerAccountId: trade.takerAccountId,
        symbol: trade.symbol,
        price: trade.price,
        quantity: trade.quantity,
        buyerFee: trade.makerFee,
        sellerFee: trade.takerFee,
      });
    } else {
      // Maker sold, taker bought
      await this.ledgerService.recordTrade({
        tradeId: trade.id,
        buyerAccountId: trade.takerAccountId,
        sellerAccountId: trade.makerAccountId,
        symbol: trade.symbol,
        price: trade.price,
        quantity: trade.quantity,
        buyerFee: trade.takerFee,
        sellerFee: trade.makerFee,
      });
    }
  }

  // ===========================================================================
  // TRADE QUERIES
  // ===========================================================================

  /**
   * Get trade by ID.
   */
  getTrade(tradeId: string): Trade | null {
    return this.processedTrades.get(tradeId) ?? null;
  }

  /**
   * Get account trade view.
   */
  getAccountTrade(tradeId: string, accountId: string): AccountTrade | null {
    const trade = this.processedTrades.get(tradeId);
    if (!trade) return null;

    const isMaker = trade.makerAccountId === accountId;
    const isTaker = trade.takerAccountId === accountId;

    if (!isMaker && !isTaker) return null;

    const value = trade.price * trade.quantity;
    const fee = isMaker ? trade.makerFee : trade.takerFee;

    // Determine side based on role
    let side: 'buy' | 'sell';
    if (isMaker) {
      // Need to determine maker side from context
      // For now, we'll need this passed or stored
      side = 'buy'; // Placeholder
    } else {
      side = 'sell'; // Placeholder
    }

    return {
      tradeId: trade.id,
      orderId: isMaker ? trade.makerOrderId : trade.takerOrderId,
      symbol: trade.symbol,
      side,
      role: isMaker ? 'maker' : 'taker',
      price: trade.price,
      quantity: trade.quantity,
      value,
      fee,
      netValue: side === 'buy' ? -(value + fee) : value - fee,
      timestamp: trade.createdAt.getTime(),
    };
  }

  /**
   * Get trade statistics for a symbol.
   */
  getTradeStats(symbol: string): TradeStats | null {
    return this.tradeStats.get(symbol) ?? null;
  }

  /**
   * Get all trade statistics.
   */
  getAllTradeStats(): TradeStats[] {
    return Array.from(this.tradeStats.values());
  }

  // ===========================================================================
  // FEE MANAGEMENT
  // ===========================================================================

  /**
   * Get fee calculator for direct access.
   */
  getFeeCalculator(): FeeCalculator {
    return this.feeCalculator;
  }

  // ===========================================================================
  // EVENTS
  // ===========================================================================

  /**
   * Register event handler.
   */
  onEvent(handler: TradeEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index !== -1) this.eventHandlers.splice(index, 1);
    };
  }

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Flush pending trades to storage.
   */
  async flush(): Promise<void> {
    if (this.pendingTrades.length === 0) return;

    const trades = this.pendingTrades;
    this.pendingTrades = [];

    try {
      const db = getDbClient();

      // Insert trades in batch
      for (const trade of trades) {
        await db.insert(tradesTable).values({
          id: trade.id,
          orderId: trade.takerOrderId, // Primary order reference
          price: trade.price.toString(),
          quantity: trade.quantity.toString(),
          fee: (trade.makerFee + trade.takerFee).toString(),
          createdAt: trade.createdAt,
        });
      }

      log.info({ count: trades.length }, 'Trades persisted to database');
    } catch (error) {
      log.error({ error, count: trades.length }, 'Failed to persist trades');
      // Re-add trades to pending for retry
      this.pendingTrades.unshift(...trades);
      throw error;
    }
  }

  /**
   * Shutdown the trade processor.
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    await this.flush();
    log.info('Trade processor shutdown');
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private updateTradeStats(trade: Trade): void {
    let stats = this.tradeStats.get(trade.symbol);

    if (!stats) {
      stats = {
        symbol: trade.symbol,
        trades24h: 0,
        volume24h: 0,
        high24h: trade.price,
        low24h: trade.price,
        lastPrice: trade.price,
        lastTradeTime: trade.createdAt.getTime(),
      };
      this.tradeStats.set(trade.symbol, stats);
    }

    stats.trades24h++;
    stats.volume24h += trade.price * trade.quantity;
    stats.lastPrice = trade.price;
    stats.lastTradeTime = trade.createdAt.getTime();

    if (trade.price > stats.high24h) {
      stats.high24h = trade.price;
    }
    if (trade.price < stats.low24h) {
      stats.low24h = trade.price;
    }
  }

  private emit(event: TradeEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        log.error({ error, event }, 'Error in trade event handler');
      }
    }
  }
}
