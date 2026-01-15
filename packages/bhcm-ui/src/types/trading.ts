/**
 * Trading-related types used by order entry components.
 * Stub file for design preview - minimal definitions.
 */

export type OrderSide = 'buy' | 'sell';

export type OrderType =
    | 'limit'
    | 'market'
    | 'stop_limit'
    | 'take_profit_limit'
    | 'trailing_stop';

export type TrailingType = 'percent' | 'absolute';

export type OrderStatus =
    | 'new'
    | 'partially_filled'
    | 'filled'
    | 'canceled'
    | 'rejected'
    | 'expired';

export interface Order {
    orderId: string;
    symbol: string;
    side: OrderSide;
    type: OrderType;
    price: string;
    quantity: string;
    filledQuantity?: string;
    status: OrderStatus;
    createdAt: number;
}

export interface Position {
    symbol: string;
    side: 'long' | 'short';
    quantity: string;
    avgEntryPrice: string;
}

export interface WalletBalance {
    asset: string;
    available: string;
    frozen: string;
}

export interface PaperOrder {
    clientOrderId: string;
    symbol: string;
    side: OrderSide;
    type: OrderType;
    price: string;
    quantity: string;
    filledQty: string;
    status: 'pending' | 'submitted' | 'open' | 'partial' | 'filled' | 'cancelled' | 'rejected';
    timestamp: number;
}
