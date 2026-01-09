# @repo/trading-ui

Professional trading terminal React components for BHC Markets.

## Overview

A collection of production-ready React components for building financial trading applications. Includes order books, trading charts, order forms, position tables, and market data displays.

## Features

- 📊 **TradingView Charts** - Professional candlestick charts with indicators
- 📖 **Order Book** - Real-time market depth visualization
- 📝 **Order Form** - Market, limit, and stop orders with SL/TP
- 💼 **Positions Table** - Open positions with P&L tracking
- 📋 **Orders Table** - Order history and status
- 📈 **Market Watch** - Multi-symbol price ticker
- 🎨 **Theming** - Dark mode with customizable colors
- 📱 **Responsive** - Mobile-friendly layouts

## Installation

```bash
# Already included in the monorepo
bun install
```

## Components

### TradingChart

Candlestick chart with TradingView-style interface.

```tsx
import { TradingChart } from '@repo/trading-ui';

function ChartView() {
  return (
    <TradingChart
      symbol="BTC/USD"
      timeframe="1h"
      onTimeframeChange={(tf) => console.log('Timeframe:', tf)}
    />
  );
}
```

**Props:**
- `symbol`: Trading pair (e.g., "BTC/USD")
- `timeframe`: Chart interval ("1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w")
- `onTimeframeChange`: Callback when timeframe is changed
- `height`: Chart height in pixels (default: 500)

### OrderBook

Real-time order book display with bids and asks.

```tsx
import { OrderBook } from '@repo/trading-ui';

function OrderBookView() {
  const orderBook = {
    bids: [
      { price: 49999, quantity: 1.5 },
      { price: 49998, quantity: 2.0 },
    ],
    asks: [
      { price: 50000, quantity: 1.2 },
      { price: 50001, quantity: 0.8 },
    ],
  };

  return (
    <OrderBook
      orderBook={orderBook}
      symbol="BTC/USD"
      onPriceClick={(price) => console.log('Clicked:', price)}
    />
  );
}
```

**Props:**
- `orderBook`: Bids and asks data
- `symbol`: Trading pair
- `onPriceClick`: Callback when price level is clicked
- `maxDepth`: Number of levels to show (default: 20)
- `compact`: Compact mode (default: false)

### OrderForm

Order entry form with validation.

```tsx
import { OrderForm } from '@repo/trading-ui';

function OrderFormView() {
  const handleSubmit = async (order) => {
    console.log('Placing order:', order);
    // Submit to API
  };

  return (
    <OrderForm
      symbol="BTC/USD"
      currentPrice={50000}
      availableBalance={{ USD: 10000, BTC: 0.5 }}
      onSubmit={handleSubmit}
    />
  );
}
```

**Props:**
- `symbol`: Trading pair
- `currentPrice`: Current market price
- `availableBalance`: Account balances
- `onSubmit`: Order submission callback
- `defaultSide`: Default order side ("buy" | "sell")
- `defaultType`: Default order type ("market" | "limit" | "stop")

**Order Types:**
- **Market**: Instant execution at current price
- **Limit**: Execute at specified price or better
- **Stop**: Trigger when price reaches threshold
- **Stop-Limit**: Trigger and place limit order

**Advanced Features:**
- Stop Loss (SL)
- Take Profit (TP)
- Time In Force (GTC, IOC, FOK, GTD)
- Order preview with fees

### PositionsTable

Display open positions with P&L.

```tsx
import { PositionsTable } from '@repo/trading-ui';

function PositionsView() {
  const positions = [
    {
      id: 'pos-1',
      symbol: 'BTC/USD',
      side: 'long',
      quantity: 0.5,
      entryPrice: 48000,
      currentPrice: 50000,
      unrealizedPnl: 1000,
      unrealizedPnlPercent: 4.17,
      stopLoss: 46000,
      takeProfit: 52000,
    },
  ];

  return (
    <PositionsTable
      positions={positions}
      onClose={(id) => console.log('Close position:', id)}
      onModify={(id, updates) => console.log('Modify:', id, updates)}
    />
  );
}
```

**Props:**
- `positions`: Array of position data
- `onClose`: Close position callback
- `onModify`: Modify SL/TP callback
- `compact`: Compact mode (default: false)

### OrdersTable

Display order history and active orders.

```tsx
import { OrdersTable } from '@repo/trading-ui';

function OrdersView() {
  const orders = [
    {
      id: 'order-1',
      symbol: 'BTC/USD',
      side: 'buy',
      type: 'limit',
      status: 'open',
      quantity: 1,
      price: 49500,
      filledQuantity: 0,
      createdAt: new Date(),
    },
  ];

  return (
    <OrdersTable
      orders={orders}
      onCancel={(id) => console.log('Cancel order:', id)}
      onModify={(id, updates) => console.log('Modify:', id, updates)}
    />
  );
}
```

**Props:**
- `orders`: Array of order data
- `onCancel`: Cancel order callback
- `onModify`: Modify order callback
- `filter`: Order filter ("all" | "open" | "filled" | "cancelled")

### MarketWatch

Multi-symbol price ticker.

