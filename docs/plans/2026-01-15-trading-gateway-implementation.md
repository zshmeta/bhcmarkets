# Trading Gateway Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a secure Trading Gateway in the `backend` service that orchestrates order placement by locking user funds before forwarding orders to the `order-engine`.

**Architecture:**
A Gateway Pattern where `packages/backend` acts as the primary entry point.
1. `TradingService` resolves the correct `Account` and locks funds via `AccountService`.
2. `EngineClient` forwards the validated request to the `order-engine` (internal HTTP).
3. If the engine fails, funds are immediately unlocked.

**Tech Stack:** TypeScript, Node.js (Bun), Drizzle ORM, Native `fetch` for HTTP client.

---

### Task 1: Engine Client & Config

**Files:**
- Create: `packages/backend/src/domains/trading/core/engine.client.ts`
- Modify: `packages/backend/src/config/env.ts` (Add `ORDER_ENGINE_URL`)

**Step 1: Update Environment Configuration**

Add `ORDER_ENGINE_URL` to the environment configuration. Default to `http://localhost:4000`.

**Step 2: Create Engine Client Interface**

Define the interface for interacting with the order engine.

```typescript
// packages/backend/src/domains/trading/core/engine.client.ts

export interface PlaceOrderInput {
  accountId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'GTD';
  clientOrderId?: string;
}

export interface EngineClient {
  placeOrder(input: PlaceOrderInput): Promise<{ success: boolean; orderId?: string; error?: string }>;
  cancelOrder(orderId: string, accountId: string): Promise<{ success: boolean; error?: string }>;
}
```

**Step 3: Implement Engine Client**

Implement the client using `fetch`.

```typescript
import { env } from '../../../config/env.js';

export class HttpEngineClient implements EngineClient {
  private baseUrl: string;

  constructor(baseUrl: string = env.ORDER_ENGINE_URL || 'http://localhost:4000') {
    this.baseUrl = baseUrl;
  }

  async placeOrder(input: PlaceOrderInput) {
    try {
      const res = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Engine unavailable' };
    }
  }

  async cancelOrder(orderId: string, accountId: string) {
    try {
      const res = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Account-ID': accountId,
        },
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Engine unavailable' };
    }
  }
}
```

**Step 4: Commit**
`feat(trading): add engine client`

---

### Task 2: Trading Service (Locking Logic)

**Files:**
- Create: `packages/backend/src/domains/trading/core/trading.service.ts`
- Modify: `packages/backend/src/domains/trading/index.ts` (Export service)

**Step 1: Create Service Skeleton**

Define the `TradingService` class and dependencies (`AccountService`, `EngineClient`).

**Step 2: Implement Helper: `calculateLockAmount`**

This is the critical logic.
- **Buy Limit:** `price * quantity`
- **Buy Market:** `marketPrice * quantity * 1.05` (buffer) or throw error if no market price source (we might need to mock market price for now or fetch from `market-data`). *Decision:* For MVP, we will assume `price` is passed for Market orders as an "estimated price" from UI, or we reject Market orders for now?
*Refined Decision:* To keep it robust, we will require `price` even for market orders as a "cap" or explicitly fetch market price. **Simpler approach for this task:** We will fetch the latest price from `market-data` (if available) or require `estimatedPrice` in input.
*Wait, looking at `order-engine`, it doesn't require price for market orders.*
*Let's assume we use a simplified "Safe Price" provided by client or reject market orders without a `maxPrice` parameter.*
**Actually, let's strictly handle LIMIT orders first and safe defaults for MARKET.**

For **Market Orders**, we will use `market-data` cache if possible. For now, let's implement `LIMIT` orders robustly and `MARKET` orders with a placeholder that assumes a 5% buffer on a passed-in `referencePrice`.

**Step 3: Implement `placeOrder` Flow**

```typescript
async placeOrder(userId: string, input: PlaceOrderInput) {
  // 1. Resolve Symbol & Currency
  // For "BTC/USD":
  //   Buy -> Spend USD (Quote)
  //   Sell -> Spend BTC (Base)
  const [base, quote] = input.symbol.split('/');
  const spendCurrency = input.side === 'buy' ? quote : base;

  // 2. Calculate Lock Amount
  let lockAmount = 0;
  if (input.side === 'sell') {
    lockAmount = input.quantity;
  } else {
    // Buy
    if (input.type === 'limit' || input.type === 'stop_limit') {
      if (!input.price) throw new Error("Price required for limit order");
      lockAmount = input.price * input.quantity;
    } else {
      // Market order - require a reference price or cap
      // For MVP: throw error for Market Buy without explicit logic
      throw new Error("Market Buy not fully supported yet in Gateway (requires price feed)");
    }
  }

  // 3. Get Account & Lock
  const account = await this.accountService.getAccount(userId, spendCurrency);
  await this.accountService.lockFunds({ accountId: account.id, amount: lockAmount.toString() });

  // 4. Send to Engine
  const result = await this.engineClient.placeOrder({ ...input, accountId: account.id });

  // 5. Handle Failure (Revert)
  if (!result.success) {
    await this.accountService.unlockFunds({ accountId: account.id, amount: lockAmount.toString() });
    throw new Error(result.error || "Order placement failed");
  }

  return result;
}
```

**Step 4: Commit**
`feat(trading): implement locking logic in trading service`

---

### Task 3: API Routes Integration

**Files:**
- Modify: `packages/backend/src/domains/trading/routes/trading.routes.ts`

**Step 1: Add POST /orders Handler**

Inject `TradingService` into routes.

```typescript
router.route("POST", "/orders", async (ctx) => {
  const userId = await authenticateRequest(ctx, tokenManager);
  const body = await ctx.req.json(); // verify body parsing

  try {
    const result = await tradingService.placeOrder(userId, body);
    return { status: 201, body: result };
  } catch (err) {
    return { status: 400, body: { error: err.message } };
  }
});
```

**Step 2: Commit**
`feat(trading): expose POST /orders endpoint`

---

### Task 4: Verification (The Integration Test)

**Files:**
- Create: `packages/backend/test/integration/trading-gateway.test.ts`

**Step 1: Write Test Script**

Use `vitest` to run a real flow (mocking the engine fetch if needed, or running engine).
For simplicity, we will mock `EngineClient` in the test to verify *our* logic (locking/unlocking).

Test Cases:
1. **Success:** Funds locked -> Engine called -> Success returned.
2. **Engine Fail:** Funds locked -> Engine fails -> Funds unlocked.
3. **No Funds:** Lock fails -> Engine NEVER called.

**Step 2: Commit**
`test(trading): add integration tests for gateway`
