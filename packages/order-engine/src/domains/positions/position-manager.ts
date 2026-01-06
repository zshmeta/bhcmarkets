/**
 * Position Manager
 * ================
 *
 * Tracks and manages positions for all accounts.
 *
 * POSITION TRACKING:
 * - Long position: Positive quantity (bought more than sold)
 * - Short position: Negative quantity (sold more than bought)
 * - Flat: Zero quantity
 *
 * PNL CALCULATION:
 * - Realized PnL: Profit/loss from closed positions
 * - Unrealized PnL: Paper profit/loss on open positions
 * - Uses FIFO (First In, First Out) for cost basis
 */

import type {
  EnginePosition,
  PositionUpdate,
  PositionSnapshot,
  PositionSide,
  PositionChangeEvent,
  AccountPositionSummary,
} from './position.types.js';
import { logger } from '../../utils/logger.js';

const log = logger.child({ component: 'position-manager' });

type PositionEventHandler = (event: PositionChangeEvent) => void;

export class PositionManager {
  // accountId:symbol -> position
  private positions: Map<string, EnginePosition> = new Map();
  private marketPrices: Map<string, number> = new Map();
  private eventHandlers: PositionEventHandler[] = [];

  constructor() {}

  // ===========================================================================
  // POSITION UPDATES
  // ===========================================================================

  /**
   * Update position from a trade.
   */
  updateFromTrade(update: PositionUpdate): PositionChangeEvent {
    const key = this.getKey(update.accountId, update.symbol);
    let position = this.positions.get(key);

    const previousQuantity = position?.quantity ?? 0;
    const previousSide = this.getSide(previousQuantity);

    if (!position) {
      position = this.createPosition(update.accountId, update.symbol);
      this.positions.set(key, position);
    }

    // Calculate position change
    const quantityDelta = update.side === 'buy' ? update.quantity : -update.quantity;
    const newQuantity = position.quantity + quantityDelta;

    // Handle PnL for closing/reducing positions
    if (this.isReducingPosition(position.quantity, quantityDelta)) {
      const closedQuantity = Math.min(Math.abs(position.quantity), Math.abs(quantityDelta));
      const realizedPnl = this.calculateRealizedPnl(
        position,
        closedQuantity,
        update.price,
        update.side
      );
      position.realizedPnl += realizedPnl;
      position.closedQuantity += closedQuantity;
    }

    // Update average entry price for increasing positions
    if (this.isIncreasingPosition(position.quantity, quantityDelta)) {
      position.averageEntryPrice = this.calculateNewAvgPrice(
        position,
        Math.abs(quantityDelta),
        update.price
      );
      position.costBasis += Math.abs(quantityDelta) * update.price;
    }

    // Update quantity
    position.quantity = newQuantity;
    position.openQuantity = Math.abs(newQuantity);

    // Determine event type
    const newSide = this.getSide(newQuantity);
    let eventType: PositionChangeEvent['type'];

    if (previousQuantity === 0 && newQuantity !== 0) {
      eventType = 'position_opened';
    } else if (previousQuantity !== 0 && newQuantity === 0) {
      eventType = 'position_closed';
    } else {
      eventType = 'position_updated';
    }

    const event: PositionChangeEvent = {
      type: eventType,
      accountId: update.accountId,
      symbol: update.symbol,
      previousQuantity,
      newQuantity,
      previousSide,
      newSide,
      tradeId: update.tradeId,
      timestamp: update.timestamp,
    };

    // Emit event
    this.emit(event);

    log.debug({
      accountId: update.accountId,
      symbol: update.symbol,
      type: eventType,
      previousQuantity,
      newQuantity,
    }, 'Position updated');

    return event;
  }

  // ===========================================================================
  // POSITION QUERIES
  // ===========================================================================

  /**
   * Get position for account and symbol.
   */
  getPosition(accountId: string, symbol: string): PositionSnapshot | null {
    const key = this.getKey(accountId, symbol);
    const position = this.positions.get(key);

    if (!position || position.quantity === 0) {
      return null;
    }

    return this.toSnapshot(position);
  }

  /**
   * Get all positions for an account.
   */
  getAccountPositions(accountId: string): PositionSnapshot[] {
    const positions: PositionSnapshot[] = [];

    for (const [key, position] of this.positions) {
      if (key.startsWith(accountId + ':') && position.quantity !== 0) {
        positions.push(this.toSnapshot(position));
      }
    }

    return positions;
  }

  /**
   * Get account position summary.
   */
  getAccountSummary(accountId: string): AccountPositionSummary {
    const positions = this.getAccountPositions(accountId);

    let totalMarketValue = 0;
    let totalCostBasis = 0;
    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;

    for (const pos of positions) {
      totalMarketValue += pos.marketValue;
      totalCostBasis += pos.costBasis;
      totalUnrealizedPnl += pos.unrealizedPnl;
      totalRealizedPnl += pos.realizedPnl;
    }

    return {
      accountId,
      positions,
      totalMarketValue,
      totalCostBasis,
      totalUnrealizedPnl,
      totalRealizedPnl,
      timestamp: Date.now(),
    };
  }

