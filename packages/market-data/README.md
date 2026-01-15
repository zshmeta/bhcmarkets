# @repo/market-data

Real-time (and near real-time) market data service for the BHC Markets trading platform.

If you only remember one thing: this service **collects prices from multiple upstream providers**, normalizes them into a single format, then serves them to the rest of the platform via **REST + WebSocket**.

## Architecture

### Key concepts (plain English)

- **Symbol**: the “thing” you want a price for (example: `BTC/USD`, `AAPL`, `EUR/USD`).
- **Tick**: a single price update at a point in time.
- **Candle (OHLCV)**: prices grouped into time buckets (1 minute, 5 minutes, etc.) used for charts.

### Data flow

<img src="./docs/architecture.svg" alt="Market Data architecture diagram" />

Diagram source (editable): `docs/architecture.mmd`

ASCII view (quick scan):

```text
Binance (WS, crypto)  -> BinanceCollector
yfinance-service (stocks) -> YahooCollector (stocks)
yfinance-service (indices+energy) -> FxCommoditiesCollector
RabbitForexAPI (fx+metals) -> RabbitForexCollector

All collectors -> CollectorRegistry -> Normalizer

Normalizer -> Redis (cache+pubsub) -> WebSocket (/ws) + REST (/api/*)
Normalizer -> CandleAggregator -> Postgres (candles)
```

## Data Sources

| Source | Asset Classes | Update Method | Typical cadence |
|--------|--------------|---------------|----------------|
| **Binance** | Crypto | WebSocket | sub-second |
| **yfinance-service** (internal) | Stocks, Indices, Energy commodities | REST polling (batched) | ~15s (configurable) |
| **RabbitForexAPI** (internal) | Forex, Metals | REST polling (batched) | ~1s (configurable) |

Why we do it this way:

- Binance is excellent for free real-time crypto.
- “Yahoo-style” data is useful for equities/indices/commodities, but direct scraping is unreliable at scale. We centralize it behind an internal `yfinance-service` to reduce breakage and concentrate rate limiting/caching.
- Forex + metals are served by RabbitForexAPI because it provides a single snapshot table that updates frequently.

Note: you may still see the field name `sources.yahoo` in code/config. That’s just the **upstream symbol identifier** (the same identifiers used by yfinance/Yahoo). In production we fetch those quotes via `yfinance-service`, not by scraping from every machine.

## Supported Symbols

The source of truth is the symbol registry in `src/config/symbols.ts` and the runtime endpoint `GET /api/symbols`.
Below are a few examples so you know what the format looks like.

### Crypto (via Binance)
BTC/USD, ETH/USD, SOL/USD, BNB/USD, XRP/USD, ADA/USD, DOGE/USD, AVAX/USD, DOT/USD, LINK/USD, MATIC/USD, LTC/USD

### Forex (via RabbitForexAPI)
EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD, USD/CHF, NZD/USD, EUR/GBP, EUR/JPY, GBP/JPY

### Stocks (via yfinance-service)
AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, JPM, V, JNJ, AIR.PA, MC.PA

### Indices (via yfinance-service)
SPX, NDX, DJI, VIX, FTSE, DAX, N225

### Commodities

- Metals (via RabbitForexAPI): XAU/USD, XAG/USD
- Energy (via yfinance-service): WTI, BRENT, NATGAS

## Reliability features (what makes it “enterprise-grade”)

This service is built to keep working even if upstream providers misbehave.

- **Strict tick validation**: drops malformed ticks and rejects timestamps that are too old / too far in the future.
- **Defensive timestamping**: providers that send “stale” timestamps can be safely normalized.
- **Non-overlapping polling**: polling collectors queue/coalesce polls so they don’t pile up under latency.
- **Reconnect jitter + max delay**: avoids thundering-herd reconnect storms.
- **Rate-limit detection/backoff**: especially important for Yahoo-style sources.
- **Circuit breaker**: stops hammering an upstream after repeated failures, then retries after a cooldown.
- **Optional file logging**: can write logs to a file for on-box debugging.

## Quick Start

### Prerequisites
- Bun (repo default) or Node.js 18+
- PostgreSQL (for candle storage)
- Redis (recommended; used for caching + pub/sub)

### Environment Variables

```bash
# Required
DATABASE_URL=postgres://user:pass@localhost:5432/bhc

# Optional
REDIS_URL=redis://localhost:6379
PORT=6000          # HTTP API port
WS_PORT=6060       # WebSocket port (path: /ws)
NODE_ENV=development
LOG_LEVEL=info

# Internal upstream services
YFINANCE_SERVICE_BASE_URL=http://100.100.13.10:8000
RABBITFOREX_BASE_URL=http://100.100.13.10:3000

# Poll cadences
YFINANCE_STOCKS_POLL_INTERVAL_MS=15000
FX_COMMODITIES_POLL_INTERVAL_MS=15000
RABBITFOREX_POLL_INTERVAL_MS=1000

# Optional: also write logs to a file
MARKET_DATA_LOG_FILE_PATH=/var/log/bhc/market-data.log
```

### Running

```bash
# From repo root (recommended)
bun run --filter=@repo/market-data dev

# Or from this package folder
bun run dev
```

## WebSocket quick test (subscribe to a few assets)

The WebSocket server runs on `ws://localhost:6060/ws`.

### Option A: `wscat` (Node tool)

```bash
npx wscat -c ws://localhost:6060/ws -x '{"type":"subscribe","symbols":["BTC/USD","AAPL","EUR/USD","XAU/USD","WTI","SPX"]}'
```

### Option B: `websocat` (single binary)

```bash
printf '%s\n' '{"type":"subscribe","symbols":["BTC/USD","AAPL","EUR/USD","XAU/USD","WTI","SPX"]}' | websocat -E ws://localhost:6060/ws
```

You should see messages like:

- `{"type":"subscribed", ...}`
- `{"type":"tick", "data": { ... } }`

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

Connect to `ws://localhost:6060/ws`

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
bun run --filter=@repo/market-data test

# Integration tests (requires running service)
bun run --filter=@repo/market-data test:integration

# Watch mode
bun run --filter=@repo/market-data test:watch

# Coverage report
bun run --filter=@repo/market-data test:coverage
```

## Project Structure

```
src/
├── config/           # Env config + symbol registry
├── domains/
│   ├── collectors/   # Upstream connectors (Binance / yfinance-service / RabbitForex)
│   ├── normalizer/   # Tick validation + canonical formatting
│   ├── cache/        # Redis price cache + pub/sub
│   ├── historical/   # Candle aggregation + storage
│   ├── stream/       # WebSocket server for clients
│   └── health/       # Health monitoring
├── api/              # REST API routes
├── db/               # Database connection
├── utils/            # Logging + helpers
└── index.ts          # Bootstrap
```

## Key Design Decisions

1. **1-minute candles only in DB**: Higher timeframes are aggregated on-the-fly, reducing storage and maintaining flexibility.

2. **In-memory cache fallback**: Service works without Redis for development, using a Map-based cache.

3. **Circuit breaker pattern**: Collectors automatically back off on failures, preventing cascading issues.

4. **Throttled WebSocket output**: Updates are batched at 250ms intervals to prevent overwhelming clients.

5. **Separate HTTP and WS ports**: Allows independent scaling and simpler load balancing.
