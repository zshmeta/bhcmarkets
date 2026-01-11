# @repo/ledger

Double-entry bookkeeping system for BHC Markets.

## Overview

The ledger package provides a robust, ACID-compliant accounting system for managing account balances, holds, and settlements. It follows double-entry accounting principles to ensure balance integrity and complete audit trails.

## Features

- ✅ **Double-Entry Accounting** - Every transaction creates offsetting entries
- ✅ **Available/Held Balance Model** - Separate tracking of available and locked funds
- ✅ **Hold Management** - Lock funds for pending orders and withdrawals
- ✅ **Atomic Trade Settlement** - Simultaneous buyer/seller balance updates
- ✅ **Deposit/Withdrawal** - Fund operations with complete audit trail
- ✅ **Balance History** - Complete ledger of all balance changes
- ✅ **Transaction Safety** - PostgreSQL transactions for atomicity

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Ledger Service                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │            Public API                        │    │
│  │  - deposit()                                 │    │
│  │  - withdraw()                                │    │
│  │  - createHold()                              │    │
│  │  - releaseHold()                             │    │
│  │  - settleTrade()                             │    │
│  │  - getBalance()                              │    │
│  │  - getBalanceHistory()                       │    │
│  └────────────────┬────────────────────────────┘    │
│                   │                                  │
│  ┌────────────────▼────────────────────────────┐    │
│  │         Core Ledger Logic                   │    │
│  │  - Validate operations                      │    │
│  │  - Create ledger entries                    │    │
│  │  - Update balances                          │    │
│  │  - Enforce double-entry rules               │    │
│  └────────────────┬────────────────────────────┘    │
│                   │                                  │
│  ┌────────────────▼────────────────────────────┐    │
│  │         Database Layer                      │    │
│  │  Tables:                                    │    │
│  │  - balances (available, held)               │    │
│  │  - balance_holds (order locks)              │    │
│  │  - ledger_entries (audit trail)             │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
└──────────────────────────────────────────────────────┘
```

## Balance Model

Each account has balances per asset with two components:

```typescript
interface Balance {
  accountId: string;
  asset: string;      // USD, BTC, ETH, etc.
  available: number;  // Funds available for trading
  held: number;       // Funds locked in orders/withdrawals
  updatedAt: Date;
}

// Total balance = available + held
```

### Available Balance
Money that can be used for:
- Placing new orders
- Withdrawals
- Transfers

### Held Balance
Money that is locked for:
- Pending orders (limit/stop orders)
- Pending withdrawals
- System holds

## Core Operations

### 1. Deposit (Credit Balance)

Add funds to an account:

```typescript
import { createLedgerService } from '@repo/ledger';

const ledger = createLedgerService({ db });

await ledger.deposit({
  accountId: 'acc-123',
  asset: 'USD',
  amount: 1000,
  reason: 'bank_deposit',
  referenceId: 'deposit-456',
});

// Creates:
// - Credit ledger entry (+1000 USD)
// - Updates balance (available += 1000)
```

### 2. Withdrawal (Debit Balance)

Remove funds from an account:

```typescript
await ledger.withdraw({
  accountId: 'acc-123',
  asset: 'USD',
  amount: 500,
  reason: 'bank_withdrawal',
  referenceId: 'withdrawal-789',
});

// Creates:
// - Debit ledger entry (-500 USD)
// - Updates balance (available -= 500)
// Throws if insufficient available balance
```

### 3. Create Hold (Lock Funds)

Lock funds for pending operations:

```typescript
// When placing a buy order for $1000
await ledger.createHold({
  accountId: 'acc-123',
  asset: 'USD',
  amount: 1000,
  reason: 'order',
  referenceId: 'order-abc',
});

// Updates balance:
// - available -= 1000
// - held += 1000
// Creates balance_holds record
```

### 4. Release Hold (Unlock Funds)

Release previously locked funds:

```typescript
// When order is cancelled
await ledger.releaseHold({
  accountId: 'acc-123',
  holdId: 'hold-xyz',
});

// Updates balance:
// - available += 1000
// - held -= 1000
// Marks hold as released
```

### 5. Settle Trade (Atomic Exchange)

Execute atomic trade settlement between buyer and seller:

```typescript
await ledger.settleTrade({
  buyerAccountId: 'acc-buyer',
  sellerAccountId: 'acc-seller',
  buyOrderId: 'order-buy',
  sellOrderId: 'order-sell',
  symbol: 'BTC/USD',
  quantity: 0.1,        // BTC
  price: 50000,         // USD
  buyerFee: 5,          // USD
  sellerFee: 0.00005,   // BTC
  tradeId: 'trade-123',
});

// Atomic operations:
// Buyer:
//   - Release hold: 5000 USD (quantity * price)
//   - Debit fee: 5 USD
//   - Credit: 0.1 BTC
// Seller:
//   - Release hold: 0.1 BTC
//   - Debit fee: 0.00005 BTC
//   - Credit: 5000 USD
//
// All in a single database transaction
```

## Query Operations

### Get Balance

```typescript
const balance = await ledger.getBalance({
  accountId: 'acc-123',
  asset: 'USD',
});

