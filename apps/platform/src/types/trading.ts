// types/trading.ts - Trading types stub

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop_limit' | 'take_profit';
export type OrderStatus = 'pending' | 'submitted' | 'open' | 'partial' | 'filled' | 'cancelled' | 'rejected' | 'expired' | 'triggered';

export interface OrderFill {
    price: string;
    quantity: string;
    fee: string;
    time: number;
}

export interface PaperOrder {
    clientOrderId: string;
    symbol: string;
    side: OrderSide;
    type: OrderType;
    price: string | null;
    quantity: string;
    filledQty: string;
    avgPrice: string | null;
    status: OrderStatus;
    fills: OrderFill[];
    createdAt: number;
    updatedAt: number;
}

export interface Position {
    symbol: string;
    side: 'long' | 'short';
    quantity: string;
    avgEntryPrice: string;
    realizedPnl?: string;
}
