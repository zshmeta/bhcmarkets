# Admin - Admin Dashboard

Administrative dashboard for BHC Markets platform management.

## Overview

A comprehensive admin dashboard for managing users, accounts, orders, risk controls, and platform operations. Provides powerful tools for platform administrators to monitor and control all aspects of the trading platform.

## Features

- 👥 **User Management** - View, suspend, and manage user accounts
- 💰 **Account Operations** - Manual deposits, withdrawals, freeze/unfreeze
- 📊 **Order Management** - View all orders, cancel orders, force close positions
- ⚠️ **Risk Controls** - Set limits, activate circuit breakers, monitor exposure
- 📈 **Symbol Management** - Enable/disable trading pairs, set fees
- 📋 **Audit Logs** - Complete audit trail of all admin actions
- 📊 **Reports** - Trading summaries, user activity, P&L reports
- 🔔 **Alerts** - Real-time risk alerts and notifications
- 📱 **Responsive** - Works on desktop and tablet

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: styled-components
- **Routing**: react-router-dom
- **Charts**: lightweight-charts
- **Tables**: Custom DataTable component
- **HTTP Client**: fetch API

## Quick Start

### Development

```bash
# From monorepo root
bun run dev:admin

# Or from this directory
bun run dev
```

App runs at http://localhost:5175

### Production Build

```bash
bun run build
bun run preview
```

## Environment Variables

Create `.env` in the app directory:

```bash
# Backend API
VITE_API_URL=http://localhost:8080

# Optional: Feature flags
VITE_ENABLE_ADVANCED_FEATURES=true
```

## Project Structure

```
src/
├── components/
│   ├── UserTable/          # User management table
│   ├── AccountTable/       # Account management table
│   ├── OrderTable/         # Order management table
│   ├── RiskDashboard/      # Risk metrics dashboard
│   ├── AuditLog/           # Audit log viewer
│   ├── DataTable/          # Reusable data table
│   ├── Modal/              # Modal component
│   ├── Header/             # App header
│   └── Sidebar/            # Navigation sidebar
├── pages/
│   ├── Dashboard/          # Main overview dashboard
│   ├── Users/              # User management
│   ├── Accounts/           # Account management
│   ├── Orders/             # Order management
│   ├── Risk/               # Risk controls
│   ├── Symbols/            # Symbol management
│   ├── Audit/              # Audit logs
│   └── Reports/            # Reports and analytics
├── hooks/
│   ├── useAdmin.ts         # Admin API hook
│   ├── useUsers.ts         # User management hook
│   ├── useAccounts.ts      # Account management hook
│   ├── useOrders.ts        # Order management hook
│   └── useRisk.ts          # Risk controls hook
├── services/
│   ├── api.ts              # API client
│   └── admin.ts            # Admin service
├── utils/
│   ├── formatting.ts       # Data formatting
│   ├── permissions.ts      # Permission checks
│   └── constants.ts        # App constants
├── types/
│   └── index.ts            # TypeScript types
├── App.tsx                 # App component
├── main.tsx                # Entry point
└── router.tsx              # Route definitions
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Dashboard | Overview dashboard |
| `/users` | Users | User management |
| `/accounts` | Accounts | Account management |
| `/orders` | Orders | Order management |
| `/positions` | Positions | Position management |
| `/risk` | Risk | Risk controls |
| `/symbols` | Symbols | Symbol management |
| `/audit` | Audit | Audit log viewer |
| `/reports` | Reports | Reports and analytics |

## Authentication

Admin dashboard requires admin role. Users are redirected to login if not authenticated or not admin.

```typescript
import { useAuth } from '../hooks/useAuth';

function ProtectedAdminRoute() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
}
```

## Key Features

### User Management

View and manage all users:

```typescript
import { useUsers } from '../hooks/useUsers';

function UsersPage() {
  const {
    users,
    loading,
    suspendUser,
    unsuspendUser,
    changeUserRole,
    resetPassword,
  } = useUsers();

  return (
    <UserTable
      users={users}
      loading={loading}
      onSuspend={suspendUser}
      onUnsuspend={unsuspendUser}
      onChangeRole={changeUserRole}
      onResetPassword={resetPassword}
    />
  );
}
```

**User Operations:**
- View user details
- Suspend/unsuspend accounts
- Change user roles
- Reset passwords
- View user activity

### Account Management

Manage user accounts and balances:

```typescript
import { useAccounts } from '../hooks/useAccounts';

function AccountsPage() {
  const {
    accounts,
    deposit,
    withdraw,
    freezeAccount,
    unfreezeAccount,
  } = useAccounts();

  const handleDeposit = async (accountId: string, amount: number, asset: string) => {
    await deposit({
      accountId,
      asset,
      amount,
      reason: 'admin_credit',
    });
  };

  return (
    <AccountTable
      accounts={accounts}
      onDeposit={handleDeposit}
      onWithdraw={withdraw}
      onFreeze={freezeAccount}
      onUnfreeze={unfreezeAccount}
    />
  );
}
```

**Account Operations:**
- Manual deposits
- Manual withdrawals
- Freeze/unfreeze accounts
- View account history
- View balances and holds

### Order Management

View and manage all platform orders:

```typescript
import { useOrders } from '../hooks/useOrders';

