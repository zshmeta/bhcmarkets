# @repo/order-engine

Production-ready order matching engine service for the BHC Markets trading platform.

## Overview

The order engine is a standalone microservice that handles:

- **Order Matching**: Price-time priority matching algorithm
- **Order Book Management**: Real-time order book with incremental updates
- **Order Lifecycle**: Validation, persistence, and status tracking
- **WebSocket Streaming**: Real-time order book and trade updates
- **REST API**: HTTP endpoints for order operations
- **Stop Orders**: Conditional orders triggered by price movement
- **Position Management**: Track and manage open positions
- **Trade Processing**: Execute trades with fee calculation
- **Ledger Service**: Double-entry balance management
- **Risk Management**: Pre-trade and real-time risk checks

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Order Engine                       │
├─────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌──────────────────────────┐   │
│  │   REST API    │  │    WebSocket Server      │   │
│  │  (Port 4003)  │  │      (Port 4004)         │   │
│  └───────┬───────┘  └────────────┬─────────────┘   │
│          │                       │                  │
│          └───────────┬───────────┘                  │
│                      ▼                              │
│          ┌───────────────────────┐                  │
│          │    Order Manager      │                  │
│          │  - Validation         │                  │
│          │  - Persistence        │                  │
│          │  - Stop Orders        │                  │
│          └───────────┬───────────┘                  │
│                      │                              │
│          ┌───────────┼───────────┐                  │
│          ▼           ▼           ▼                  │
│  ┌─────────────┐ ┌────────┐ ┌──────────┐           │
│  │Risk Service │ │Matching│ │  Trade   │           │
│  │(pre-trade)  │ │ Engine │ │Processor │           │
│  └─────────────┘ └────────┘ └────┬─────┘           │
│                                  │                  │
│          ┌───────────┬───────────┘                  │
│          ▼           ▼                              │
│  ┌─────────────┐ ┌──────────────┐                  │
│  │  Position   │ │   Ledger     │                  │
│  │  Manager    │ │   Service    │                  │
│  └─────────────┘ └──────────────┘                  │
│          │               │                          │
│          └───────┬───────┘                          │
│                  ▼                                  │
│    ┌──────────┐           ┌──────────┐             │
│    │PostgreSQL│           │  Redis   │             │
│    │(orders,  │           │(pub/sub) │             │
│    │ trades)  │           │          │             │
│    └──────────┘           └──────────┘             │
└─────────────────────────────────────────────────────┘
```

## Trading Domains

### Orders Domain
- Order validation with rate limiting
- Order persistence and recovery
- Stop order management
- Order lifecycle events

### Matching Domain
- Price-time priority order book
- Continuous matching engine
- Multi-symbol management
- Level aggregation

### Positions Domain
- Long/short position tracking
- FIFO cost basis calculation
- Realized & unrealized PnL
- Position events (opened, updated, closed)

### Trades Domain
- Trade execution and settlement
- Maker/taker fee model with volume tiers
- 30-day volume tracking for discounts
- Trade statistics

### Ledger Domain
- Double-entry bookkeeping
- Available/Held balance model
- Hold management for pending orders
- Trade settlement (buyer/seller)
- Deposit/withdrawal operations

### Risk Domain
- Pre-trade risk checks (10+ checks)
- Order size/value limits
- Position limits
- Daily volume/order limits
- Price deviation checks
- Balance verification
- Real-time exposure monitoring
- Risk alerts and acknowledgment

## Features

### Order Types

- **Market Orders**: Execute immediately at best available price
- **Limit Orders**: Execute at specified price or better
- **Stop Orders**: Trigger when price reaches threshold
- **Stop-Limit Orders**: Trigger and place limit order

### Time In Force

- **GTC** (Good Till Cancelled): Order remains until filled or cancelled
- **IOC** (Immediate Or Cancel): Fill what's possible, cancel rest
- **FOK** (Fill Or Kill): Fill entirely or reject
- **GTD** (Good Till Date): Expires at specified time

### Matching Algorithm

The matching engine uses **price-time priority**:

1. Orders are matched at the best available price first
2. At the same price level, earlier orders have priority
3. Market orders execute immediately against resting orders
4. Limit orders cross if the price matches or improves

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start in development mode (with hot reload)
pnpm dev

# Run tests
pnpm test

# Run with coverage
pnpm test:coverage
```

### Production

```bash
# Build
pnpm build

# Start
pnpm start
```

## Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=4003
WS_PORT=4004
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/trading

