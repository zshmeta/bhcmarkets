# Development Guide

Developer workflow, patterns, and best practices for BHC Markets.

## Table of Contents

- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Development Setup

### Prerequisites

Install required tools:

```bash
# Bun (runtime & package manager)
curl -fsSL https://bun.sh/install | bash

# PostgreSQL 15+
brew install postgresql@15  # macOS
sudo apt install postgresql-15  # Ubuntu

# Redis (optional but recommended)
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu

# Git
brew install git  # macOS
sudo apt install git  # Ubuntu
```

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/zshmeta/bhcmarkets.git
   cd bhcmarkets
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Create database**
   ```bash
   createdb bhcmarkets
   ```

5. **Run migrations**
   ```bash
   bun run db:migrate
   ```

6. **Seed database**
   ```bash
   bun run db:seed
   ```

7. **Start development servers**
   ```bash
   bun run dev
   ```

### Environment Variables

Required `.env` variables:

```bash
# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/bhcmarkets

# JWT Secret (required in production)
JWT_SECRET=your-strong-256-bit-secret

# Redis (optional in dev)
REDIS_URL=redis://localhost:6379

# Node environment
NODE_ENV=development

# Logging
LOG_LEVEL=debug
```

## Development Workflow

### Monorepo Structure

This is a Bun workspace monorepo:

```
bhcmarkets/
├── apps/           # Frontend applications
├── packages/       # Backend services & libraries
├── docs/           # Documentation
└── package.json    # Root workspace config
```

### Running Services

```bash
# Start all services (backend + all apps)
bun run dev

# Start individual services
bun run dev:backend      # Backend API only
bun run dev:platform     # Trading platform only
bun run dev:auth         # Auth portal only
bun run dev:admin        # Admin dashboard only

# Start individual packages
bun run --filter=@repo/order-engine dev
bun run --filter=@repo/market-data dev
```

### Git Workflow

We use **feature branches** with **pull requests**:

1. **Create a feature branch**
   ```bash
   git checkout -b feature/add-stop-loss-orders
   ```

2. **Make changes and commit frequently**
   ```bash
   git add .
   git commit -m "Add stop loss field to order schema"
   ```

3. **Keep branch up to date**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

4. **Push and create pull request**
   ```bash
   git push origin feature/add-stop-loss-orders
   # Create PR on GitHub
   ```

5. **Address review comments**
   ```bash
   # Make changes
   git add .
   git commit -m "Address review comments"
   git push origin feature/add-stop-loss-orders
   ```

6. **Merge after approval**
   ```bash
   # Squash and merge on GitHub
   ```

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test improvements
- `chore/` - Build, dependencies, etc.

Examples:
- `feature/margin-trading`
- `fix/order-matching-bug`
- `refactor/auth-service`
- `docs/api-documentation`

## Coding Standards

### TypeScript

**Use strict mode:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Prefer interfaces over types for objects:**
```typescript
// Good
interface User {
  id: string;
  email: string;
}

// Avoid (unless needed for unions/intersections)
type User = {
  id: string;
  email: string;
};
```

**Use explicit return types for functions:**
```typescript
// Good
function getUser(id: string): Promise<User | null> {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

// Avoid
function getUser(id: string) {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}
```

### Naming Conventions

**Variables & Functions:** camelCase
```typescript
const userId = '123';
function getUserBalance(accountId: string) { }
```

**Classes & Interfaces:** PascalCase
```typescript
class OrderManager { }
interface OrderService { }
```

**Constants:** UPPER_SNAKE_CASE
```typescript
const MAX_ORDERS_PER_ACCOUNT = 1000;
const DEFAULT_FEE_RATE = 0.001;
```

**Files:** kebab-case
```
auth.service.ts
user.repository.ts
order-matching.engine.ts
```

### Code Organization

**Domain-Driven Design:**
```
packages/backend/src/domains/
├── auth/
│   ├── index.ts              # Barrel export
│   ├── core/
│   │   └── auth.service.ts   # Business logic
│   ├── repositories/
│   │   └── user.repository.pg.ts
│   └── routes/
│       └── auth.routes.ts
```

**Barrel Exports:**
```typescript
// domains/auth/index.ts
export { createAuthService } from './core/auth.service.js';
export type { AuthService } from './core/auth.service.js';
export { createUserRepository } from './repositories/user.repository.pg.js';
export type { UserRepository } from './repositories/user.repository.pg.js';
```

**Dependency Injection:**
```typescript
// Service with dependencies
export interface AuthServiceDependencies {
  repository: UserRepository;
  hashPassword: (password: string) => Promise<string>;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
}

export function createAuthService(deps: AuthServiceDependencies): AuthService {
  return {
    async login(email, password) {
      const user = await deps.repository.findByEmail(email);
      if (!user) throw new Error('User not found');
      
      const isValid = await deps.verifyPassword(password, user.passwordHash);
      if (!isValid) throw new Error('Invalid password');
      
      return user;
    },
  };
}
```

