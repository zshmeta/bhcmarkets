/**
 * Mock Positions & Orders Generator
 * 
 * Generates realistic mock positions and orders for testing.
 */

import type { Position, Order, OrderSide, OrderType, OrderStatus, TradeHistory, Account } from '../types';
import { INITIAL_PRICES, getInstrumentBySymbol } from './symbols';

let positionIdCounter = 1000;
let orderIdCounter = 2000;
let tradeIdCounter = 3000;

/**
 * Generate a random position.
 */
export function generateMockPosition(symbol: string, overrides: Partial<Position> = {}): Position {
    const instrument = getInstrumentBySymbol(symbol);
    const entryPrice = INITIAL_PRICES[symbol] || 100;
    const side: OrderSide = Math.random() > 0.5 ? 'buy' : 'sell';
    const quantity = Math.random() * 5 + 0.1;

    // Calculate P&L based on random price movement
    const priceChange = (Math.random() - 0.5) * entryPrice * 0.02;
    const currentPrice = entryPrice + priceChange;
    const pnlDirection = side === 'buy' ? 1 : -1;
    const unrealizedPnl = (currentPrice - entryPrice) * quantity * pnlDirection;
    const unrealizedPnlPercent = (unrealizedPnl / (entryPrice * quantity)) * 100;

    const leverage = instrument?.maxLeverage ? Math.min(10, instrument.maxLeverage) : 1;
    const margin = (entryPrice * quantity) / leverage;

    const position: Position = {
        id: `POS-${positionIdCounter++}`,
        userId: 'user-123',
        symbol,
        side,
        quantity: Number(quantity.toFixed(4)),
        entryPrice: Number(entryPrice.toFixed(instrument?.decimals || 2)),
        currentPrice: Number(currentPrice.toFixed(instrument?.decimals || 2)),
        stopLoss: side === 'buy'
            ? Number((entryPrice * 0.98).toFixed(instrument?.decimals || 2))
            : Number((entryPrice * 1.02).toFixed(instrument?.decimals || 2)),
        takeProfit: side === 'buy'
            ? Number((entryPrice * 1.05).toFixed(instrument?.decimals || 2))
            : Number((entryPrice * 0.95).toFixed(instrument?.decimals || 2)),
        leverage,
        margin: Number(margin.toFixed(2)),
        unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
        unrealizedPnlPercent: Number(unrealizedPnlPercent.toFixed(2)),
        realizedPnl: 0,
        swap: Number((Math.random() * 5 - 2.5).toFixed(2)),
        commission: Number((quantity * 0.1).toFixed(2)),
        status: 'open',
        openedAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        ...overrides,
    };

    return position;
}

/**
 * Generate multiple mock positions.
 */
export function generateMockPositions(count: number = 5): Position[] {
    const symbols = ['EURUSD', 'BTCUSD', 'AAPL', 'XAUUSD', 'ETHUSD', 'TSLA'];
    const positions: Position[] = [];

    for (let i = 0; i < count; i++) {
        const symbol = symbols[i % symbols.length];
        if (symbol) positions.push(generateMockPosition(symbol));
    }

    return positions;
}

/**
 * Generate a mock order.
 */
export function generateMockOrder(symbol: string, overrides: Partial<Order> = {}): Order {
    const instrument = getInstrumentBySymbol(symbol);
    const price = INITIAL_PRICES[symbol] || 100;
    const side: OrderSide = Math.random() > 0.5 ? 'buy' : 'sell';
    const types: OrderType[] = ['limit', 'market', 'stop_limit'];
    const type: OrderType = types[Math.floor(Math.random() * 3)] || 'market';
    const status: OrderStatus = Math.random() > 0.5 ? 'open' : 'filled';
    const quantity = Math.random() * 5 + 0.1;

    const order: Order = {
        id: `ORD-${orderIdCounter++}`,
        userId: 'user-123',
        symbol,
        side,
        type,
        quantity: Number(quantity.toFixed(4)),
        limitPrice: type === 'limit' || type === 'stop_limit'
            ? Number((price * (side === 'buy' ? 0.99 : 1.01)).toFixed(instrument?.decimals || 2))
            : undefined,
        stopLoss: Math.random() > 0.5
            ? Number((price * (side === 'buy' ? 0.98 : 1.02)).toFixed(instrument?.decimals || 2))
            : undefined,
        takeProfit: Math.random() > 0.5
            ? Number((price * (side === 'buy' ? 1.03 : 0.97)).toFixed(instrument?.decimals || 2))
            : undefined,
        leverage: 1,
        timeInForce: 'gtc',
        status,
        filledQuantity: status === 'filled' ? Number(quantity.toFixed(4)) : 0,
        remainingQuantity: status === 'filled' ? 0 : Number(quantity.toFixed(4)),
        avgFillPrice: status === 'filled' ? Number(price.toFixed(instrument?.decimals || 2)) : undefined,
        createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        filledAt: status === 'filled' ? new Date().toISOString() : undefined,
        ...overrides,
    };

    return order;
}

