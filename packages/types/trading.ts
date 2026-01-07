export type UUID = string;

export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit" | "stop" | "stop_limit" | "take_profit";
export type OrderStatus = "new" | "open" | "partially_filled" | "filled" | "cancelled" | "rejected" | "expired";

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
