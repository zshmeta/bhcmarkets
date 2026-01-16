// ===== Wallet Types =====

// ===== Account =====
export type AccountStatus = 'pending' | 'active' | 'suspended';

export interface Account {
  accountId: string;           // PTT-xxxxxx
  status: AccountStatus;
  createdAt: number;
}

// ===== Wallet Balance =====
export interface WalletBalance {
  asset: string;      // USDT, BTC, ETH, ...
  available: string;  // Decimal string
  frozen: string;     // Decimal string
  total: string;      // available + frozen
}

// ===== Payment Method (Bank Card Mock) =====
export interface PaymentMethod {
  id: string;         // uuid
  type: 'bank';
  bankName: string;   // Bank name
  lastFour: string;   // Last 4 digits
  alias: string;      // User-defined nickname
  createdAt: number;
}

// ===== Address Book (Crypto Address Mock) =====
export type ChainType = 'TRC20' | 'ERC20' | 'BEP20';

export interface CryptoAddress {
  id: string;         // uuid
  chain: ChainType;
  address: string;    // Full address
  alias: string;      // User-defined nickname
  createdAt: number;
}

// ===== Deposit =====
export type DepositStatus = 'pending' | 'confirmed' | 'failed';

export interface Deposit {
  depositId: string;
  asset: string;
  amount: string;
  sourceType: 'bank' | 'crypto';
  sourceId: string;   // PaymentMethod.id or CryptoAddress.id
  status: DepositStatus;
  createdAt: number;
  confirmedAt?: number;
}

// ===== Withdraw =====
export type WithdrawStatus = 'processing' | 'completed' | 'failed';

export interface Withdraw {
  withdrawId: string;
  asset: string;
  amount: string;
  fee: string;
  destinationType: 'bank' | 'crypto';
  destinationId: string;
  status: WithdrawStatus;
  createdAt: number;
  completedAt?: number;
}

// ===== Ledger Entry =====
export type LedgerType = 
  | 'DEPOSIT' 
  | 'WITHDRAW_FREEZE' 
  | 'WITHDRAW_COMPLETE' 
  | 'WITHDRAW_REFUND'
  | 'ORDER_FREEZE' 
  | 'ORDER_UNFREEZE' 
  | 'FILL' 
  | 'FEE'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'INITIAL_GRANT';

export type ReferenceType = 'deposit' | 'withdraw' | 'order' | 'fill' | 'transfer' | 'grant';

export interface LedgerEntry {
  entryId: string;
  type: LedgerType;
  direction: '+' | '-';     // Increase or decrease
  asset: string;
  amount: string;
  fee: string;              // Fee for this operation
  balanceAfter: string;     // Post-operation balance snapshot
  referenceType: ReferenceType;
  referenceId: string;
  note?: string;
  createdAt: number;
}

// ===== Onboarding Stage =====
export type OnboardingStage = 
  | 'not_created'       // Account not created
  | 'no_payment_method' // Account created, not linked
  | 'no_funds'          // Linked, no funds
  | 'funded';           // Funded

// ===== Ledger Filter =====
export type LedgerFilter = 'all' | 'deposit' | 'withdraw' | 'trade' | 'fee';

// ===== Performance Metrics =====
export interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;          // Win rate (0-1)
  profitFactor: number;     // Profit factor
  maxDrawdown: number;      // Max drawdown %
  peakEquity: string;       // Peak equity (USDT)
  totalRealizedPnl: string; // Total realized PnL (USDT)
}


