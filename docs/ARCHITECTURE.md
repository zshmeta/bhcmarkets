# Architecture

Technical architecture and design patterns for BHC Markets trading platform.

## Table of Contents

- [System Overview](#system-overview)
- [Microservices Architecture](#microservices-architecture)
- [Data Flow](#data-flow)
- [Database Design](#database-design)
- [Security Architecture](#security-architecture)
- [Scalability & Performance](#scalability--performance)
- [Deployment Architecture](#deployment-architecture)

## System Overview

BHC Markets is a distributed trading platform built as a Bun monorepo with multiple services and applications.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   Auth   │  │ Platform │  │  Admin   │  │   Web    │        │
│  │  Portal  │  │ Terminal │  │Dashboard │  │  Site    │        │
│  │  :5173   │  │  :5174   │  │  :5175   │  │  :5176   │        │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘        │
│        │             │             │             │              │
└────────┼─────────────┼─────────────┼─────────────┼──────────────┘
         │             │             │             │
         └─────────────┼─────────────┼─────────────┘
                       │             │
┌──────────────────────┼─────────────┼──────────────────────────┐
│                      │             │   API LAYER              │
├──────────────────────┼─────────────┼──────────────────────────┤
│                      ▼             ▼                          │
│             ┌─────────────────────────────┐                   │
│             │    Backend API (:8080)      │                   │
│             │  - Auth & Sessions          │                   │
│             │  - Account Management       │                   │
│             │  - Admin Operations         │                   │
│             └──────────┬──────────────────┘                   │
│                        │                                       │
└────────────────────────┼───────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────▼────────┐ ┌────▼──────┐ ┌─────▼────────┐
│ Order Engine    │ │Market Data│ │Email Worker  │
│ REST: :4003     │ │REST: :4001│ │(Cloudflare)  │
│ WS:   :4004     │ │WS:  :4002 │ │              │
└────────┬────────┘ └────┬──────┘ └──────────────┘
         │               │
┌────────┼───────────────┼────────────────────────────────────┐
│        │   DATA LAYER  │                                    │
├────────┼───────────────┼────────────────────────────────────┤
│        │               │                                    │
│  ┌─────▼──────┐  ┌─────▼──────┐  ┌──────────────┐          │
│  │ PostgreSQL │  │   Redis    │  │   Binance    │          │
│  │  (Primary  │  │  (Cache &  │  │Yahoo Finance │          │
│  │   Data)    │  │  Pub/Sub)  │  │(External APIs)          │
│  └────────────┘  └────────────┘  └──────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Microservices Architecture

### Backend API (Port 8080)

**Responsibilities:**
- User authentication & authorization
- Account management
- Admin operations
- Orchestration layer for other services

**Tech Stack:**
- Runtime: Bun
- Framework: Custom HTTP server
- ORM: Drizzle
- Database: PostgreSQL
- Cache: Redis (optional)

**Domains:**
- Auth: User authentication, JWT management
- Account: Account CRUD, balance queries
- Admin: User management, audit logs
- Risk: Risk limits, circuit breakers

### Order Engine (Ports 4003/4004)

**Responsibilities:**
- Order validation and placement
- Order matching with price-time priority
- Order book management
- Trade execution and settlement
- Position tracking

**Tech Stack:**
- Runtime: Bun
- In-memory order books per symbol
- WebSocket server for real-time updates
- PostgreSQL for persistence
- Redis for pub/sub (optional)

**Key Components:**
- **Order Manager**: Validates and persists orders
- **Matching Engine**: Price-time priority algorithm
- **Trade Processor**: Executes trades, calculates fees
- **Position Manager**: Tracks open positions
- **Ledger Service**: Double-entry accounting

### Market Data Service (Ports 4001/4002)

**Responsibilities:**
- Collect real-time price data from external sources
- Normalize and enrich price ticks
- Aggregate candles (OHLCV)
- WebSocket streaming to clients
- Price caching

**Tech Stack:**
- Runtime: Bun
- Data sources: Binance (WebSocket), Yahoo Finance (polling)
- Redis for price cache
- PostgreSQL for candle storage
- WebSocket server for clients

**Data Flow:**
1. Collectors gather data from Binance/Yahoo
2. Normalizer enriches ticks with metadata
3. Cache stores latest prices in Redis
4. Aggregator creates 1-minute candles
5. Publisher broadcasts to WebSocket clients

### Email Worker (Cloudflare Workers)

**Responsibilities:**
- Send transactional emails
- Support multiple providers (Resend, SendGrid, etc.)
- Email templates for different events

**Tech Stack:**
- Runtime: Cloudflare Workers
- Email providers: Resend, SendGrid, Mailgun, Postmark
- Serverless, globally distributed

## Data Flow

### Order Placement Flow

```
1. User submits order in Platform app
   │
   ▼
2. Platform sends POST /orders to Order Engine (:4003)
   │
   ▼
3. Order Engine validates order
   - Check account exists
   - Validate order params
   - Rate limiting
   │
   ▼
4. Risk service performs pre-trade checks
   - Available balance
   - Position limits
   - Order limits
   - Price deviation
   │
   ▼
5. Ledger creates hold on funds
   - Lock required funds
   - Update available/held balance
   │
   ▼
6. Order Manager persists order to DB
   │
   ▼
7. Matching Engine adds order to in-memory book
   │
   ▼
8. Matching Engine attempts to match order
   │
   ├─ No match found
   │  └─> Order stays in book as "open"
   │
   └─ Match found
      ├─> Trade Processor executes trade
      ├─> Ledger settles trade (buyer/seller)
      ├─> Position Manager updates positions
      ├─> Trade persisted to DB
      └─> WebSocket broadcasts trade/order updates
   │
   ▼
9. Response returned to Platform app
   - Order ID
   - Status (filled/open/rejected)
   - Fill details (if matched)
```

### Market Data Flow

```
1. Binance WebSocket emits BTC/USDT tick
   │
   ▼
2. Binance Collector receives and normalizes
   - Convert USDT to USD
   - Add symbol metadata
   │
   ▼
3. Collector Registry broadcasts to subscribers
   │
   ├─> Redis cache (latest price)
   ├─> Candle Aggregator (OHLCV)
   └─> WebSocket Publisher (clients)
   │
   ▼
4. Platform app receives tick via WebSocket
   - Update chart
   - Update order book
   - Recalculate position P&L
```

### Authentication Flow

```
1. User logs in at Auth Portal
   │
   ▼
2. Auth Portal → POST /auth/login (Backend API)
   │
   ▼
3. Backend validates credentials
   - bcrypt password verification
   - Check account status
   │
   ▼
4. Backend generates tokens
   - Access token (15 min, JWT)
   - Refresh token (30 days, stored in DB)
   │
   ▼
5. Backend generates auth code for SSO
   │
   ▼
6. Auth Portal redirects to Platform with code
   → https://platform.bhc.com/callback?code=abc123
   │
   ▼
7. Platform → POST /auth/exchange { code }
   │
   ▼
8. Backend validates code, returns tokens
   │
   ▼
9. Platform stores tokens, loads user data
```

## Database Design

### Schema Organization

```
schema/
├── core.ts       # Users, accounts, orders, trades, positions
├── ledger.ts     # Balances, holds, ledger entries
├── market.ts     # Prices, candles, symbols
├── risk.ts       # Limits, circuit breakers, alerts
└── admin.ts      # Audit logs
```

### Key Tables

**users**
- Primary authentication table
- Role-based access control

**accounts**
- One-to-many with users
- Separate trading and demo accounts

**orders**
- All order types (market, limit, stop)
- Tracks order lifecycle

**trades**
- Matched trades between buyers/sellers
- References both orders

**positions**
- Aggregated view of open trades
- Tracks P&L

**balances**
- Available + held balance model
- One row per account-asset pair

**ledger_entries**
- Complete audit trail
- Every balance change recorded

### Indexing Strategy

Critical indexes for performance:

```sql
-- Orders
CREATE INDEX idx_orders_account_id ON orders(account_id);
CREATE INDEX idx_orders_symbol_status ON orders(symbol, status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Trades
CREATE INDEX idx_trades_symbol_created ON trades(symbol, created_at DESC);

-- Balances
CREATE UNIQUE INDEX idx_balances_account_asset ON balances(account_id, asset);

-- Candles
CREATE UNIQUE INDEX idx_candles_symbol_tf_time 
  ON candles(symbol, timeframe, open_time DESC);
```

## Security Architecture

### Authentication & Authorization

**JWT-Based Authentication:**
- Access tokens: Short-lived (15 min), stateless
- Refresh tokens: Long-lived (30 days), stored in DB
- Tokens include: user ID, email, role

**Role-Based Access Control (RBAC):**
- Roles: `user`, `admin`, `market_maker`
- Permissions checked at route level
- Admin routes require `admin` role

### Password Security

- Bcrypt hashing (10 rounds)
- Minimum 8 characters
- Complexity requirements enforced

### API Security

**Rate Limiting:**
- Order placement: 10 orders/sec per account
- API calls: 100 requests/min per IP
- Admin operations: 30 requests/min per admin

**CORS:**
- Whitelist allowed origins
- No credentials on public endpoints

**Input Validation:**
- Zod schemas for all inputs
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized outputs)

### Network Security

**HTTPS Only:**
- TLS 1.3 in production
- HSTS headers
- Certificate pinning (mobile apps)

**WebSocket Security:**
- Authentication required for private channels
- Origin validation
- Rate limiting per connection

## Scalability & Performance

### Horizontal Scaling

**Backend API:**
- Stateless design (JWT auth)
- Scale with load balancer
- Sticky sessions not required

**Order Engine:**
- One order book per symbol
- Can shard by symbol across instances
- Event sourcing for recovery

**Market Data:**
- Read replicas for historical data
- CDN for static content
- Redis cluster for cache

### Caching Strategy

**Redis Cache:**
- Latest prices: 5-second TTL
- User sessions: 15-minute TTL
- Order books: No TTL (pub/sub)

**Browser Cache:**
- Static assets: 1 year
- API responses: No cache (fresh data)

### Database Optimization

**Connection Pooling:**
- Max 20 connections per service
- 5-second idle timeout

**Query Optimization:**
- Indexes on foreign keys
- Composite indexes for common queries
- Avoid N+1 queries (use joins)

**Read Replicas:**
- Reports and analytics on replica
- Write operations on primary

### WebSocket Optimization

**Message Batching:**
- Batch order book updates (100ms window)
- Batch trade broadcasts

**Subscription Management:**
- Unsubscribe from inactive symbols
- Limit max subscriptions per client (50)

## Deployment Architecture

### Development Environment

```
Developer Machine
├── All services run locally
├── PostgreSQL (Docker or local)
├── Redis (Docker or local, optional)
└── External APIs (Binance, Yahoo)
```

### Production Environment

```
┌─────────────────────────────────────────────────────────┐
│                     Load Balancer                        │
│                    (Cloudflare / AWS)                    │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼───┐  ┌────▼───┐  ┌────▼───┐
    │Backend │  │Backend │  │Backend │
    │API (1) │  │API (2) │  │API (N) │
    └────┬───┘  └────┬───┘  └────┬───┘
         │            │            │
         └────────────┼────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼─────┐  ┌──▼──────┐  ┌──▼────────┐
    │ Order    │  │ Market  │  │PostgreSQL │
    │ Engine   │  │  Data   │  │ Cluster   │
    └──────────┘  └─────────┘  └───────────┘
                                     │
                                ┌────▼────┐
                                │  Redis  │
                                │ Cluster │
                                └─────────┘
```

### Containerization

**Docker Compose (Development):**
```yaml
services:
  postgres:
    image: postgres:15
  redis:
    image: redis:7
  backend:
    build: ./packages/backend
  order-engine:
    build: ./packages/order-engine
  market-data:
    build: ./packages/market-data
```

**Kubernetes (Production):**
- Deployments for each service
- StatefulSets for databases
- Horizontal Pod Autoscaling
- Ingress for routing

### CI/CD Pipeline

```
1. Git Push
   ↓
2. GitHub Actions Triggered
   ↓
3. Run Tests (unit, integration)
   ↓
4. Lint & Type Check
   ↓
5. Build Docker Images
   ↓
6. Push to Registry (ECR/GCR)
   ↓
7. Deploy to Staging
   ↓
8. Smoke Tests
   ↓
9. Manual Approval
   ↓
10. Deploy to Production
    ↓
11. Health Checks
```

## Monitoring & Observability

### Logging

**Structured Logging (Pino):**
```json
{
  "level": "info",
  "time": 1704067200000,
  "pid": 12345,
  "hostname": "api-1",
  "userId": "user-123",
  "orderId": "order-456",
  "msg": "Order placed successfully"
}
```

**Log Aggregation:**
- Collect logs from all services
- Centralized in CloudWatch/Datadog
- Searchable by user, order, trade

### Metrics

**Application Metrics:**
- Order placement rate
- Order fill rate
- Trade volume
- Active users
- API response times

**System Metrics:**
- CPU usage
- Memory usage
- Disk I/O
- Network traffic

**Business Metrics:**
- Trading volume (daily, monthly)
- User registrations
- Deposit/withdrawal volume
- Fee revenue

### Alerts

**Critical Alerts:**
- Service downtime
- Database connection failures
- Order matching delays > 1s
- Balance inconsistencies

**Warning Alerts:**
- High error rates (> 1%)
- Slow API responses (> 500ms)
- Low disk space (< 20%)
- High memory usage (> 80%)

## Disaster Recovery

### Backup Strategy

**Database Backups:**
- Full backup: Daily at 2 AM UTC
- Incremental: Every 6 hours
- Retention: 30 days
- Offsite storage: S3 / Cloud Storage

**Point-in-Time Recovery:**
- PostgreSQL WAL archiving
- Can restore to any point in last 7 days

### Failover Strategy

**Database:**
- Primary-replica setup
- Automatic failover (< 30 seconds)
- Read replicas for load distribution

**Services:**
- Multi-AZ deployment
- Health checks every 10 seconds
- Auto-restart on failure

## License

Private - BHC Markets
