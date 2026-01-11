# Platform - Trading Terminal

Professional trading terminal application for BHC Markets.

## Overview

A full-featured trading terminal built with React and Vite. Provides real-time market data, advanced charting, order management, and position tracking for crypto, forex, stocks, and commodities trading.

## Features

- 📊 **Advanced Charts** - TradingView-style candlestick charts with indicators
- 📖 **Order Book** - Real-time market depth with bid/ask spread
- 📝 **Order Entry** - Market, limit, stop, and stop-limit orders
- 💼 **Position Management** - Track open positions with real-time P&L
- 📋 **Order History** - View and manage active and historical orders
- 📈 **Market Watch** - Multi-symbol price ticker
- 🔔 **Trade Notifications** - Real-time trade alerts
- 🎨 **Professional UI** - Dark theme optimized for trading
- 📱 **Responsive** - Adapts to different screen sizes

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: styled-components
- **Routing**: react-router-dom
- **State Management**: React hooks + context
- **Charts**: lightweight-charts (TradingView)
- **WebSocket**: Socket.IO client
- **HTTP Client**: fetch API

## Quick Start

### Development

```bash
# From monorepo root
bun run dev:platform

# Or from this directory
bun run dev
```

App runs at http://localhost:5174

### Production Build

```bash
bun run build
bun run preview
```

## Environment Variables

Create `.env` in the app directory:

```bash
# API endpoints
VITE_API_URL=http://localhost:8080
VITE_ORDER_ENGINE_URL=http://localhost:4003
VITE_MARKET_DATA_WS_URL=ws://localhost:4002/ws
VITE_ORDER_ENGINE_WS_URL=ws://localhost:4004/ws

# Optional: Feature flags
VITE_ENABLE_DEMO_ACCOUNT=true
VITE_ENABLE_MOBILE_LAYOUT=true
```

## Project Structure

```
src/
├── components/
│   ├── Chart/              # TradingView chart component
│   ├── OrderBook/          # Order book display
│   ├── OrderForm/          # Order entry form
│   ├── Positions/          # Positions table
│   ├── Orders/             # Orders table
│   ├── MarketWatch/        # Symbol ticker
│   ├── Header/             # App header
│   └── Layout/             # Page layouts
├── pages/
│   ├── Dashboard/          # Main trading view
│   ├── Portfolio/          # Portfolio summary
│   ├── History/            # Trade history
│   └── Settings/           # User settings
├── hooks/
│   ├── useMarketData.ts    # Market data WebSocket
│   ├── useOrderEngine.ts   # Order engine WebSocket
│   ├── useAuth.ts          # Authentication
│   ├── useOrders.ts        # Order management
│   └── usePositions.ts     # Position tracking
├── services/
│   ├── api.ts              # API client
│   ├── websocket.ts        # WebSocket manager
│   └── auth.ts             # Auth service
├── contexts/
│   ├── AuthContext.tsx     # Auth state
│   ├── MarketContext.tsx   # Market data state
│   └── TradingContext.tsx  # Trading state
├── utils/
│   ├── formatting.ts       # Number/date formatting
│   ├── validation.ts       # Form validation
│   └── constants.ts        # App constants
├── types/
│   └── index.ts            # TypeScript types
├── App.tsx                 # App component
├── main.tsx                # Entry point
└── router.tsx              # Route definitions
```

## Key Features

### Real-Time Market Data

Connects to market data service via WebSocket:

```typescript
// Automatically handled by useMarketData hook
const { prices, subscribe, unsubscribe } = useMarketData();

// Subscribe to symbols
useEffect(() => {
  subscribe(['BTC/USD', 'ETH/USD']);
  return () => unsubscribe(['BTC/USD', 'ETH/USD']);
}, []);

// Access real-time prices
const btcPrice = prices['BTC/USD'];
```

### Order Placement

Place orders through the order engine:

```typescript
import { useOrders } from '../hooks/useOrders';

function OrderFormComponent() {
  const { placeOrder, loading, error } = useOrders();

  const handleSubmit = async (orderData) => {
    try {
      const order = await placeOrder({
        symbol: 'BTC/USD',
        side: 'buy',
        type: 'limit',
        quantity: 1,
        price: 50000,
        timeInForce: 'GTC',
      });
      
      console.log('Order placed:', order);
    } catch (err) {
      console.error('Failed to place order:', err);
    }
  };

  return (
    <OrderForm onSubmit={handleSubmit} loading={loading} error={error} />
  );
}
```

### Position Tracking

Monitor open positions with real-time P&L:

```typescript
import { usePositions } from '../hooks/usePositions';

function PositionsComponent() {
  const { positions, closePosition, modifyPosition } = usePositions();

  return (
    <PositionsTable
      positions={positions}
      onClose={closePosition}
      onModify={modifyPosition}
    />
  );
}
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Dashboard | Main trading interface |
| `/portfolio` | Portfolio | Portfolio summary |
| `/history` | History | Trade history |
| `/settings` | Settings | User settings |

## Authentication

The app requires authentication. Users are redirected to the auth portal if not logged in.

### Auth Flow

1. User logs in at auth portal (http://localhost:5173)
2. Auth portal redirects back with auth code
3. Platform exchanges code for access token
4. Platform stores token and loads user data

```typescript
// Handled automatically by AuthContext
import { useAuth } from '../contexts/AuthContext';

function ProtectedComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      Welcome, {user.email}!
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## WebSocket Connections

The app maintains two WebSocket connections:

### Market Data (Port 4002)
- Real-time price updates
- Order book changes
- Public trade feed

### Order Engine (Port 4004)
- Order status updates
- Position changes
- Trade notifications

Connections are managed by dedicated hooks and automatically reconnect on disconnect.

## Theming

The app uses a dark theme optimized for trading:

```typescript
import { ThemeProvider } from 'styled-components';
import { tradingTheme } from '@repo/trading-ui';

<ThemeProvider theme={tradingTheme}>
  <App />
</ThemeProvider>
```

## State Management

State is managed with React Context and hooks:

- **AuthContext**: User authentication state
- **MarketContext**: Real-time market data
- **TradingContext**: Orders, positions, balances

## Error Handling

Errors are handled at multiple levels:

1. **API Level**: Try/catch in API calls
2. **Component Level**: Error boundaries
3. **Global Level**: Toast notifications

```typescript
import { toast } from '../utils/toast';

try {
  await placeOrder(orderData);
  toast.success('Order placed successfully');
} catch (error) {
  toast.error(error.message || 'Failed to place order');
}
```

## Performance Optimization

- **Code Splitting**: Routes are lazy loaded
- **Memoization**: Expensive calculations are memoized
- **Virtualization**: Large lists use virtual scrolling
- **Debouncing**: Input handlers are debounced
- **WebSocket Throttling**: Updates are batched and throttled

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

Build output goes to `dist/` directory.

## Deployment

The platform can be deployed as a static site:

1. **Vercel**: `vercel deploy`
2. **Netlify**: `netlify deploy`
3. **Static Server**: Serve `dist/` directory

Ensure environment variables are configured in your deployment platform.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- Keyboard navigation supported
- ARIA labels on interactive elements
- Screen reader friendly
- High contrast mode compatible

## License

Private - BHC Markets