/**
 * Generate multiple mock orders.
 */
export function generateMockOrders(count: number = 5): Order[] {
    const symbols = ['EURUSD', 'BTCUSD', 'AAPL', 'XAUUSD', 'ETHUSD'];
    const orders: Order[] = [];

    for (let i = 0; i < count; i++) {
        const symbol = symbols[i % symbols.length];
        if (symbol) orders.push(generateMockOrder(symbol));
    }

    return orders;
}

/**
 * Generate mock trade history.
 */
export function generateMockTradeHistory(count: number = 10): TradeHistory[] {
    const symbols = ['EURUSD', 'BTCUSD', 'AAPL', 'XAUUSD', 'ETHUSD', 'TSLA'];
    const trades: TradeHistory[] = [];

    for (let i = 0; i < count; i++) {
        const symbol = symbols[i % symbols.length];
        if (!symbol) continue;
        const instrument = getInstrumentBySymbol(symbol);
        const entryPrice = INITIAL_PRICES[symbol] || 100;
        const side: OrderSide = Math.random() > 0.5 ? 'buy' : 'sell';
        const quantity = Math.random() * 5 + 0.1;

        // Random P&L (60% win rate)
        const isWin = Math.random() > 0.4;
        const pnlPercent = isWin
            ? Math.random() * 5 + 0.5  // 0.5% to 5.5% profit
            : -(Math.random() * 3 + 0.5);  // 0.5% to 3.5% loss

        const pnlDirection = side === 'buy' ? 1 : -1;
        const exitPrice = entryPrice * (1 + pnlPercent / 100 * pnlDirection);
        const pnl = (exitPrice - entryPrice) * quantity * pnlDirection;

        const openedAt = new Date(Date.now() - Math.random() * 86400000 * 30);
        const duration = Math.floor(Math.random() * 86400) + 60; // 1 minute to 24 hours
        const closedAt = new Date(openedAt.getTime() + duration * 1000);

        trades.push({
            id: `TRD-${tradeIdCounter++}`,
            positionId: `POS-${1000 + i}`,
            symbol,
            side,
            quantity: Number(quantity.toFixed(4)),
            entryPrice: Number(entryPrice.toFixed(instrument?.decimals || 2)),
            exitPrice: Number(exitPrice.toFixed(instrument?.decimals || 2)),
            pnl: Number(pnl.toFixed(2)),
            pnlPercent: Number(pnlPercent.toFixed(2)),
            openedAt: openedAt.toISOString(),
            closedAt: closedAt.toISOString(),
            duration,
            closeReason: isWin ? 'take_profit' : Math.random() > 0.5 ? 'stop_loss' : 'manual',
        });
    }

    // Sort by closed date descending
    return trades.sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());
}

/**
 * Generate mock account data.
 */
export function generateMockAccount(): Account {
    const balance = 10000 + Math.random() * 5000;
    const unrealizedPnl = (Math.random() - 0.3) * 500;
    const equity = balance + unrealizedPnl;
    const usedMargin = Math.random() * 2000 + 500;
    const freeMargin = equity - usedMargin;
    const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0;

    return {
        id: 'ACC-001',
        userId: 'user-123',
        currency: 'USD',
        balance: Number(balance.toFixed(2)),
        equity: Number(equity.toFixed(2)),
        usedMargin: Number(usedMargin.toFixed(2)),
        freeMargin: Number(freeMargin.toFixed(2)),
        marginLevel: Number(marginLevel.toFixed(2)),
        unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
        realizedPnlToday: Number((Math.random() * 200 - 50).toFixed(2)),
        commissionToday: Number((Math.random() * 10).toFixed(2)),
        swapToday: Number((Math.random() * 5 - 2.5).toFixed(2)),
        openPositions: Math.floor(Math.random() * 5) + 1,
        pendingOrders: Math.floor(Math.random() * 3),
        leverage: 100,
        marginCallLevel: 100,
        stopOutLevel: 50,
        isMarginCall: marginLevel < 100 && marginLevel > 0,
        lastUpdate: new Date().toISOString(),
    };
}