### Error Handling

**Use descriptive error messages:**
```typescript
// Good
throw new Error(`Insufficient balance. Available: ${available}, Required: ${required}`);

// Avoid
throw new Error('Insufficient balance');
```

**Create custom error classes:**
```typescript
export class InsufficientBalanceError extends Error {
  constructor(
    public available: number,
    public required: number,
  ) {
    super(`Insufficient balance. Available: ${available}, Required: ${required}`);
    this.name = 'InsufficientBalanceError';
  }
}
```

**Catch specific errors:**
```typescript
try {
  await placeOrder(order);
} catch (error) {
  if (error instanceof InsufficientBalanceError) {
    return { error: 'INSUFFICIENT_FUNDS', message: error.message };
  } else if (error instanceof ValidationError) {
    return { error: 'VALIDATION_ERROR', message: error.message };
  } else {
    logger.error('Unexpected error', error);
    return { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' };
  }
}
```

### Comments

**Write self-documenting code:**
```typescript
// Good - Code explains itself
function calculateTotalFee(quantity: number, price: number, feeRate: number): number {
  return quantity * price * feeRate;
}

// Avoid - Redundant comment
// Calculate the total fee
function calc(q, p, f) {
  return q * p * f;
}
```

**Use JSDoc for public APIs:**
```typescript
/**
 * Places a new order in the order book.
 * 
 * @param order - The order to place
 * @returns The placed order with status
 * @throws {InsufficientBalanceError} If account has insufficient balance
 * @throws {ValidationError} If order parameters are invalid
 */
export async function placeOrder(order: Order): Promise<OrderResult> {
  // ...
}
```

**Explain complex logic:**
```typescript
// Calculate fee with volume-based discounts
// Tier 1: < $100k/month = 0.15%
// Tier 2: $100k-$1M/month = 0.10%
// Tier 3: > $1M/month = 0.05%
const feeRate = volumeLastMonth < 100_000
  ? 0.0015
  : volumeLastMonth < 1_000_000
  ? 0.0010
  : 0.0005;
```

## Testing

### Unit Tests

Write unit tests for business logic:

```typescript
// auth.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let mockRepository: UserRepository;

  beforeEach(() => {
    mockRepository = {
      findByEmail: vi.fn(),
      createUser: vi.fn(),
    };

    authService = createAuthService({
      repository: mockRepository,
      hashPassword: (pw) => Promise.resolve(`hashed_${pw}`),
      verifyPassword: (pw, hash) => Promise.resolve(hash === `hashed_${pw}`),
    });
  });

  it('should login user with valid credentials', async () => {
    mockRepository.findByEmail.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      passwordHash: 'hashed_password123',
    });

    const user = await authService.login('test@example.com', 'password123');

    expect(user.id).toBe('1');
    expect(user.email).toBe('test@example.com');
  });

  it('should throw error with invalid password', async () => {
    mockRepository.findByEmail.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      passwordHash: 'hashed_correctpassword',
    });

    await expect(
      authService.login('test@example.com', 'wrongpassword')
    ).rejects.toThrow('Invalid password');
  });
});
```

### Integration Tests

Test full flows with database:

```typescript
// order.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@repo/database';
import { createOrderService } from './order.service';

describe('Order Service Integration', () => {
  let orderService: OrderService;

  beforeAll(async () => {
    // Set up test database
    await db.migrate();
    orderService = createOrderService({ db });
  });

  afterAll(async () => {
    // Clean up
    await db.delete(orders).execute();
  });

  it('should place and fill market order', async () => {
    // Create buy and sell orders
    const buyOrder = await orderService.placeOrder({
      accountId: 'buyer-123',
      symbol: 'BTC/USD',
      side: 'buy',
      type: 'market',
      quantity: 1,
    });

    const sellOrder = await orderService.placeOrder({
      accountId: 'seller-456',
      symbol: 'BTC/USD',
      side: 'sell',
      type: 'limit',
      quantity: 1,
      price: 50000,
    });

    // Verify orders matched
    expect(buyOrder.status).toBe('filled');
    expect(sellOrder.status).toBe('filled');
  });
});
```

### Running Tests

```bash
# Run all tests
bun run test

# Run tests for specific package
bun run --filter=@repo/backend test

# Watch mode
bun run test:watch

# Coverage
bun run test -- --coverage

# Integration tests only
bun run test:integration
```

## Debugging

### Backend Debugging

**Console logging:**
```typescript
import { logger } from '../utils/logger';

logger.debug({ userId, orderId }, 'Processing order');
logger.info('Order placed successfully');
logger.error({ err }, 'Failed to place order');
```

**Debugger:**
```typescript
// Add debugger statement
function placeOrder(order: Order) {
  debugger;  // Execution will pause here
  // ...
}

// Run with inspector
bun --inspect src/index.ts
```

