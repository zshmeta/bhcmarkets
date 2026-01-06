/**
 * Order Engine - Type Definitions
 * ================================
 *
 * Core types for the order matching engine.
 */

// =============================================================================
// BASIC TYPES
// =============================================================================

export type UUID = string;

export type OrderSide = 'buy' | 'sell';

export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';

export type OrderStatus =
  | 'new'           // Order created, not yet in book
  | 'open'          // In order book, waiting for match
  | 'partially_filled'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'expired';

export type TimeInForce =
  | 'GTC'  // Good Till Cancelled
  | 'IOC'  // Immediate Or Cancel
  | 'FOK'  // Fill Or Kill
  | 'GTD'; // Good Till Date

// =============================================================================
// ORDER TYPES
// =============================================================================

/**
 * Full order representation (stored in DB).
 */
export interface Order {
  id: UUID;
  accountId: UUID;
  userId: UUID;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  timeInForce: TimeInForce;
  price: string | null;       // Limit price (null for market orders)
  stopPrice: string | null;   // Stop trigger price
  quantity: string;           // Total quantity
  filledQuantity: string;     // Quantity already filled
  remainingQuantity: string;  // Quantity still open
  averageFillPrice: string | null;
  clientOrderId?: string;     // Client-provided ID for idempotency
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}

/**
 * Input for placing a new order.
 */
export interface PlaceOrderInput {
  accountId: UUID;
  userId: UUID;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  timeInForce?: TimeInForce;
  price?: string;
  stopPrice?: string;
  quantity: string;
  clientOrderId?: string;
  expiresAt?: Date;
}

/**
 * Order in the matching engine (optimized for speed).
 */
export interface EngineOrder {
  id: UUID;
  accountId: UUID;
  side: OrderSide;
  type: OrderType;
  price: number;           // 0 for market orders
  stopPrice: number;       // 0 if not a stop order
  quantity: number;
  filledQuantity: number;
  timestamp: number;       // Epoch ms for time priority
}

/**
 * Order book level (aggregated view).
 */
export interface OrderBookLevel {
  price: string;
  quantity: string;
  orderCount: number;
}

/**
 * Order book snapshot.
 */
export interface OrderBookSnapshot {
  symbol: string;
  bids: OrderBookLevel[];  // Sorted descending by price
  asks: OrderBookLevel[];  // Sorted ascending by price
  lastUpdateId: number;
  timestamp: number;
}

// =============================================================================
// TRADE TYPES
// =============================================================================

/**
 * A trade execution between two orders.
 */
export interface Trade {
  id: UUID;
  symbol: string;
  makerOrderId: UUID;
  takerOrderId: UUID;
  makerAccountId: UUID;
  takerAccountId: UUID;
  side: OrderSide;         // Taker's side
  price: string;
  quantity: string;
  makerFee: string;
  takerFee: string;
  timestamp: Date;
}

/**
 * Trade for internal processing (before persistence).
 */
export interface EngineTrade {
  makerOrderId: UUID;
  takerOrderId: UUID;
  makerAccountId: UUID;
  takerAccountId: UUID;
  price: number;
  quantity: number;
  timestamp: number;
}

// =============================================================================
// EVENTS
// =============================================================================

/**
 * Event types emitted by the order engine.
 */
export type OrderEventType =
  | 'order.created'
  | 'order.accepted'      // Accepted into order book
  | 'order.rejected'
  | 'order.cancelled'
  | 'order.expired'
  | 'order.filled'
  | 'order.partially_filled'
  | 'trade.executed';

/**
 * Order event payload.
 */
export interface OrderEvent {
  type: OrderEventType;
  orderId: UUID;
  accountId: UUID;
  symbol: string;
  timestamp: number;
  data: Record<string, unknown>;
}

/**
 * Trade event payload.
 */
export interface TradeEvent {
  type: 'trade.executed';
  tradeId: UUID;
  symbol: string;
  makerOrderId: UUID;
  takerOrderId: UUID;
  price: string;
  quantity: string;
  timestamp: number;
}

// =============================================================================
// WEBSOCKET MESSAGE TYPES
// =============================================================================

/**
 * Client → Server messages.
 */
export type ClientMessage =
  | { type: 'subscribe'; channels: SubscriptionChannel[] }
  | { type: 'unsubscribe'; channels: SubscriptionChannel[] }
  | { type: 'ping' }
  | { type: 'place_order'; data: PlaceOrderInput }
  | { type: 'cancel_order'; orderId: UUID }
  | { type: 'cancel_all_orders'; symbol?: string };

/**
 * Server → Client messages.
 */
export type ServerMessage =
  | { type: 'pong' }
  | { type: 'subscribed'; channels: SubscriptionChannel[] }
  | { type: 'unsubscribed'; channels: SubscriptionChannel[] }
  | { type: 'error'; code: string; message: string }
  | { type: 'order_update'; data: OrderUpdateMessage }
  | { type: 'trade'; data: TradeMessage }
  | { type: 'order_book'; data: OrderBookSnapshot }
  | { type: 'order_book_update'; data: OrderBookUpdateMessage };

/**
 * Subscription channels.
 */
export type SubscriptionChannel =
  | { type: 'orders'; accountId: UUID }           // User's order updates
  | { type: 'trades'; symbol: string }            // Public trades
  | { type: 'order_book'; symbol: string }        // Order book updates
  | { type: 'order_book_snapshot'; symbol: string }; // Full order book

/**
 * Order update message.
 */
export interface OrderUpdateMessage {
  orderId: UUID;
  accountId: UUID;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  price: string | null;
  quantity: string;
  filledQuantity: string;
  remainingQuantity: string;
  averageFillPrice: string | null;
  timestamp: number;
  event: OrderEventType;
}

/**
 * Trade message.
 */
export interface TradeMessage {
  tradeId: UUID;
  symbol: string;
  price: string;
  quantity: string;
  side: OrderSide;
  timestamp: number;
}

/**
 * Order book update (incremental).
 */
export interface OrderBookUpdateMessage {
  symbol: string;
  updateId: number;
  bids: Array<[string, string]>; // [price, quantity] - quantity 0 means remove
  asks: Array<[string, string]>;
  timestamp: number;
}

// =============================================================================
// SERVICE INTERFACES
// =============================================================================

/**
 * Order validation result.
 */
export interface OrderValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

/**
 * Order placement result.
 */
export interface PlaceOrderResult {
  success: boolean;
  order?: Order;
  trades?: Trade[];
  error?: string;
  code?: string;
}

/**
 * Order cancellation result.
 */
export interface CancelOrderResult {
  success: boolean;
  order?: Order;
  error?: string;
  code?: string;
}
