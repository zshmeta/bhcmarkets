# @repo/database

Database schemas, migrations, and seeding for BHC Markets.

## Overview

This package contains:
- **Drizzle ORM schemas** - TypeScript schema definitions
- **Migrations** - SQL migration files
- **Seed scripts** - Test data and initial setup

## Tech Stack

- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: PostgreSQL 15+
- **Migration Tool**: Drizzle Kit
- **Driver**: `pg` (node-postgres)

## Schema Organization

Schemas are organized by domain in `src/schema/`:

```
src/schema/
├── index.ts        # Barrel export
├── core.ts         # Core entities (users, accounts, orders, trades)
├── ledger.ts       # Ledger, balances, holds, entries
├── market.ts       # Prices, candles, symbols
├── risk.ts         # Risk limits, circuit breakers, alerts
└── admin.ts        # Audit logs, admin actions
```

## Database Schema

### Core Tables

**users**
- `id` (UUID, PK)
- `email` (unique)
- `password_hash`
- `role` (user | admin | market_maker)
- `status` (active | suspended)
- `created_at`, `updated_at`

**accounts**
- `id` (UUID, PK)
- `user_id` (FK → users)
- `currency` (USD, EUR, etc.)
- `type` (trading | demo)
- `status` (active | frozen)
- `created_at`, `updated_at`

**orders**
- `id` (UUID, PK)
- `account_id` (FK → accounts)
- `symbol` (BTC/USD, etc.)
- `side` (buy | sell)
- `type` (market | limit | stop | stop_limit)
- `status` (pending | open | filled | cancelled | rejected)
- `quantity`, `price`, `filled_quantity`, `average_price`
- `time_in_force` (GTC | IOC | FOK | GTD)
- `created_at`, `updated_at`, `filled_at`

**trades**
- `id` (UUID, PK)
- `symbol`
- `buy_order_id`, `sell_order_id` (FK → orders)
- `buyer_account_id`, `seller_account_id` (FK → accounts)
- `price`, `quantity`
- `buyer_fee`, `seller_fee`
- `created_at`

**positions**
- `id` (UUID, PK)
- `account_id` (FK → accounts)
- `symbol`
- `side` (long | short)
- `quantity`, `average_entry_price`
- `realized_pnl`, `unrealized_pnl`
- `opened_at`, `updated_at`, `closed_at`

### Ledger Tables

**balances**
- `id` (UUID, PK)
- `account_id` (FK → accounts)
- `asset` (USD, BTC, etc.)
- `available` (available for trading)
- `held` (locked in orders)
- `updated_at`

**balance_holds**
- `id` (UUID, PK)
- `account_id` (FK → accounts)
- `asset`
- `amount`
- `reason` (order | withdrawal | system)
- `reference_id` (order_id, etc.)
- `created_at`, `released_at`

**ledger_entries**
- `id` (UUID, PK)
- `account_id` (FK → accounts)
- `asset`
- `type` (debit | credit)
- `amount`
- `balance_after`
- `reason` (trade | deposit | withdrawal | fee | etc.)
- `reference_id`
- `created_at`

### Market Tables

**prices**
- `id` (SERIAL, PK)
- `symbol`
- `last`, `bid`, `ask`, `mid`, `spread`
- `volume`, `volume_24h`
- `high_24h`, `low_24h`
- `change_24h`, `change_percent_24h`
- `timestamp`

**candles**
- `id` (UUID, PK)
- `symbol`
- `timeframe` (1m, 5m, 15m, 1h, 4h, 1d, 1w)
- `open`, `high`, `low`, `close`, `volume`
- `open_time`, `close_time`

### Risk Tables

**risk_limits**
- `id` (UUID, PK)
- `entity_type` (user | account | symbol | platform)
- `entity_id`
- `limit_type` (max_position | max_order_value | max_daily_volume | etc.)
- `value`
- `created_at`, `updated_at`

