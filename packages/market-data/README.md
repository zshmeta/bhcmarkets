# @repo/market-data

Enterprise-grade market data service for BHC Markets trading platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                            │
│  ┌───────────────┐              ┌───────────────────────────┐  │
│  │   Binance     │ (WebSocket)  │       Yahoo Finance       │  │
│  │   Collector   │              │        Collector          │  │
│  │  (Crypto)     │              │  (Stocks/Forex/Indices)   │  │
│  └───────┬───────┘              └────────────┬──────────────┘  │
└──────────┼──────────────────────────────────┼──────────────────┘
           │                                   │
           └───────────────┬───────────────────┘
                           │
                 ┌─────────▼─────────┐
                 │ Collector Registry │
                 │ (Aggregates all   │
                 │  collector ticks) │
                 └─────────┬─────────┘
                           │
                 ┌─────────▼─────────┐
                 │    Normalizer     │
                 │ (Enriches ticks   │
                 │  with metadata)   │
                 └─────────┬─────────┘
                           │
      ┌────────────────────┼────────────────────┐
      │                    │                    │
┌─────▼─────┐      ┌───────▼───────┐    ┌──────▼──────┐
│  Price    │      │   Candle      │    │  WebSocket  │
│  Cache    │      │  Aggregator   │    │  Publisher  │
│  (Redis)  │      │  (OHLCV)      │    │  (Clients)  │
└─────┬─────┘      └───────┬───────┘    └──────┬──────┘
      │                    │                   │
┌─────▼─────┐      ┌───────▼───────┐    ┌─────▼──────┐
│  REST API │      │   Database    │    │  Platform  │
│  /prices  │      │   Storage     │    │    App     │
└───────────┘      └───────────────┘    └────────────┘
```

## Data Sources

| Source | Asset Classes | Update Method | Latency |
|--------|--------------|---------------|---------|
| **Binance** | Crypto | WebSocket | ~50-100ms |
| **Yahoo Finance** | Stocks, Forex, Indices, Commodities | Polling (15-30s) | ~15-30s |

## Supported Symbols

### Crypto (via Binance)
BTC/USD, ETH/USD, SOL/USD, BNB/USD, XRP/USD, ADA/USD, DOGE/USD, AVAX/USD, DOT/USD, LINK/USD, MATIC/USD, UNI/USD, ATOM/USD, LTC/USD, NEAR/USD

### Forex (via Yahoo)
EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD, USD/CHF, NZD/USD, EUR/GBP

### Stocks (via Yahoo)
AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, JPM, V, WMT

### Indices (via Yahoo)
^GSPC (S&P 500), ^DJI (Dow Jones), ^IXIC (NASDAQ), ^VIX (VIX)

### Commodities (via Yahoo)
GC=F (Gold), SI=F (Silver), CL=F (Crude Oil), NG=F (Natural Gas)

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (for candle storage)
- Redis (optional, falls back to in-memory)

### Environment Variables

```bash
# Required
DATABASE_URL=postgres://user:pass@localhost:5432/bhc

# Optional
REDIS_URL=redis://localhost:6379
PORT=4001          # HTTP API port
WS_PORT=4002       # WebSocket port
NODE_ENV=development
LOG_LEVEL=info
```

### Running

```bash
# Development
npm run dev

# Production
npm run build
npm run start
```

## API Endpoints

### Health

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Full health status with component details |
| `GET /health/live` | Kubernetes liveness probe |
| `GET /health/ready` | Kubernetes readiness probe |

### Prices

| Endpoint | Description |
|----------|-------------|
| `GET /api/prices` | Snapshot of all current prices |
| `GET /api/prices/:symbol` | Single symbol price (URL-encode `/` as `%2F`) |

### Historical Data

| Endpoint | Description |
|----------|-------------|
| `GET /api/candles/:symbol` | OHLCV candles for TradingView |

Query parameters:
- `timeframe`: `1m`, `5m`, `15m`, `1h`, `4h`, `1d`, `1w` (default: `1m`)
- `from`: Start timestamp (ms)
- `to`: End timestamp (ms)
- `limit`: Max candles to return (default: 100)

### Symbols

| Endpoint | Description |
|----------|-------------|
| `GET /api/symbols` | List of all supported symbols |

## WebSocket Protocol

Connect to `ws://localhost:4002/ws`

### Subscribe to symbols
```json
{
  "type": "subscribe",
  "symbols": ["BTC/USD", "ETH/USD"]
}
```

### Unsubscribe
```json
{
  "type": "unsubscribe",
  "symbols": ["BTC/USD"]
}
```

### Ping/Pong keepalive
```json
{ "type": "ping" }
```

### Server messages

**Tick update:**
```json
{
  "type": "tick",
  "data": {
    "symbol": "BTC/USD",
    "last": 50000.00,
    "bid": 49999.50,
    "ask": 50000.50,
    "mid": 50000.00,
    "spread": 1.00,
    "volume": 1234.56,
    "timestamp": 1704456000000
  }
}
```

**Subscription confirmation:**
```json
{
  "type": "subscribed",
  "symbols": ["BTC/USD", "ETH/USD"]
}
```

## Testing

```bash
# Unit tests (no external dependencies)
npm run test

# Integration tests (requires running service)
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Project Structure

```
src/
├── config/           # Environment config, symbol definitions
├── domains/
│   ├── collectors/   # Data source collectors (Binance, Yahoo)
│   ├── normalizer/   # Tick enrichment and validation
│   ├── cache/        # Redis price cache
│   ├── historical/   # Candle aggregation and storage
│   ├── stream/       # WebSocket server for clients
│   └── health/       # Health monitoring
├── api/              # REST API routes
├── db/               # Database connection
├── utils/            # Logger, helpers
└── index.ts          # Bootstrap
```

## Key Design Decisions

1. **1-minute candles only in DB**: Higher timeframes are aggregated on-the-fly, reducing storage and maintaining flexibility.

2. **In-memory cache fallback**: Service works without Redis for development, using a Map-based cache.

3. **Circuit breaker pattern**: Collectors automatically back off on failures, preventing cascading issues.

4. **Throttled WebSocket output**: Updates are batched at 250ms intervals to prevent overwhelming clients.

5. **Separate HTTP and WS ports**: Allows independent scaling and simpler load balancing.