# Redis (optional - falls back to in-memory)
REDIS_URL=redis://localhost:6379

# Order Engine Limits
MAX_ORDERS_PER_ACCOUNT=1000
ORDER_EXPIRATION_DAYS=30
PRICE_DEVIATION_TOLERANCE=0.1

# Matching Engine
ORDER_BOOK_SNAPSHOT_INTERVAL_MS=100
TRADE_BATCH_SIZE=100
TRADE_FLUSH_INTERVAL_MS=1000

# Rate Limiting
RATE_LIMIT_ORDERS_PER_SECOND=10
RATE_LIMIT_BURST=50
```

## API Reference

### REST Endpoints

#### Orders

```
POST   /orders           - Place new order
DELETE /orders/:id       - Cancel order
GET    /orders/:id       - Get order by ID
GET    /orders           - Get orders (with filters)
```

#### Order Book

```
GET    /orderbook/:symbol        - Get order book snapshot
GET    /orderbook/:symbol/depth  - Get order book depth
```

#### Trades

```
GET    /trades/:symbol           - Get recent trades
GET    /trades/account/:id       - Get account trades
```

#### Health

```
GET    /health                   - Service health
GET    /stats                    - Service statistics
```

### WebSocket Protocol

#### Connect

```
ws://localhost:4004
```

#### Subscribe to Order Book

```json
{
  "type": "subscribe",
  "channel": "orderbook",
  "symbol": "BTC-USD"
}
```

#### Subscribe to Trades

```json
{
  "type": "subscribe",
  "channel": "trades",
  "symbol": "BTC-USD"
}
```

#### Subscribe to Private Orders

```json
{
  "type": "subscribe",
  "channel": "orders",
  "accountId": "account-uuid"
}
```

#### Messages from Server

Order Book Snapshot:
```json
{
  "type": "orderbook_snapshot",
  "symbol": "BTC-USD",
  "data": {
    "bids": [{ "price": 50000, "quantity": 1.5 }],
    "asks": [{ "price": 50100, "quantity": 2.0 }],
    "timestamp": 1700000000000
  }
}
```

Order Book Update:
```json
{
  "type": "orderbook_update",
  "symbol": "BTC-USD",
  "data": {
    "side": "buy",
    "price": 50000,
    "quantity": 2.5,
    "action": "update"
  }
}
```

Trade:
```json
{
  "type": "trade",
  "symbol": "BTC-USD",
  "data": {
    "price": 50050,
    "quantity": 0.5,
    "timestamp": 1700000000000,
    "makerSide": "sell"
  }
}
```

## Usage Examples

### Place Order (REST)

```typescript
const response = await fetch('http://localhost:4003/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Account-ID': 'account-uuid',
  },
  body: JSON.stringify({
    symbol: 'BTC-USD',
    side: 'buy',
    type: 'limit',
    quantity: 1,
    price: 50000,
    timeInForce: 'GTC',
  }),
});

const result = await response.json();
// { success: true, orderId: '...', status: 'open', ... }
```

### Subscribe to Order Book (WebSocket)

```typescript
const ws = new WebSocket('ws://localhost:4004');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'orderbook',
    symbol: 'BTC-USD',
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'orderbook_snapshot') {
    // Full order book
    console.log('Snapshot:', message.data);
  } else if (message.type === 'orderbook_update') {
    // Incremental update
    console.log('Update:', message.data);
  }
};
```

### Programmatic Usage

```typescript
import { OrderManager, MatchingEngine } from '@repo/order-engine';

// Create order manager
const orderManager = new OrderManager({
  enablePersistence: false, // In-memory only
  enableEventPublishing: false,
});

// Place order
const result = await orderManager.placeOrder({
  accountId: 'account-1',
  symbol: 'BTC-USD',
  side: 'buy',
  type: 'limit',
  quantity: 1,
  price: 50000,
  timeInForce: 'GTC',
});

console.log(result);
// { success: true, orderId: '...', status: 'open', ... }
```

## Testing

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Integration tests (requires database)
pnpm test:integration
```

## Performance

The order engine is optimized for:

- **Throughput**: Process thousands of orders per second
- **Latency**: Sub-millisecond matching for most orders
- **Memory**: Efficient order book data structures
- **Scalability**: One order book per symbol, can be distributed

### Benchmarks

| Operation | Avg Latency |
|-----------|-------------|
| Add Order | < 0.1ms |
| Match Order | < 0.5ms |
| Cancel Order | < 0.1ms |
| Order Book Snapshot | < 1ms |

## License

Private - BHC Markets
