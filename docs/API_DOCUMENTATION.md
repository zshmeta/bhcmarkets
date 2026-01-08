# Application API Documentation

This document outlines the API endpoints defined in the backend services and their usage across the frontend applications.

## Backend HTTP API

The backend exposes a RESTful API via `packages/backend`.

base URL: `http://localhost:8080` (default)
Health Check: `GET /healthz`, `GET /readyz`

### Auth Domain
Defined in `packages/backend/src/domains/auth/routes/auth.routes.ts`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate user with credentials |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/code` | Generate auth code (for cross-domain auth) |
| POST | `/auth/exchange` | Exchange auth code for tokens |
| POST | `/auth/logout` | Revoke current session |
| POST | `/auth/logout-all` | Revoke all sessions for user |
| GET | `/auth/sessions` | List active user sessions |

### Account Domain
Defined in `packages/backend/src/domains/account/routes/account.routes.ts`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/accounts` | List user's accounts |
| POST | `/accounts` | Create a new account |
| GET | `/accounts/:id` | Get specific account details |

*(Note: Deposit/Withdraw endpoints are listed in Admin domain or internal use, not publicly exposed in basic Account routes yet, though `admin` calls them via admin adapter)*

### Admin Domain
Defined in `packages/backend/src/domains/admin/api/admin.api.ts` (registered via `registerAdminApiRoutes`).

**User Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List users (with filtering) |
| POST | `/admin/users/suspend` | Suspend a user |
| POST | `/admin/users/unsuspend` | Unsuspend a user |
| POST | `/admin/users/role` | Update user role |

**Account Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/accounts` | List accounts |
| POST | `/admin/accounts/deposit` | Admin deposit to account |
| POST | `/admin/accounts/withdraw` | Admin withdraw from account |
| POST | `/admin/accounts/freeze` | Freeze an account |
| POST | `/admin/accounts/unfreeze` | Unfreeze an account |

**Risk Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/risk/dashboard` | Get risk dashboard data |
| POST | `/admin/risk/circuit-breaker/activate` | Activate circuit breaker |
| POST | `/admin/risk/circuit-breaker/deactivate` | Deactivate circuit breaker |

**Symbol Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/symbols` | List trading symbols |
| POST | `/admin/symbols` | Create/Update symbol |
| POST | `/admin/symbols/enable` | Enable trading for symbol |
| POST | `/admin/symbols/disable` | Disable trading for symbol |

**Audit**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/audit` | Retrieve audit logs |

**Order Management (Phase 2)**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/orders` | List orders |
| GET | `/admin/orders/:id` | Get order details |
| POST | `/admin/orders/cancel` | Cancel an order |
| POST | `/admin/orders/cancel-all` | Cancel all orders |

**Position Management (Phase 2)**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/positions` | List positions |
| GET | `/admin/positions/:id` | Get position details |
| POST | `/admin/positions/force-close` | Force close a position |

**Reports (Phase 2)**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/reports/trading` | Daily trading summary |
| GET | `/admin/reports/users` | User activity summary |
| GET | `/admin/reports/pnl` | Platform PnL summary |

## Websockets / Real-time API

### Market Data
Implemented using `socket.io`.

**Events:**
- `subscribe` (Client -> Server): Subscribe to symbol updates. Payload: `[symbol]`
- `unsubscribe` (Client -> Server): Unsubscribe. Payload: `[symbol]`
- `price_update` (Server -> Client): Real-time price data.
  ```json
  {
    "symbol": "BTC-USD",
    "data": {
      "price": 50000,
      "change": 100,
      "changePercent": 0.2,
      "volume": 1000,
      "high": 51000,
      "low": 49000
    }
  }
  ```

## Frontend Integration

### Apps/Auth (`apps/auth`)
- Uses `apps/auth/src/lib/http.ts` as HTTP client.
- Implements Auth API calls in `apps/auth/src/auth/auth.api.ts`.
- **Discrepancy**: Attempting to call `/auth/forgot-password` and `/auth/reset-password` which are **NOT** implemented in the backend.

### Apps/Admin (`apps/admin`)
- Direct `fetch` calls observed in components (e.g., `Login.tsx`).
- Consumes Admin Domain endpoints.

### Apps/Mobile (`apps/mobile`)
- Uses `socket.io-client` for real-time market data (`MarketDataContext.tsx`).
- Likely uses Auth API for login (via standard HTTP).

### Apps/Platform (`apps/platform`)
- Uses WebSocket services (`apps/platform/src/services/ws`) for real-time data.

## Missing / TODO Endpoints
- **Password Reset**: The frontend expects `/auth/forgot-password` and `/auth/reset-password`, but they are missing from the backend routes.
