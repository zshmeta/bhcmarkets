# @repo/backend

Main HTTP API server for BHC Markets trading platform.

## Overview

The backend provides a RESTful API for user authentication, account management, trading operations, and administrative functions. It follows **Domain-Driven Design** principles with explicit dependency injection using factory functions.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Backend API (Port 8080)             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │         HTTP Server (Express-like)         │    │
│  └──────────────────┬─────────────────────────┘    │
│                     │                               │
│         ┌───────────┼───────────┐                   │
│         │           │           │                   │
│    ┌────▼────┐ ┌────▼────┐ ┌───▼────┐              │
│    │  Auth   │ │ Account │ │ Admin  │              │
│    │ Domain  │ │ Domain  │ │ Domain │              │
│    └────┬────┘ └────┬────┘ └───┬────┘              │
│         │           │           │                   │
│         └───────────┼───────────┘                   │
│                     │                               │
│         ┌───────────▼───────────┐                   │
│         │    Service Layer      │                   │
│         │  (Business Logic)     │                   │
│         └───────────┬───────────┘                   │
│                     │                               │
│         ┌───────────▼───────────┐                   │
│         │  Repository Layer     │                   │
│         │  (Data Access)        │                   │
│         └───────────┬───────────┘                   │
│                     │                               │
│    ┌────────────────┼────────────────┐              │
│    │                │                │              │
│ ┌──▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐       │
│ │PostgreSQL│  │Order Engine │  │Market Data │       │
│ └──────────┘  │   Service   │  │  Service   │       │
│               └─────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────┘
```

## Domains

### Auth Domain
- User registration and login
- JWT token management (access + refresh)
- Session management
- Password reset
- Cross-domain authentication (auth codes)

**Routes**: `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, etc.

### Account Domain
- Account creation and management
- Balance queries
- Transaction history
- Account holds

**Routes**: `GET /accounts`, `POST /accounts`, `GET /accounts/:id`

### Admin Domain
- User management (suspend, role changes)
- Account operations (deposits, withdrawals, freeze)
- Risk controls (circuit breakers, limits)
- Order management (cancel, force-close)
- Audit logs and reports

**Routes**: `GET /admin/users`, `POST /admin/accounts/deposit`, `GET /admin/risk/dashboard`, etc.

See [docs/packages/backend-domains/admin-domain.md](../../docs/packages/backend-domains/admin-domain.md) for detailed admin API reference.

## Key Patterns

### Factory Functions with Dependency Injection

Services are created using factory functions that explicitly declare their dependencies:

```typescript
// Service definition
export interface AuthServiceDependencies {
  repository: UserRepository;
  hashPassword: (password: string) => Promise<string>;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  signToken: (payload: object) => Promise<string>;
}

export function createAuthService(deps: AuthServiceDependencies): AuthService {
  return {
    async register(email, password) {
      const hash = await deps.hashPassword(password);
      return deps.repository.createUser(email, hash);
    },
    // ...
  };
}

// Service wiring (in server.ts)
const authService = createAuthService({
  repository: userRepository,
  hashPassword: (pw) => bcrypt.hash(pw, 10),
  verifyPassword: (pw, hash) => bcrypt.compare(pw, hash),
  signToken: (payload) => jwt.sign(payload, SECRET),
});
```

### Barrel Exports

Each domain exposes a single `index.ts` with all public types and factories:

```typescript
// domains/auth/index.ts
export { createAuthService } from './core/auth.service.js';
export type { AuthService, AuthServiceDependencies } from './core/auth.service.js';
export { createUserRepository } from './repositories/user.repository.pg.js';
export type { UserRepository } from './repositories/user.repository.pg.js';
```

### Repository Pattern

Data access is abstracted behind repository interfaces:

```typescript
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  createUser(email: string, passwordHash: string): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
}

// PostgreSQL implementation
export function createUserRepository(db: Database): UserRepository {
  return {
    async findByEmail(email) {
      return db.query.users.findFirst({ where: eq(users.email, email) });
    },
    // ...
  };
}
```

## Quick Start

### Development

```bash
# Install dependencies (from monorepo root)
bun install

# Run database migrations
bun run db:migrate

# Seed admin user and market maker
bun run db:seed

# Start development server with hot reload
bun run dev:backend
```

Server starts at http://localhost:8080

### Production

```bash
# Build TypeScript to JavaScript
bun run build

# Start production server
bun run start
```

## Environment Variables

```bash
# Server
PORT=8080
NODE_ENV=development

# Database (required)
DATABASE_URL=postgresql://user:pass@localhost:5432/bhcmarkets

# Redis (optional, recommended for production)
REDIS_URL=redis://localhost:6379

# JWT Authentication (required in production)
JWT_SECRET=your-strong-256-bit-secret
ACCESS_TTL_SEC=900          # 15 minutes
REFRESH_TTL_SEC=2592000     # 30 days

# Security
BCRYPT_ROUNDS=10
MAX_SESSIONS_PER_USER=10
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Logging
LOG_LEVEL=info  # trace | debug | info | warn | error | fatal
```

