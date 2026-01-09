# BHC Markets

> Enterprise-grade trading platform for crypto, forex, stocks, and commodities

BHC Markets is a full-stack, production-ready trading platform built with modern web technologies. It features real-time order matching, professional trading tools, and comprehensive risk management.

## ✨ Features

- **Multi-Asset Trading**: Crypto, forex, stocks, commodities, and indices
- **Real-Time Order Matching**: Price-time priority matching engine with sub-millisecond latency
- **Professional Trading Terminal**: Advanced charts, order book, position management
- **Risk Management**: Pre-trade checks, position limits, circuit breakers
- **Double-Entry Ledger**: Accurate balance tracking with holds and settlements
- **Live Market Data**: Real-time price feeds from Binance and Yahoo Finance
- **WebSocket Streaming**: Real-time order updates, trades, and market data
- **Admin Dashboard**: User management, risk controls, audit logs

## 🏗️ Architecture

This is a **Bun monorepo** using workspaces with:

### Frontend Applications (React + Vite)

```
apps/
├── platform/    → Trading terminal (port 5174)
├── auth/        → Authentication portal (port 5173)
├── admin/       → Admin dashboard (port 5175)
├── web/         → Marketing/landing site
└── mobile/      → React Native mobile app (Expo)
```

### Backend Services & Libraries

```
packages/
├── backend/      → Main HTTP API (port 8080)
├── order-engine/ → Order matching engine (REST: 4003, WS: 4004)
├── market-data/  → Market data service (REST: 4001, WS: 4002)
├── database/     → Drizzle ORM schemas and migrations
├── ledger/       → Double-entry bookkeeping system
├── trading-ui/   → Trading terminal React components
├── ui/           → Shared design system components
├── types/        → Shared TypeScript types
└── email-worker/ → Cloudflare Worker for transactional emails
```

### Tech Stack

- **Runtime**: Bun 1.3.5
- **Language**: TypeScript 5.9
- **Frontend**: React 19, Vite 7, styled-components
- **Backend**: Node.js, Drizzle ORM
- **Database**: PostgreSQL
- **Cache**: Redis (optional in dev)
- **Real-time**: WebSocket (ws, Socket.IO)
- **Testing**: Vitest
- **Linting**: ESLint 9

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) 1.3.5+ (runtime & package manager)
- [PostgreSQL](https://www.postgresql.org/) 15+
- [Redis](https://redis.io/) 7+ (optional in development)

### Installation

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
   # Edit .env with your database credentials
   ```

4. **Initialize database**
   ```bash
   bun run db:migrate   # Run migrations
   bun run db:seed      # Seed admin user & market maker
   ```

5. **Start development servers**
   ```bash
   bun run dev          # Starts all services and apps
   ```

   This command starts:
   - Backend API → http://localhost:8080
   - Order Engine → http://localhost:4003 (WS: 4004)
   - Market Data → http://localhost:4001 (WS: 4002)
   - Auth Portal → http://localhost:5173
   - Trading Platform → http://localhost:5174

### Default Credentials

After seeding, you can log in with:

- **Admin**: `admin@bhcmarkets.com` / `admin123`
- **Market Maker**: `mm@bhcmarkets.com` / `mm123`

## 📖 Documentation

- [API Documentation](./docs/API_DOCUMENTATION.md) - REST API reference
- [Architecture Guide](./docs/ARCHITECTURE.md) - System design and data flow
- [Development Guide](./docs/DEVELOPMENT.md) - Developer workflow and patterns
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- [Contributing Guide](./docs/CONTRIBUTING.md) - How to contribute

### Package Documentation

- [@repo/backend](./packages/backend/README.md) - HTTP API server
- [@repo/order-engine](./packages/order-engine/README.md) - Order matching engine
- [@repo/market-data](./packages/market-data/README.md) - Market data service
- [@repo/database](./packages/database/README.md) - Database schemas
- [@repo/ledger](./packages/ledger/README.md) - Double-entry accounting
- [@repo/email-worker](./packages/email-worker/README.md) - Email service

## 🛠️ Development

### Available Scripts

```bash
# Development
bun run dev              # Start all services and apps
bun run dev:backend      # Start backend API only
bun run dev:platform     # Start trading terminal only
bun run dev:auth         # Start auth portal only

# Database
bun run db:generate      # Generate Drizzle migrations
bun run db:migrate       # Run migrations
bun run db:seed          # Seed database

# Testing & Quality
bun run test             # Run all tests
bun run test:watch       # Run tests in watch mode
bun run lint             # Lint all packages
bun run typecheck        # Type check all packages
bun run format           # Format code with Prettier
bun run format:check     # Check code formatting

# Build
bun run build            # Build all packages and apps
bun run build:packages   # Build packages only
bun run build:apps       # Build apps only

# Clean
bun run clean            # Remove node_modules and build artifacts
```

### Project Structure

```
bhcmarkets/
├── apps/               # Frontend applications
├── packages/           # Backend services & shared libraries
├── docs/               # Documentation
├── .github/            # GitHub workflows and configs
├── eslint-config/      # Shared ESLint configuration
├── typescript-config/  # Shared TypeScript configuration
├── .env.example        # Environment variables template
├── package.json        # Root package with workspaces
└── vitest.config.ts    # Vitest configuration
```

## 🔒 Security

- JWT-based authentication with refresh tokens
- Bcrypt password hashing (10 rounds)
- Role-based access control (RBAC)
- Rate limiting on sensitive endpoints
- CORS protection
- Input validation with Zod
- SQL injection prevention (parameterized queries)
- XSS protection

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run tests for a specific package
bun run --filter=@repo/backend test
bun run --filter=@repo/order-engine test

# Watch mode
bun run test:watch

# Coverage
bun run test -- --coverage
```

## 📝 Key Concepts

### Order Matching

The order engine uses **price-time priority**:
1. Best price executes first
2. At same price, earlier orders have priority
3. Market orders execute immediately
4. Limit orders cross if price matches or improves

Supported order types: Market, Limit, Stop, Stop-Limit  
Time-in-force: GTC, IOC, FOK, GTD

### Double-Entry Ledger

Every balance operation creates offsetting entries:
- **Holds**: Lock funds for pending orders
- **Trade Settlement**: Atomic buyer/seller balance updates
- **Deposits/Withdrawals**: Credit/debit with audit trail

### Risk Management

Pre-trade checks include:
- Available balance verification
- Position size limits
- Daily volume limits
- Price deviation checks
- Order rate limiting
- Maximum open orders

## 🌐 Environment Variables

See [.env.example](./.env.example) for all configuration options.

Required variables:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/bhcmarkets
JWT_SECRET=your-256-bit-secret
```

Optional but recommended:
```bash
REDIS_URL=redis://localhost:6379
```

## 📦 Deployment

The platform can be deployed as:

1. **Monolith**: All services on one server
2. **Microservices**: Independent service deployment
3. **Containerized**: Docker/Kubernetes

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for:
- Code of conduct
- Development workflow
- Coding standards
- Pull request process

## 📄 License

Private - BHC Markets. All rights reserved.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/zshmeta/bhcmarkets/issues)
- **Email**: support@bhcmarkets.com

---

Built with ❤️ using [Bun](https://bun.sh)
