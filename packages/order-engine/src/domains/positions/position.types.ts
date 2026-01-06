/**
 * Position Types
 * ==============
 *
 * Types for position tracking and management.
 */

export type PositionSide = 'long' | 'short' | 'flat';

/**
 * A position represents the net holding of an asset.
 */
export interface Position {
  id: string;
  accountId: string;
  symbol: string;
  side: PositionSide;
  quantity: number;
  averageEntryPrice: number;
  realizedPnl: number;
  unrealizedPnl: number;
  openedAt: Date;
  updatedAt: Date;
}

/**
 * Internal position for engine calculations.
 */
export interface EnginePosition {
  accountId: string;
  symbol: string;
  quantity: number; // Positive = long, negative = short
  averageEntryPrice: number;
  realizedPnl: number;
  costBasis: number;
  openQuantity: number;
  closedQuantity: number;
}

/**
 * Position update from a trade.
 */
export interface PositionUpdate {
  accountId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  tradeId: string;
  timestamp: number;
}

/**
 * Position snapshot for reporting.
 */
export interface PositionSnapshot {
  accountId: string;
  symbol: string;
  side: PositionSide;
  quantity: number;
  averageEntryPrice: number;
  marketPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  realizedPnl: number;
  timestamp: number;
}

/**
 * Position summary for an account.
 */
export interface AccountPositionSummary {
  accountId: string;
  positions: PositionSnapshot[];
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  timestamp: number;
}

/**
 * Position change event.
 */
export interface PositionChangeEvent {
  type: 'position_opened' | 'position_updated' | 'position_closed';
  accountId: string;
  symbol: string;
  previousQuantity: number;
  newQuantity: number;
  previousSide: PositionSide;
  newSide: PositionSide;
  tradeId: string;
  timestamp: number;
}