function OrdersPage() {
  const { orders, cancelOrder, cancelAllOrders } = useOrders();

  return (
    <OrderTable
      orders={orders}
      onCancel={cancelOrder}
      onCancelAll={cancelAllOrders}
    />
  );
}
```

**Order Operations:**
- View all orders
- Filter by status, symbol, user
- Cancel individual orders
- Bulk cancel orders
- View order details

### Risk Controls

Monitor and control platform risk:

```typescript
import { useRisk } from '../hooks/useRisk';

function RiskPage() {
  const {
    riskMetrics,
    limits,
    alerts,
    activateCircuitBreaker,
    deactivateCircuitBreaker,
    setLimit,
  } = useRisk();

  return (
    <RiskDashboard
      metrics={riskMetrics}
      limits={limits}
      alerts={alerts}
      onActivateCircuitBreaker={activateCircuitBreaker}
      onDeactivateCircuitBreaker={deactivateCircuitBreaker}
      onSetLimit={setLimit}
    />
  );
}
```

**Risk Features:**
- View house exposure
- Set position limits
- Set order limits
- Activate/deactivate circuit breakers
- Kill switch (halt all trading)
- View risk alerts

### Symbol Management

Enable/disable trading pairs and configure:

```typescript
import { useSymbols } from '../hooks/useSymbols';

function SymbolsPage() {
  const {
    symbols,
    enableSymbol,
    disableSymbol,
    updateFees,
  } = useSymbols();

  return (
    <SymbolTable
      symbols={symbols}
      onEnable={enableSymbol}
      onDisable={disableSymbol}
      onUpdateFees={updateFees}
    />
  );
}
```

**Symbol Operations:**
- Enable/disable trading
- Set trading hours
- Configure fees/spreads
- View price feed status

### Audit Logs

Complete audit trail of all admin actions:

```typescript
import { useAudit } from '../hooks/useAudit';

function AuditPage() {
  const { logs, filter, setFilter } = useAudit();

  return (
    <AuditLog
      logs={logs}
      filter={filter}
      onFilterChange={setFilter}
    />
  );
}
```

**Audit Features:**
- View all admin actions
- Filter by admin, action type, date
- View action details
- Export audit logs

### Reports

Analytics and reporting:

```typescript
import { useReports } from '../hooks/useReports';

function ReportsPage() {
  const {
    tradingReport,
    userActivityReport,
    pnlReport,
    generateReport,
  } = useReports();

  return (
    <Reports
      tradingReport={tradingReport}
      userActivityReport={userActivityReport}
      pnlReport={pnlReport}
      onGenerate={generateReport}
    />
  );
}
```

**Report Types:**
- Trading summary
- User activity
- Platform P&L
- Fee revenue
- Custom date ranges

## Permissions

Admin operations require specific permissions:

```typescript
// Check if user has permission
import { hasPermission } from '../utils/permissions';

if (hasPermission(user, 'user:suspend')) {
  // Show suspend button
}

if (hasPermission(user, 'account:deposit')) {
  // Show deposit form
}
```

**Permission List:**
- `user:list`, `user:suspend`, `user:update_role`
- `account:list`, `account:deposit`, `account:withdraw`, `account:freeze`
- `order:list`, `order:cancel`
- `position:list`, `position:force_close`
- `risk:read`, `risk:circuit_breaker_activate`
- `symbol:list`, `symbol:enable`, `symbol:disable`
- `audit:read`

## UI Components

### DataTable

Reusable data table with sorting, filtering, and pagination:

```tsx
<DataTable
  columns={[
    { key: 'id', label: 'ID', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Status', render: (value) => <Badge>{value}</Badge> },
  ]}
  data={users}
  onRowClick={(user) => navigate(`/users/${user.id}`)}
  pagination
  searchable
  exportable
/>
```

### Modal Dialogs

Confirm dangerous actions:

```tsx
<ConfirmModal
  isOpen={showConfirm}
  title="Suspend User"
  message="Are you sure you want to suspend this user?"
  onConfirm={() => suspendUser(userId)}
  onCancel={() => setShowConfirm(false)}
  variant="danger"
/>
```

## Error Handling

All admin operations include error handling:

```typescript
try {
  await suspendUser(userId);
  toast.success('User suspended successfully');
} catch (error) {
  toast.error(error.message || 'Failed to suspend user');
  logger.error('Suspend user failed', { userId, error });
}
```

## Testing

```bash
# Run tests
bun run test

# Watch mode
bun run test:watch

# Type check
bun run typecheck

# Lint
bun run lint
```

## Building for Production

```bash
# Build optimized bundle
bun run build

# Preview production build
bun run preview
```

## Deployment

Deploy as a static site with environment variables configured.

### Security Considerations

1. **Access Control**: Only admin users can access
2. **Audit Logging**: All actions are logged
3. **Confirmation**: Destructive actions require confirmation
4. **HTTPS Only**: Must be served over HTTPS in production
5. **Session Timeout**: Auto-logout after inactivity

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- WCAG 2.1 Level AA compliant
- Keyboard navigation
- Screen reader support
- High contrast mode

## License

Private - BHC Markets
