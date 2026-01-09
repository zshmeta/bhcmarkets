# BHC Markets - Copilot Instructions

## Project Overview

BHC Markets is a full-stack trading platform monorepo built with Bun, TypeScript, React, and PostgreSQL. It provides crypto, forex, stocks, and commodities trading with real-time order matching.

## Architecture

### Monorepo Structure

```
apps/           → Frontend applications (React + Vite)
  auth/         → Authentication portal (port 5173)
  platform/     → Trading terminal (port 5174)
  admin/        → Admin dashboard
  mobile/       → Expo React Native app
  web/          → Marketing/landing site

packages/       → Shared backend services and libraries
  backend/      → Main HTTP API server (port 8080)
  order-engine/ → Order matching engine (REST: 4003, WS: 4004)
  market-data/  → Market data service (REST: 4001, WS: 4002)
  database/     → Drizzle ORM schemas and migrations
  ledger/       → Double-entry bookkeeping (balances, holds, settlements)
  trading-ui/   → Trading terminal React components
  ui/           → Shared design system components
  types/        → Shared TypeScript types
  email-worker/ → Cloudflare Worker for transactional emails
```

### Service Ports

| Service      | HTTP | WebSocket |
| ------------ | ---- | --------- |
| Backend API  | 8080 | -         |
| Order Engine | 4003 | 4004      |
| Market Data  | 4001 | 4002      |

### Data Flow

```
Frontend Apps → Backend API (auth/accounts/orders/positions) → PostgreSQL
             → Order Engine (orders via :4003) → Matching Engine → Ledger → PostgreSQL
             → Market Data WS (:4002/ws) → Binance/Yahoo → Redis cache
```

## Development Commands

```bash
# Start full platform (backend + all apps)
bun run dev

# Individual services
bun run dev:backend    # API on :8080
bun run dev:platform   # Trading terminal on :5174
bun run dev:auth       # Auth portal on :5173

# Database
bun run db:generate    # Generate Drizzle migrations
bun run db:migrate     # Run migrations
bun run db:seed        # Seed admin + market maker

# Testing & Quality
bun run test           # Run all tests
bun run typecheck      # Type check all packages
bun run lint           # ESLint all packages
bun run format         # Prettier format
```

## Environment Setup

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong secret for JWT signing (required in production)
- `REDIS_URL` - Optional in dev, recommended in production

## Key Patterns

### Domain-Driven Design (Backend)

Backend packages use **factory functions** for services with explicit dependency injection:

```typescript
// Pattern: packages/backend/src/domains/{domain}/index.ts
import { createAuthService, createUserRepository } from "./domains/auth";
import { createAccountService, createAccountRepository } from "./domains/account";
import { createRiskService, createRiskRepository } from "./domains/risk";

// Services are wired in server.ts with explicit dependencies
const riskService = createRiskService({
  repository: riskRepository,
  getAvailableBalance: (id) => accountService.getAvailableBalance(id),
  getUserPosition: (id, symbol) => /* ... */,
});
```

### Barrel Exports

Each domain exposes a single `index.ts` with all public types and factories:

```typescript
// packages/backend/src/domains/auth/index.ts
export { createAuthService } from "./core/auth.service.js";
export type { AuthService, AuthServiceDependencies } from "./core/auth.service.js";
export { createUserRepository } from "./repositories/repositories.pg.js";
```

### Ledger (Double-Entry Bookkeeping)

The `@repo/ledger` package manages all balance operations:

```typescript
import { createLedgerService } from '@repo/ledger';

// Balance holds for pending orders, atomic trade settlement
await ledger.createHold({ accountId, asset: 'USD', amount: 1000, orderId });
await ledger.settleTrade({ buyerAccountId, sellerAccountId, ... });
```

### Database Schema

Schemas live in `packages/database/src/schema/` with Drizzle ORM:

- `core.ts` - users, accounts, orders, trades, positions
- `ledger.ts` - balances, holds, ledger entries
- `market.ts` - prices, candles
- `risk.ts` - limits, circuit breakers
- `admin.ts` - audit log

### Bun Workspaces with Catalog

Dependencies use `catalog:` protocol in package.json for centralized version management:

```json
// Root package.json defines versions in catalog
"dependencies": {
  "drizzle-orm": "catalog:",
  "react": "catalog:"
}
```

## Trading Engine

Order matching uses **price-time priority**:

- Market orders execute immediately at best price
- Limit orders add to book if not filled
- Stop orders trigger when price crosses threshold

Time-in-force options: GTC, IOC, FOK, GTD

## WebSocket Protocols

### Market Data (port 4002, path: /ws)

```json
// Subscribe: { "type": "subscribe", "symbols": ["BTC/USD"] }
// Server tick: { "type": "tick", "data": { "symbol": "BTC/USD", "last": 50000, ... } }
```

### Order Engine (port 4004, path: /ws)

Real-time order book updates and trade notifications.

## Testing

- Unit tests: `vitest` (colocated as `*.test.ts`)
- Integration tests: `vitest.integration.config.ts` where applicable
- Test files live alongside source files

## Frontend Conventions

### Trading UI Components

`@repo/trading-ui` provides professional trading components:

- `OrderBook` - Market depth bid/ask
- `TradingChart` - Candlestick charts
- `OrderForm` - Order entry with SL/TP
- `PositionsTable` - Open positions

### Theming

Apps use `styled-components` with centralized theme from `@repo/ui`:

```typescript
import { ThemeProvider } from "styled-components";
import { tradingTheme } from "@repo/trading-ui";
```

## API Reference

See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for endpoint details.

Key base URLs:

- Backend API: `http://localhost:8080`
- Order Engine REST: `http://localhost:4003`
- Order Engine WS: `ws://localhost:4004`
- Market Data WS: `ws://localhost:4002`