### Frontend Debugging

**React DevTools:**
```bash
npm install -g react-devtools
react-devtools
```

**Console logging:**
```typescript
console.log('Order placed:', order);
console.error('Failed to place order:', error);
```

**Network inspection:**
- Open browser DevTools (F12)
- Go to Network tab
- Filter by XHR/Fetch
- Inspect request/response

### Database Debugging

**View query logs:**
```typescript
// Enable query logging in Drizzle
const db = drizzle(pool, {
  schema,
  logger: true,  // Log all SQL queries
});
```

**Manual queries:**
```bash
# Connect to database
psql -d bhcmarkets

# View orders
SELECT * FROM orders WHERE account_id = 'acc-123';

# View balances
SELECT * FROM balances WHERE account_id = 'acc-123';
```

## Common Tasks

### Adding a New API Endpoint

1. **Define route:**
   ```typescript
   // packages/backend/src/domains/account/routes/account.routes.ts
   router.get('/accounts/:id/transactions', async (req, res) => {
     const { id } = req.params;
     const transactions = await accountService.getTransactions(id);
     res.json({ success: true, data: transactions });
   });
   ```

2. **Add service method:**
   ```typescript
   // packages/backend/src/domains/account/core/account.service.ts
   async getTransactions(accountId: string): Promise<Transaction[]> {
     return this.repository.findTransactions(accountId);
   }
   ```

3. **Add repository method:**
   ```typescript
   // packages/backend/src/domains/account/repositories/account.repository.pg.ts
   async findTransactions(accountId: string): Promise<Transaction[]> {
     return db.select().from(transactions)
       .where(eq(transactions.accountId, accountId))
       .orderBy(desc(transactions.createdAt));
   }
   ```

4. **Add tests:**
   ```typescript
   it('should get account transactions', async () => {
     const txs = await accountService.getTransactions('acc-123');
     expect(txs).toHaveLength(2);
   });
   ```

### Adding a New Database Table

1. **Define schema:**
   ```typescript
   // packages/database/src/schema/core.ts
   export const withdrawals = pgTable('withdrawals', {
     id: uuid('id').primaryKey().defaultRandom(),
     accountId: uuid('account_id').notNull().references(() => accounts.id),
     asset: varchar('asset', { length: 10 }).notNull(),
     amount: numeric('amount', { precision: 20, scale: 8 }).notNull(),
     status: varchar('status', { length: 20 }).notNull(),
     createdAt: timestamp('created_at').notNull().defaultNow(),
   });
   ```

2. **Generate migration:**
   ```bash
   bun run db:generate
   ```

3. **Review migration file:**
   ```sql
   -- migrations/0001_add_withdrawals.sql
   CREATE TABLE withdrawals (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     account_id UUID NOT NULL REFERENCES accounts(id),
     asset VARCHAR(10) NOT NULL,
     amount NUMERIC(20, 8) NOT NULL,
     status VARCHAR(20) NOT NULL,
     created_at TIMESTAMP NOT NULL DEFAULT NOW()
   );
   ```

4. **Run migration:**
   ```bash
   bun run db:migrate
   ```

### Adding a New Frontend Component

1. **Create component:**
   ```typescript
   // apps/platform/src/components/WithdrawalForm/WithdrawalForm.tsx
   import { useState } from 'react';

   export function WithdrawalForm() {
     const [amount, setAmount] = useState('');

     const handleSubmit = async (e: FormEvent) => {
       e.preventDefault();
       // Handle withdrawal
     };

     return (
       <form onSubmit={handleSubmit}>
         <input
           type="number"
           value={amount}
           onChange={(e) => setAmount(e.target.value)}
         />
         <button type="submit">Withdraw</button>
       </form>
     );
   }
   ```

2. **Add styles:**
   ```typescript
   import styled from 'styled-components';

   const StyledForm = styled.form`
     display: flex;
     flex-direction: column;
     gap: 1rem;
   `;
   ```

3. **Use in page:**
   ```typescript
   // apps/platform/src/pages/Wallet/WalletPage.tsx
   import { WithdrawalForm } from '../../components/WithdrawalForm';

   export function WalletPage() {
     return (
       <div>
         <h1>Wallet</h1>
         <WithdrawalForm />
       </div>
     );
   }
   ```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
ps aux | grep postgres

# Start PostgreSQL
brew services start postgresql@15  # macOS
sudo systemctl start postgresql  # Ubuntu

# Test connection
psql -d bhcmarkets
```

### Port Already in Use

```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>
```

### TypeScript Errors

```bash
# Clear build cache
rm -rf node_modules/.cache
rm -rf dist

# Reinstall dependencies
rm -rf node_modules
bun install

# Type check
bun run typecheck
```

### Build Failures

```bash
# Clean all build artifacts
bun run clean

# Reinstall dependencies
bun install

# Build from scratch
bun run build
```

## License

Private - BHC Markets
