/**
 * Trades Domain Exports
 */

export type {
  Trade,
  TradeSide,
  TradeRole,
  TradeStatus,
  AccountTrade,
  TradeExecution,
  TradeSettlement,
  FeeCalculation,
  TradeStats,
  TradeEvent,
} from '@repo/sdk'
export { FeeCalculator, type FeeTier, type FeeOverride } from './fee-calculator.js';
export { TradeProcessor, type TradeProcessorConfig } from './trade-processor.js';

export {
  saveTrades,
  getTradeById,
  getAccountTrades,
  getRecentTrades,
  getSymbolStats,
  getAccount30DayVolume,
} from './trade-repository.js';
