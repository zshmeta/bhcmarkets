/**
 * Trade Types
 * ===========
 *
 * Types for trade execution, settlement, and reporting.
 */

export type TradeSide = 'buy' | 'sell';
export type TradeRole = 'maker' | 'taker';
export type TradeStatus = 'pending' | 'settled' | 'failed';

/**
 * Full trade record from matching.
 */
export interface Trade {
  id: string;
  symbol: string;
  makerOrderId: string;
  takerOrderId: string;
  makerAccountId: string;
  takerAccountId: string;
  price: number;
  quantity: number;
  makerFee: number;
  takerFee: number;
  status: TradeStatus;
  createdAt: Date;
  settledAt?: Date;
}

/**
 * Trade from the perspective of one account.
 */
export interface AccountTrade {
  tradeId: string;
  orderId: string;
  symbol: string;
  side: TradeSide;
  role: TradeRole;
  price: number;
  quantity: number;
  value: number;
  fee: number;
  netValue: number;
  timestamp: number;
}

/**
 * Trade execution input (from matching engine).
 */
export interface TradeExecution {
  makerOrderId: string;
  takerOrderId: string;
  makerAccountId: string;
  takerAccountId: string;
  symbol: string;
  price: number;
  quantity: number;
  makerSide: TradeSide;
  timestamp: number;
}

/**
 * Trade settlement result.
 */
export interface TradeSettlement {
  tradeId: string;
  success: boolean;
  makerBalanceChange: number;
  takerBalanceChange: number;
  makerFee: number;
  takerFee: number;
  error?: string;
}

/**
 * Fee calculation result.
 */
export interface FeeCalculation {
  makerFee: number;
  takerFee: number;
  makerFeeRate: number;
  takerFeeRate: number;
}

/**
 * Trade statistics for a symbol.
 */
export interface TradeStats {
  symbol: string;
  trades24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastPrice: number;
  lastTradeTime: number;
}

/**
 * Trade event for streaming.
 */
export interface TradeEvent {
  type: 'trade_executed' | 'trade_settled' | 'trade_failed';
  trade: Trade;
  timestamp: number;
}