// Returns:
// {
//   accountId: 'acc-123',
//   asset: 'USD',
//   available: 9495,   // After trade: 10000 - 500 (withdrawal) - 5 (fee)
//   held: 0,
//   updatedAt: Date
// }
```

### Get All Balances

```typescript
const balances = await ledger.getAllBalances('acc-123');

// Returns array of all non-zero balances:
// [
//   { asset: 'USD', available: 9495, held: 0 },
//   { asset: 'BTC', available: 0.09995, held: 0 }
// ]
```

### Get Balance History

```typescript
const history = await ledger.getBalanceHistory({
  accountId: 'acc-123',
  asset: 'USD',
  limit: 50,
});

// Returns ledger entries:
// [
//   {
//     id: 'entry-1',
//     type: 'credit',
//     amount: 1000,
//     balanceAfter: 1000,
//     reason: 'bank_deposit',
//     referenceId: 'deposit-456',
//     createdAt: Date
//   },
//   {
//     id: 'entry-2',
//     type: 'debit',
//     amount: 500,
//     balanceAfter: 500,
//     reason: 'bank_withdrawal',
//     referenceId: 'withdrawal-789',
//     createdAt: Date
//   },
//   // ...
// ]
```

### Get Active Holds

```typescript
const holds = await ledger.getActiveHolds('acc-123');

// Returns:
// [
//   {
//     id: 'hold-xyz',
//     asset: 'USD',
//     amount: 1000,
//     reason: 'order',
//     referenceId: 'order-abc',
//     createdAt: Date
//   }
// ]
```

## Usage in Order Engine

```typescript
import { createLedgerService } from '@repo/ledger';

// When placing buy order
async function placeBuyOrder(order) {
  const totalCost = order.quantity * order.price;
  
  // 1. Check available balance
  const balance = await ledger.getBalance({
    accountId: order.accountId,
    asset: 'USD',
  });
  
  if (balance.available < totalCost) {
    throw new Error('Insufficient funds');
  }
  
  // 2. Create hold
  await ledger.createHold({
    accountId: order.accountId,
    asset: 'USD',
    amount: totalCost,
    reason: 'order',
    referenceId: order.id,
  });
  
  // 3. Place order in matching engine
  await matchingEngine.addOrder(order);
}

// When order is matched
async function onTrade(trade) {
  // Settle trade atomically
  await ledger.settleTrade({
    buyerAccountId: trade.buyerAccountId,
    sellerAccountId: trade.sellerAccountId,
    buyOrderId: trade.buyOrderId,
    sellOrderId: trade.sellOrderId,
    symbol: trade.symbol,
    quantity: trade.quantity,
    price: trade.price,
    buyerFee: trade.buyerFee,
    sellerFee: trade.sellerFee,
    tradeId: trade.id,
  });
}

// When order is cancelled
async function cancelOrder(order) {
  // Find and release hold
  const holds = await ledger.getActiveHolds(order.accountId);
  const hold = holds.find(h => h.referenceId === order.id);
  
  if (hold) {
    await ledger.releaseHold({
      accountId: order.accountId,
      holdId: hold.id,
    });
  }
}
```

## Error Handling

The ledger service throws descriptive errors:

```typescript
try {
  await ledger.withdraw({
    accountId: 'acc-123',
    asset: 'USD',
    amount: 10000,
  });
} catch (error) {
  if (error.message.includes('Insufficient available balance')) {
    // Handle insufficient funds
  } else if (error.message.includes('Balance not found')) {
    // Handle missing balance record
  } else {
    // Handle other errors
  }
}
```

## Transaction Safety

All balance-modifying operations use database transactions:

```typescript
// Internally, the ledger uses transactions:
await db.transaction(async (tx) => {
  // 1. Create ledger entry
  await tx.insert(ledgerEntries).values({ ... });
  
  // 2. Update balance
  await tx.update(balances)
    .set({ available: sql`available + ${amount}` })
    .where(eq(balances.accountId, accountId));
  
  // 3. Create hold if needed
  if (holdAmount > 0) {
    await tx.insert(balanceHolds).values({ ... });
  }
  
  // If any step fails, entire transaction rolls back
});
```

## Audit Trail

Every balance change is recorded in `ledger_entries`:

```sql
SELECT * FROM ledger_entries
WHERE account_id = 'acc-123'
ORDER BY created_at DESC;
```

This provides:
- Complete history of all balance operations
- Proof of every debit and credit
- Reference to source transactions
- Running balance after each operation

## Testing

```bash
# Run ledger tests
bun run --filter=@repo/ledger test

# Watch mode
bun run --filter=@repo/ledger test:watch
```

## Best Practices

1. **Always use holds for pending operations** - Never directly modify balances for pending orders
2. **Release holds promptly** - When orders are cancelled or filled
3. **Use transactions** - Ensure atomic updates across related tables
4. **Check available balance** - Before creating holds
5. **Handle errors gracefully** - Insufficient balance errors should be expected
6. **Audit regularly** - Verify balance integrity with ledger entries
7. **Never allow negative balances** - The ledger prevents this, but validate upstream too

## License

Private - BHC Markets