```tsx
import { MarketWatch } from '@repo/trading-ui';

function MarketWatchView() {
  const symbols = [
    {
      symbol: 'BTC/USD',
      last: 50000,
      change24h: 1000,
      changePercent24h: 2.04,
    },
    {
      symbol: 'ETH/USD',
      last: 3000,
      change24h: -50,
      changePercent24h: -1.64,
    },
  ];

  return (
    <MarketWatch
      symbols={symbols}
      onSelect={(symbol) => console.log('Selected:', symbol)}
    />
  );
}
```

**Props:**
- `symbols`: Array of symbol data
- `onSelect`: Symbol selection callback
- `selectedSymbol`: Currently selected symbol

## Theming

### Using the Trading Theme

```tsx
import { ThemeProvider } from 'styled-components';
import { tradingTheme } from '@repo/trading-ui';

function App() {
  return (
    <ThemeProvider theme={tradingTheme}>
      {/* Your components */}
    </ThemeProvider>
  );
}
```

### Theme Structure

```typescript
const tradingTheme = {
  colors: {
    // Background
    background: {
      primary: '#0a0e27',
      secondary: '#1a1e3a',
      tertiary: '#2a2e4a',
    },
    
    // Text
    text: {
      primary: '#ffffff',
      secondary: '#b0b3c1',
      tertiary: '#6c6f7f',
    },
    
    // Trading colors
    buy: '#26a69a',      // Green for buy/long
    sell: '#ef5350',     // Red for sell/short
    
    // Status colors
    success: '#26a69a',
    error: '#ef5350',
    warning: '#ffa726',
    info: '#42a5f5',
    
    // Borders
    border: {
      primary: '#2a2e4a',
      secondary: '#3a3e5a',
    },
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  
  fontSize: {
    xs: '11px',
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '20px',
  },
  
  borderRadius: '4px',
  
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
    md: '0 4px 6px rgba(0, 0, 0, 0.16)',
    lg: '0 10px 20px rgba(0, 0, 0, 0.24)',
  },
};
```

### Custom Theme

```tsx
import { tradingTheme } from '@repo/trading-ui';

const customTheme = {
  ...tradingTheme,
  colors: {
    ...tradingTheme.colors,
    buy: '#00ff00',   // Custom green
    sell: '#ff0000',  // Custom red
  },
};
```

## Real-Time Data Integration

### WebSocket Integration

```tsx
import { useState, useEffect } from 'react';
import { OrderBook, TradingChart } from '@repo/trading-ui';

function TradingTerminal() {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [price, setPrice] = useState(0);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4002/ws');

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'orderbook_update') {
        setOrderBook(message.data);
      } else if (message.type === 'tick') {
        setPrice(message.data.last);
      }
    };

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'orderbook',
        symbol: 'BTC/USD',
      }));
    };

    return () => ws.close();
  }, []);

  return (
    <>
      <TradingChart symbol="BTC/USD" />
      <OrderBook orderBook={orderBook} symbol="BTC/USD" />
    </>
  );
}
```

## Layout Components

### TradingLayout

Pre-built trading terminal layout.

```tsx
import { TradingLayout } from '@repo/trading-ui';

function TradingApp() {
  return (
    <TradingLayout
      symbol="BTC/USD"
      onSymbolChange={(symbol) => console.log('Symbol:', symbol)}
    />
  );
}
```

Includes:
- Header with symbol selector
- Chart area
- Order book
- Order form
- Positions table
- Orders table
- Responsive grid layout

## Utilities

### Formatting

```typescript
import { formatPrice, formatQuantity, formatPercent } from '@repo/trading-ui/utils';

formatPrice(50000);           // "50,000.00"
formatQuantity(1.5);          // "1.5000"
formatPercent(2.04);          // "+2.04%"
formatPercent(-1.64);         // "-1.64%"
```

### Color Utilities

```typescript
import { getChangeColor, getPnLColor } from '@repo/trading-ui/utils';

getChangeColor(1000);         // '#26a69a' (green)
getChangeColor(-500);         // '#ef5350' (red)
getPnLColor(1500);            // '#26a69a' (green)
```

## TypeScript Support

All components are fully typed:

```typescript
import type {
  Order,
  Position,
  OrderBook as OrderBookType,
  Trade,
} from '@repo/trading-ui/types';

const order: Order = {
  id: 'order-1',
  symbol: 'BTC/USD',
  side: 'buy',
  type: 'limit',
  status: 'open',
  quantity: 1,
  price: 50000,
  filledQuantity: 0,
  createdAt: new Date(),
};
```

## Responsive Design

All components adapt to different screen sizes:

- **Desktop**: Full layout with all panels
- **Tablet**: Collapsed sidebar, stacked panels
- **Mobile**: Single column, tabbed interface

## Accessibility

Components follow WCAG 2.1 Level AA guidelines:

- Keyboard navigation
- ARIA labels
- Screen reader support
- Color contrast ratios
- Focus indicators

## Performance

- Virtualized lists for large datasets
- Debounced updates for real-time data
- Memoized components to prevent re-renders
- Lazy loading for charts
- Optimized re-renders with React.memo

## License

Private - BHC Markets
