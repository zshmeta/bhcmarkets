/**
 * Ledger Types
 * ============
 *
 * Types for balance tracking, transactions, and settlements.
 */

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'trade_buy'
  | 'trade_sell'
  | 'fee'
  | 'transfer_in'
  | 'transfer_out'
  | 'adjustment'
  | 'hold'
  | 'release';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

/**
 * Account balance for a specific asset.
 */
export interface Balance {
  accountId: string;
  asset: string;
  available: number;
  held: number;
  total: number;
  updatedAt: Date;
}

/**
 * Ledger entry (immutable transaction record).
 */
export interface LedgerEntry {
  id: string;
  accountId: string;
  asset: string;
  type: TransactionType;
  amount: number;
  balance: number; // Balance after this entry
  referenceId?: string; // Order ID, trade ID, etc.
  referenceType?: string; // 'order', 'trade', 'deposit', etc.
  description?: string;
  createdAt: Date;
}

/**
 * Balance change request.
 */
export interface BalanceChange {
  accountId: string;
  asset: string;
  amount: number; // Positive for credit, negative for debit
  type: TransactionType;
  referenceId?: string;
  referenceType?: string;
  description?: string;
}

/**
 * Hold request (reserve funds for pending order).
 */
export interface HoldRequest {
  accountId: string;
  asset: string;
  amount: number;
  orderId: string;
}

/**
 * Trade settlement input.
 */
export interface TradeSettlementInput {
  tradeId: string;
  buyerAccountId: string;
  sellerAccountId: string;
  symbol: string; // e.g., "BTC-USD"
  price: number;
  quantity: number;
  buyerFee: number;
  sellerFee: number;
}

/**
 * Account summary with all balances.
 */
export interface AccountSummary {
  accountId: string;
  balances: Balance[];
  totalValueUsd?: number;
  updatedAt: Date;
}

/**
 * Ledger event for streaming.
 */
export interface LedgerEvent {
  type: 'balance_updated' | 'hold_created' | 'hold_released' | 'trade_settled';
  accountId: string;
  asset: string;
  change: number;
  newBalance: Balance;
  timestamp: number;
}