**circuit_breakers**
- `id` (UUID, PK)
- `symbol` (or null for platform-wide)
- `status` (active | inactive)
- `reason`
- `activated_by` (FK → users)
- `activated_at`, `deactivated_at`

**risk_alerts**
- `id` (UUID, PK)
- `severity` (low | medium | high | critical)
- `type` (position_limit | price_deviation | etc.)
- `message`
- `entity_type`, `entity_id`
- `acknowledged` (boolean)
- `created_at`, `acknowledged_at`

### Admin Tables

**audit_log**
- `id` (UUID, PK)
- `admin_user_id` (FK → users)
- `action` (suspend_user | freeze_account | etc.)
- `target_type` (user | account | order | etc.)
- `target_id`
- `details` (JSONB)
- `created_at`

## Quick Start

### Generate Migration

After modifying schemas in `src/schema/`:

```bash
bun run db:generate
```

This creates a new migration file in `migrations/`.

### Run Migrations

Apply pending migrations to the database:

```bash
bun run db:migrate
```

### Seed Database

Populate with initial data:

```bash
# From backend package
bun run --filter=@repo/backend db:seed

# Or individual seed scripts
bun run --filter=@repo/backend seed:admin
bun run --filter=@repo/backend seed:mm
```

## Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/bhcmarkets
```

## Usage in Other Packages

Import schemas and database connection:

```typescript
import { db } from '@repo/database';
import { users, accounts, orders } from '@repo/database/schema';
import { eq } from 'drizzle-orm';

// Query users
const user = await db.query.users.findFirst({
  where: eq(users.email, 'user@example.com'),
});

// Insert account
const [account] = await db.insert(accounts).values({
  userId: user.id,
  currency: 'USD',
  type: 'trading',
}).returning();

// Join query
const userAccounts = await db.select()
  .from(accounts)
  .leftJoin(users, eq(accounts.userId, users.id))
  .where(eq(users.id, userId));
```

## Migration Best Practices

1. **Never modify existing migrations** - Always create new ones
2. **Test migrations locally first** - Use a test database
3. **Write reversible migrations** - Include DOWN migrations when possible
4. **Backup before migrating production** - Always have a rollback plan
5. **Use transactions** - Ensure atomicity
6. **Index foreign keys** - Improve query performance
7. **Document schema changes** - Add comments to complex migrations

## Schema Naming Conventions

- **Tables**: Lowercase, plural (e.g., `users`, `accounts`)
- **Columns**: Snake_case (e.g., `user_id`, `created_at`)
- **Foreign keys**: `{table}_id` (e.g., `account_id` references `accounts`)
- **Indexes**: `idx_{table}_{column}` (e.g., `idx_orders_account_id`)
- **Constraints**: `{table}_{column}_{type}` (e.g., `users_email_unique`)

## Indexes

Key indexes for performance:

```sql
-- Orders
CREATE INDEX idx_orders_account_id ON orders(account_id);
CREATE INDEX idx_orders_symbol ON orders(symbol);
CREATE INDEX idx_orders_status ON orders(status);

-- Trades
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_buyer_account_id ON trades(buyer_account_id);
CREATE INDEX idx_trades_seller_account_id ON trades(seller_account_id);

-- Balances
CREATE UNIQUE INDEX idx_balances_account_asset ON balances(account_id, asset);

-- Prices
CREATE UNIQUE INDEX idx_prices_symbol_timestamp ON prices(symbol, timestamp DESC);

-- Candles
CREATE UNIQUE INDEX idx_candles_symbol_timeframe_time ON candles(symbol, timeframe, open_time DESC);
```

## Drizzle Studio

Explore the database visually:

```bash
cd packages/database
bunx drizzle-kit studio
```

Opens a web UI at http://localhost:4983

## TypeScript Types

All tables export TypeScript types:

```typescript
import type { User, Account, Order, Trade } from '@repo/database/schema';

const user: User = {
  id: '123',
  email: 'user@example.com',
  passwordHash: '...',
  role: 'user',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

## License

Private - BHC Markets