  /**
   * Get all positions for a symbol.
   */
  getSymbolPositions(symbol: string): PositionSnapshot[] {
    const positions: PositionSnapshot[] = [];

    for (const [key, position] of this.positions) {
      if (key.endsWith(':' + symbol) && position.quantity !== 0) {
        positions.push(this.toSnapshot(position));
      }
    }

    return positions;
  }

  /**
   * Check if account has position in symbol.
   */
  hasPosition(accountId: string, symbol: string): boolean {
    const key = this.getKey(accountId, symbol);
    const position = this.positions.get(key);
    return position !== undefined && position.quantity !== 0;
  }

  /**
   * Get net exposure for a symbol across all accounts.
   */
  getNetExposure(symbol: string): { long: number; short: number; net: number } {
    let long = 0;
    let short = 0;

    for (const [key, position] of this.positions) {
      if (key.endsWith(':' + symbol)) {
        if (position.quantity > 0) {
          long += position.quantity;
        } else {
          short += Math.abs(position.quantity);
        }
      }
    }

    return { long, short, net: long - short };
  }

  // ===========================================================================
  // MARKET PRICE UPDATES
  // ===========================================================================

  /**
   * Update market price for PnL calculations.
   */
  setMarketPrice(symbol: string, price: number): void {
    this.marketPrices.set(symbol, price);
  }

  /**
   * Get current market price.
   */
  getMarketPrice(symbol: string): number | null {
    return this.marketPrices.get(symbol) ?? null;
  }

  // ===========================================================================
  // EVENT HANDLING
  // ===========================================================================

  /**
   * Register event handler.
   */
  onEvent(handler: PositionEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index !== -1) this.eventHandlers.splice(index, 1);
    };
  }

  // ===========================================================================
  // PERSISTENCE
  // ===========================================================================

  /**
   * Load position from storage (for recovery).
   */
  loadPosition(position: EnginePosition): void {
    const key = this.getKey(position.accountId, position.symbol);
    this.positions.set(key, position);
  }

  /**
   * Get all positions for persistence.
   */
  getAllPositions(): EnginePosition[] {
    return Array.from(this.positions.values()).filter((p) => p.quantity !== 0);
  }

  /**
   * Clear all positions (for testing).
   */
  clear(): void {
    this.positions.clear();
    this.marketPrices.clear();
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private getKey(accountId: string, symbol: string): string {
    return `${accountId}:${symbol}`;
  }

  private createPosition(accountId: string, symbol: string): EnginePosition {
    return {
      accountId,
      symbol,
      quantity: 0,
      averageEntryPrice: 0,
      realizedPnl: 0,
      costBasis: 0,
      openQuantity: 0,
      closedQuantity: 0,
    };
  }

  private getSide(quantity: number): PositionSide {
    if (quantity > 0) return 'long';
    if (quantity < 0) return 'short';
    return 'flat';
  }

  private isReducingPosition(currentQty: number, delta: number): boolean {
    // Reducing if signs are opposite and we're moving towards zero
    if (currentQty === 0) return false;
    return (currentQty > 0 && delta < 0) || (currentQty < 0 && delta > 0);
  }

  private isIncreasingPosition(currentQty: number, delta: number): boolean {
    // Increasing if same sign or starting from zero
    if (currentQty === 0) return true;
    return (currentQty > 0 && delta > 0) || (currentQty < 0 && delta < 0);
  }

  private calculateRealizedPnl(
    position: EnginePosition,
    closedQty: number,
    exitPrice: number,
    side: 'buy' | 'sell'
  ): number {
    if (position.quantity === 0) return 0;

    const isLong = position.quantity > 0;

    if (isLong) {
      // Closing long (selling): profit = (exit - entry) * qty
      return (exitPrice - position.averageEntryPrice) * closedQty;
    } else {
      // Closing short (buying): profit = (entry - exit) * qty
      return (position.averageEntryPrice - exitPrice) * closedQty;
    }
  }

  private calculateNewAvgPrice(
    position: EnginePosition,
    addedQty: number,
    addedPrice: number
  ): number {
    const currentValue = Math.abs(position.quantity) * position.averageEntryPrice;
    const addedValue = addedQty * addedPrice;
    const totalQty = Math.abs(position.quantity) + addedQty;

    if (totalQty === 0) return 0;
    return (currentValue + addedValue) / totalQty;
  }

  private toSnapshot(position: EnginePosition): PositionSnapshot {
    const marketPrice = this.marketPrices.get(position.symbol) ?? position.averageEntryPrice;
    const quantity = Math.abs(position.quantity);
    const marketValue = quantity * marketPrice;
    const costBasis = quantity * position.averageEntryPrice;

    let unrealizedPnl: number;
    if (position.quantity > 0) {
      unrealizedPnl = marketValue - costBasis;
    } else if (position.quantity < 0) {
      unrealizedPnl = costBasis - marketValue;
    } else {
      unrealizedPnl = 0;
    }

    const unrealizedPnlPercent = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

    return {
      accountId: position.accountId,
      symbol: position.symbol,
      side: this.getSide(position.quantity),
      quantity,
      averageEntryPrice: position.averageEntryPrice,
      marketPrice,
      marketValue,
      costBasis,
      unrealizedPnl,
      unrealizedPnlPercent,
      realizedPnl: position.realizedPnl,
      timestamp: Date.now(),
    };
  }

  private emit(event: PositionChangeEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        log.error({ error, event }, 'Error in position event handler');
      }
    }
  }
}
