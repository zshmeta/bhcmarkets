// ===== Trading Types =====


export type UUID = string;

export interface Order {
	id: UUID;
	accountId: UUID;
	symbol: string;
	side: OrderSide;
	type: OrderType;
	price?: string; // decimal as string
	quantity: string;
	filledQuantity: string;
	status: OrderStatus;
	createdAt: string; // ISO timestamp
	updatedAt: string;
}

export interface Trade {
	id: UUID;
	orderId: UUID;
	counterpartyOrderId?: UUID;
	price: string;
	quantity: string;
	fee?: string;
	feeCurrency?: string;
	createdAt: string;
}

export interface Position {
	id: UUID;
	accountId: UUID;
	symbol: string;
	side: "long" | "short";
	quantity: string;
	entryPrice?: string;
	unrealizedPnl?: string;
	realizedPnl?: string;
	liquidationPrice?: string;
	updatedAt: string;
}

export type LedgerRefType = "order" | "trade" | "deposit" | "withdrawal" | "fee" | "adjustment";

export interface LedgerEntry {
	id: number; // bigserial
	entryUuid: UUID;
	accountId: UUID;
	referenceId?: UUID;
	referenceType?: LedgerRefType;
	amount: string; // +credit, -debit
	balanceAfter: string;
	createdAt: string;
	description?: string;
}


export type OrderStatus =
  | 'pending'      // Created locally, not submitted
  | 'submitted'    // Submitted to the paper trading engine
  | 'open'         // Order is open
  | 'partial'      // Partially filled
  | 'filled'       // Fully filled
  | 'cancelled'    // Cancelled
  | 'rejected';    // Rejected (insufficient balance, etc.)

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market';

export interface PaperOrder {
  clientOrderId: string;   // Client-generated UUID
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: string | null;    // Required for limit orders; null for market orders
  quantity: string;        // Order quantity
  filledQty: string;       // Filled quantity
  avgPrice: string;        // Average fill price
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  fills: Fill[];           // Fill details
  rejectReason?: string;   // Rejection reason
  takeProfitPrice?: string; // Take-profit trigger price
  stopLossPrice?: string;   // Stop-loss trigger price
}

export interface Fill {
  fillId: string;
  price: string;
  quantity: string;
  fee: string;             // Fee (simulated 0.1%)
  feeAsset: string;        // Fee asset
  time: number;
  triggerTradeId?: string; // Market Trade ID that triggered this fill
}

export interface PaperPosition {
  symbol: string;
  side: 'long' | 'flat';   // Spot long only; short is not supported (no borrowing)
  quantity: string;        // Position size (base asset)
  avgEntryPrice: string;   // Average entry price
  unrealizedPnl: string;   // Unrealized PnL (based on mid price)
  realizedPnl: string;     // Realized PnL (settled on sell)
  updatedAt: number;
  takeProfitPrice?: string; // Take-profit price
  stopLossPrice?: string;   // Stop-loss price
}

export interface AccountBalance {
  asset: string;           // Asset, e.g. "USDT", "BTC"
  free: string;            // Available balance
  locked: string;          // Locked balance (reserved by open orders)
  total: string;           // Total balance = free + locked
}

// ===== Valid Order State Transitions =====

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['submitted', 'cancelled'],
  submitted: ['open', 'rejected'],
  open: ['partial', 'filled', 'cancelled'],
  partial: ['filled', 'cancelled'],
  filled: [],
  cancelled: [],
  rejected: [],
};

// ===== Order UI Constraints =====

export interface OrderUIConstraints {
  canCancel: boolean;
  canModify: boolean;
  displayStyle: 'pending' | 'processing' | 'active' | 'success' | 'cancelled' | 'error';
}

export const ORDER_UI_CONSTRAINTS: Record<OrderStatus, OrderUIConstraints> = {
  pending: { canCancel: true, canModify: true, displayStyle: 'pending' },
  submitted: { canCancel: false, canModify: false, displayStyle: 'processing' },
  open: { canCancel: true, canModify: false, displayStyle: 'active' },
  partial: { canCancel: true, canModify: false, displayStyle: 'active' },
  filled: { canCancel: false, canModify: false, displayStyle: 'success' },
  cancelled: { canCancel: false, canModify: false, displayStyle: 'cancelled' },
  rejected: { canCancel: false, canModify: false, displayStyle: 'error' },
};