## API Endpoints

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/healthz` | Basic health check |
| GET | `/readyz` | Readiness check (includes DB) |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/register` | Register new user |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke current session |
| POST | `/auth/logout-all` | Revoke all user sessions |
| GET | `/auth/sessions` | List active sessions |
| POST | `/auth/code` | Generate auth code (for SSO) |
| POST | `/auth/exchange` | Exchange code for tokens |

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/accounts` | List user's accounts |
| POST | `/accounts` | Create new account |
| GET | `/accounts/:id` | Get account details |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List users |
| POST | `/admin/users/suspend` | Suspend user |
| POST | `/admin/users/unsuspend` | Unsuspend user |
| POST | `/admin/users/role` | Update user role |
| GET | `/admin/accounts` | List all accounts |
| POST | `/admin/accounts/deposit` | Admin deposit |
| POST | `/admin/accounts/withdraw` | Admin withdrawal |
| POST | `/admin/accounts/freeze` | Freeze account |
| POST | `/admin/accounts/unfreeze` | Unfreeze account |
| GET | `/admin/risk/dashboard` | Risk metrics |
| POST | `/admin/risk/circuit-breaker/activate` | Halt trading |
| POST | `/admin/risk/circuit-breaker/deactivate` | Resume trading |

See [API_DOCUMENTATION.md](../../docs/API_DOCUMENTATION.md) for full API reference.

## Authentication

### JWT Token Flow

1. User logs in with email/password
2. Server validates credentials
3. Server issues **access token** (15 min) and **refresh token** (30 days)
4. Client includes access token in `Authorization: Bearer <token>` header
5. When access token expires, client uses refresh token to get new access token
6. Refresh tokens are stored in database and can be revoked

### Protected Routes

Most routes require authentication. Include the access token in the Authorization header:

```bash
curl -H "Authorization: Bearer <access-token>" \
  http://localhost:8080/accounts
```

## Testing

```bash
# Run all tests
bun run test

# Watch mode
bun run test:watch

# Type check
bun run typecheck

# Lint
bun run lint
```

## Project Structure

```
src/
├── index.ts              # Server bootstrap
├── domains/
│   ├── auth/            # Authentication domain
│   │   ├── index.ts     # Barrel export
│   │   ├── core/        # Business logic
│   │   ├── repositories/# Data access
│   │   └── routes/      # HTTP routes
│   ├── account/         # Account domain
│   ├── admin/           # Admin domain
│   └── risk/            # Risk management domain
├── middleware/
│   ├── auth.ts          # JWT verification
│   ├── error.ts         # Error handling
│   └── logger.ts        # Request logging
├── utils/
│   ├── logger.ts        # Pino logger
│   └── validation.ts    # Zod schemas
└── db.ts                # Database connection
```

## Database Seeding

### Admin User

```bash
bun run seed:admin
```

Creates an admin user:
- Email: `admin@bhcmarkets.com`
- Password: `admin123`
- Role: `admin`

### Market Maker

```bash
bun run seed:mm
```

Creates a market maker account with:
- $10M USD balance
- $1M in various crypto assets
- For testing order matching

## Integrations

### Order Engine

The backend communicates with the order engine service for:
- Placing orders
- Canceling orders
- Querying order status

```typescript
// Example: Place order via order engine
const response = await fetch('http://localhost:4003/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accountId,
    symbol: 'BTC/USD',
    side: 'buy',
    type: 'limit',
    quantity: 1,
    price: 50000,
  }),
});
```

### Market Data

Fetches current prices and historical data from the market data service:

```typescript
const prices = await fetch('http://localhost:4001/api/prices').then(r => r.json());
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common error codes:
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `VALIDATION_ERROR` (400)
- `INTERNAL_ERROR` (500)

## Logging

The backend uses [Pino](https://getpino.io/) for structured logging:

```typescript
logger.info({ userId: user.id }, 'User logged in');
logger.error({ err, orderId }, 'Failed to place order');
```

Logs include:
- Request ID
- User ID (if authenticated)
- Timestamp
- Log level
- Message
- Additional context

## Security Best Practices

1. **Always use environment variables** for secrets
2. **Never commit `.env`** files
3. **Use strong JWT secrets** (256-bit minimum)
4. **Enable HTTPS** in production
5. **Validate all inputs** with Zod schemas
6. **Rate limit** sensitive endpoints
7. **Sanitize user inputs** to prevent XSS
8. **Use parameterized queries** to prevent SQL injection

## License

Private - BHC Markets
