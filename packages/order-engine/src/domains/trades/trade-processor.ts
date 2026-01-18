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
} from '@repo/sdk';
import { FeeCalculator, type FeeTier } from './fee-calculator.js';
import type { PositionManager } from '../positions/position-manager.js';
import type { LedgerService } from '@repo/ledger';
// Import from the package public surface so we don't depend on internal file paths.
import { getFeeRate } from './fee-schedule.js';
import type { EngineOrder, EngineTrade, OrderSide } from '@repo/sdk';
import { logger } from '@repo/sdk';
import { saveTrades } from './trade-repository.js';

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
        // Use the standard `err` key so our logger can reliably serialize stack traces.
        log.error({ err }, 'Failed to flush trades');
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
        log.error({ err: error, tradeId }, 'Trade settlement failed');
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
      // Ledger expects string amounts so it can do consistent decimal math.
      await this.ledgerService.settleTrade({
        tradeId: trade.id,
        buyerAccountId: trade.makerAccountId,
        sellerAccountId: trade.takerAccountId,
        symbol: trade.symbol,
        price: trade.price.toString(),
        quantity: trade.quantity.toString(),
        buyerFee: trade.makerFee.toString(),
        sellerFee: trade.takerFee.toString(),
      });
    } else {
      // Maker sold, taker bought
      await this.ledgerService.settleTrade({
        tradeId: trade.id,
        buyerAccountId: trade.takerAccountId,
        sellerAccountId: trade.makerAccountId,
        symbol: trade.symbol,
        price: trade.price.toString(),
        quantity: trade.quantity.toString(),
        buyerFee: trade.takerFee.toString(),
        sellerFee: trade.makerFee.toString(),
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
      // Persisting through the repository keeps DB usage consistent across the domain.
      await saveTrades(trades);
      log.info({ count: trades.length }, 'Trades persisted');
    } catch (error) {
      log.error({ err: error, count: trades.length }, 'Failed to persist trades');
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
        log.error({ err: error, event }, 'Error in trade event handler');
      }
    }
  }
}
