import type { Meta, StoryObj } from '@storybook/react';
import { Level2BookView } from './Level2Book.view';
import type { Level2BookViewProps } from './Level2Book.view';
import type { Level2BookLevel } from '../../types/market';

/* ═══════════════════════════════════════════════════════════
 * Level2BookView Stories
 * ═══════════════════════════════════════════════════════════
 * Demonstrates the dumb Level2BookView component with various states.
 */

// Mock data generators
const generateMockBids = (count = 20, basePrice = 50000): Level2BookLevel[] =>
    Array.from({ length: count }, (_, i) => ({
        price: (basePrice - i * 10).toFixed(2),
        quantity: (Math.random() * 5 + 0.1).toFixed(6),
    }));

const generateMockAsks = (count = 20, basePrice = 50010): Level2BookLevel[] =>
    Array.from({ length: count }, (_, i) => ({
        price: (basePrice + i * 10).toFixed(2),
        quantity: (Math.random() * 5 + 0.1).toFixed(6),
    }));

// Default props
const defaultProps: Level2BookViewProps = {
    bids: generateMockBids(),
    asks: generateMockAsks(),
    metrics: {
        spread: 10,
        spreadBps: 2,
    },
    confidence: {
        level: 'live',
        reason: 'Connected via WebSocket',
        isResyncing: false,
        isStale: false,
    },
    maxQuantities: { bids: 5, asks: 5 },
    prevPriceMap: new Map(),
    translations: {
        title: 'Order Book',
        price: 'Price',
        amount: 'Amount',
        buyOrders: 'Buy Orders',
        sellOrders: 'Sell Orders',
    },
};

const meta: Meta<typeof Level2BookView> = {
    title: 'Trading/Level2BookView',
    component: Level2BookView,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Pure presentational order book component. No store hooks - all data via props.',
            },
        },
    },
    argTypes: {
        bids: { control: false },
        asks: { control: false },
        metrics: { control: 'object' },
        confidence: { control: 'object' },
        embedded: { control: 'boolean' },
        compact: { control: 'boolean' },
        onPriceClick: { action: 'price clicked' },
    },
};

export default meta;
type Story = StoryObj<typeof Level2BookView>;

// ─── Stories ───

export const Default: Story = {
    args: defaultProps,
    decorators: [(Story) => <div style={{ width: 350 }}><Story /></div>],
};

export const Compact: Story = {
    args: {
        ...defaultProps,
        compact: true,
        bids: generateMockBids(10),
        asks: generateMockAsks(10),
    },
    decorators: [(Story) => <div style={{ width: 280 }}><Story /></div>],
};

export const Embedded: Story = {
    args: {
        ...defaultProps,
        embedded: true,
    },
    decorators: [(Story) => <div style={{ width: 600 }}><Story /></div>],
};

export const Loading: Story = {
    args: {
        ...defaultProps,
        bids: null,
        asks: null,
    },
    decorators: [(Story) => <div style={{ width: 350 }}><Story /></div>],
};

export const DegradedConfidence: Story = {
    args: {
        ...defaultProps,
        confidence: {
            level: 'degraded',
            reason: 'REST fallback - WebSocket disconnected',
            isResyncing: false,
            isStale: false,
        },
    },
    decorators: [(Story) => <div style={{ width: 350 }}><Story /></div>],
};

export const Resyncing: Story = {
    args: {
        ...defaultProps,
        confidence: {
            level: 'resyncing',
            reason: 'Reconnecting to WebSocket...',
            isResyncing: true,
            isStale: false,
        },
    },
    decorators: [(Story) => <div style={{ width: 350 }}><Story /></div>],
};

export const Stale: Story = {
    args: {
        ...defaultProps,
        confidence: {
            level: 'stale',
            reason: 'No data received in 30+ seconds',
            isResyncing: false,
            isStale: true,
        },
    },
    decorators: [(Story) => <div style={{ width: 350 }}><Story /></div>],
};

export const HighSpread: Story = {
    args: {
        ...defaultProps,
        bids: generateMockBids(20, 49800),
        asks: generateMockAsks(20, 50200),
        metrics: {
            ...defaultProps.metrics,
            spread: 400,
            spreadBps: 80,
        },
    },
    decorators: [(Story) => <div style={{ width: 350 }}><Story /></div>],
};

export const ThinLiquidity: Story = {
    args: {
        ...defaultProps,
        bids: generateMockBids(5),
        asks: generateMockAsks(5),
        maxQuantities: { bids: 0.5, asks: 0.5 },
    },
    decorators: [(Story) => <div style={{ width: 350 }}><Story /></div>],
};
