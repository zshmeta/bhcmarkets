# @repo/types

Shared TypeScript type definitions for BHC Markets.

## Overview

Centralized type definitions used across all packages and applications in the BHC Markets monorepo. Ensures type consistency and reduces duplication.

## Installation

```bash
# Already included in the monorepo
bun install
```

## Usage

Import types from the package:

```typescript
import type {
  User,
  Account,
  Order,
  Trade,
  Position,
  Balance,
} from '@repo/types';
```

## Core Types

### User

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin' | 'market_maker';
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}
```

### Account

```typescript
interface Account {
  id: string;
  userId: string;
  currency: string;          // USD, EUR, etc.
  type: 'trading' | 'demo';
  status: 'active' | 'frozen';
  createdAt: Date;
  updatedAt: Date;
}
```

### Order

```typescript
interface Order {
  id: string;
  accountId: string;
  symbol: string;            // BTC/USD, ETH/USD, etc.
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  status: 'pending' | 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
  quantity: number;
  price: number | null;      // null for market orders
  stopPrice: number | null;  // for stop orders
  filledQuantity: number;
  averagePrice: number | null;
  timeInForce: 'GTC' | 'IOC' | 'FOK' | 'GTD';
  expiresAt: Date | null;    // for GTD orders
  stopLoss: number | null;
  takeProfit: number | null;
  createdAt: Date;
  updatedAt: Date;
  filledAt: Date | null;
}
```

### Trade

```typescript
interface Trade {
  id: string;
  symbol: string;
  buyOrderId: string;
  sellOrderId: string;
  buyerAccountId: string;
  sellerAccountId: string;
  price: number;
  quantity: number;
  buyerFee: number;
  sellerFee: number;
  createdAt: Date;
}
```

### Position

```typescript
interface Position {
  id: string;
  accountId: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  averageEntryPrice: number;
  currentPrice: number;
  realizedPnl: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  stopLoss: number | null;
  takeProfit: number | null;
  openedAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}
```

### Balance

```typescript
interface Balance {
  id: string;
  accountId: string;
  asset: string;             // USD, BTC, ETH, etc.
  available: number;         // Available for trading
  held: number;              // Locked in orders
  total: number;             // available + held
  updatedAt: Date;
}
```

## Market Data Types

### Tick

```typescript
interface Tick {
  symbol: string;
  last: number;
  bid: number;
  ask: number;
  mid: number;
  spread: number;
  volume: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  change24h: number;
  changePercent24h: number;
  timestamp: number;
}
```

### Candle

```typescript
interface Candle {
  symbol: string;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openTime: number;          // Unix timestamp
  closeTime: number;
}
```

### OrderBook

```typescript
interface OrderBookLevel {
  price: number;
  quantity: number;
}

interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];    // Sorted by price descending
  asks: OrderBookLevel[];    // Sorted by price ascending
  timestamp: number;
}
```

## Ledger Types

### LedgerEntry

```typescript
interface LedgerEntry {
  id: string;
  accountId: string;
  asset: string;
  type: 'debit' | 'credit';
  amount: number;
  balanceAfter: number;
  reason: 'trade' | 'deposit' | 'withdrawal' | 'fee' | 'adjustment';
  referenceId: string | null;
  createdAt: Date;
}
```

### BalanceHold

```typescript
interface BalanceHold {
  id: string;
  accountId: string;
  asset: string;
  amount: number;
  reason: 'order' | 'withdrawal' | 'system';
  referenceId: string;       // order_id, withdrawal_id, etc.
  createdAt: Date;
  releasedAt: Date | null;
}
```

## Request/Response Types

### Authentication

```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}
```

### Order Placement

```typescript
interface PlaceOrderRequest {
  accountId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'GTD';
  expiresAt?: Date;
  stopLoss?: number;
  takeProfit?: number;
}

interface PlaceOrderResponse {
  success: boolean;
  order: Order;
  message?: string;
}
```

## WebSocket Message Types

### Market Data Messages

```typescript
type MarketDataMessage =
  | { type: 'subscribe'; symbols: string[] }
  | { type: 'unsubscribe'; symbols: string[] }
  | { type: 'ping' }
  | { type: 'pong' }
  | { type: 'tick'; data: Tick }
  | { type: 'subscribed'; symbols: string[] }
  | { type: 'error'; message: string };
```

### Order Engine Messages

```typescript
type OrderEngineMessage =
  | { type: 'subscribe'; channel: 'orderbook' | 'trades' | 'orders'; symbol?: string; accountId?: string }
  | { type: 'unsubscribe'; channel: string }
  | { type: 'orderbook_snapshot'; symbol: string; data: OrderBook }
  | { type: 'orderbook_update'; symbol: string; data: OrderBookUpdate }
  | { type: 'trade'; symbol: string; data: Trade }
  | { type: 'order_update'; data: Order }
  | { type: 'error'; message: string };

interface OrderBookUpdate {
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  action: 'add' | 'update' | 'remove';
}
```

## Utility Types

### Paginated Response

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
```

### API Response

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Filters

```typescript
interface OrderFilter {
  status?: Order['status'];
  symbol?: string;
  side?: 'buy' | 'sell';
  startDate?: Date;
  endDate?: Date;
}

interface TradeFilter {
  symbol?: string;
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
}
```

## Enums

```typescript
export enum OrderStatus {
  PENDING = 'pending',
  OPEN = 'open',
  FILLED = 'filled',
  PARTIALLY_FILLED = 'partially_filled',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP = 'stop',
  STOP_LIMIT = 'stop_limit',
}

export enum TimeInForce {
  GTC = 'GTC',  // Good Till Cancelled
  IOC = 'IOC',  // Immediate Or Cancel
  FOK = 'FOK',  // Fill Or Kill
  GTD = 'GTD',  // Good Till Date
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MARKET_MAKER = 'market_maker',
}

export enum AccountStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
}
```

## Type Guards

```typescript
export function isMarketOrder(order: Order): boolean {
  return order.type === 'market';
}

export function isLimitOrder(order: Order): boolean {
  return order.type === 'limit';
}

export function isStopOrder(order: Order): boolean {
  return order.type === 'stop' || order.type === 'stop_limit';
}

export function isActiveOrder(order: Order): boolean {
  return order.status === 'open' || order.status === 'partially_filled';
}

export function isFilledOrder(order: Order): boolean {
  return order.status === 'filled';
}
```

## Adding New Types

When adding new types:

1. **Create the type** in the appropriate category
2. **Export it** from `src/index.ts`
3. **Document it** with JSDoc comments
4. **Add type guards** if applicable

Example:

```typescript
/**
 * Withdrawal request from user account
 */
export interface Withdrawal {
  /** Unique identifier */
  id: string;
  /** Account ID */
  accountId: string;
  /** Asset being withdrawn */
  asset: string;
  /** Amount to withdraw */
  amount: number;
  /** Withdrawal method */
  method: 'bank_transfer' | 'crypto';
  /** Destination address/account */
  destination: string;
  /** Current status */
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  /** Transaction ID (if completed) */
  transactionId: string | null;
  /** Created timestamp */
  createdAt: Date;
  /** Completed timestamp */
  completedAt: Date | null;
}
```

## Best Practices

1. **Use interfaces over types** for object shapes
2. **Prefer string literal unions** over enums for simple cases
3. **Add JSDoc comments** for complex types
4. **Keep types DRY** - reuse common patterns
5. **Export everything** from the main index
6. **Use strict null checks** - avoid optional properties when possible
7. **Namespace related types** if there are many

## License

Private - BHC Markets
