import type { Meta, StoryObj } from '@storybook/react';
import RecentPositionsView from './RecentPositions.view';
import type { Trade } from '../../../../../../sdk/utils/types/market';

/* ═══════════════════════════════════════════════════════════
 * RECENT TRADES STORIES
 * ═══════════════════════════════════════════════════════════
 * Storybook stories for the pure RecentPositionsView component.
 * Since RecentPositionsView takes all data as props, we can
 * easily mock different states without store setup.
 */

const meta: Meta<typeof RecentPositionsView> = {
    title: 'Trading/RecentPositions',
    component: RecentPositionsView,
    parameters: {
        layout: 'padded',
        backgrounds: { default: 'dark' },
    },
    tags: ['autodocs'],
    argTypes: {
        compact: { control: 'boolean' },
        onPriceClick: { action: 'priceClicked' },
    },
};

export default meta;
type Story = StoryObj<typeof RecentPositionsView>;

/* ─── Mock Data ─── */
const mockTranslations = {
    title: 'Recent Trades',
    price: 'Price',
    amount: 'Amount',
    time: 'Time',
    noTrades: 'No trades yet',
};

const generateMockTrades = (count: number): Trade[] => {
    const basePrice = 98500;
    const now = Date.now();

    return Array.from({ length: count }, (_, i) => ({
        id: `trade-${i}`,
        price: (basePrice + (Math.random() - 0.5) * 200).toFixed(2),
        quantity: (Math.random() * 2).toFixed(6),
        time: now - i * 1000,
        isBuyerMaker: Math.random() > 0.5,
    }));
};

const mockTrades = generateMockTrades(25);

/* ═══════════════════════════════════════════════════════════
 * STORIES
 * ═══════════════════════════════════════════════════════════
 */

/** Default state with trades */
export const Default: Story = {
    args: {
        trades: mockTrades,
        hasTrades: true,
        translations: mockTranslations,
        compact: false,
    },
};

/** Compact mode for mobile/embedded */
export const Compact: Story = {
    args: {
        trades: mockTrades.slice(0, 15),
        hasTrades: true,
        translations: mockTranslations,
        compact: true,
    },
};

/** Empty state - no trades */
export const Empty: Story = {
    args: {
        trades: [],
        hasTrades: false,
        translations: mockTranslations,
        compact: false,
    },
};

/** Few trades state */
export const FewTrades: Story = {
    args: {
        trades: mockTrades.slice(0, 3),
        hasTrades: true,
        translations: mockTranslations,
        compact: false,
    },
};

/** Mostly buy trades */
export const MostlyBuys: Story = {
    args: {
        trades: mockTrades.map((t, i) => ({ ...t, isBuyerMaker: i % 4 === 0 })),
        hasTrades: true,
        translations: mockTranslations,
        compact: false,
    },
};

/** Mostly sell trades */
export const MostlySells: Story = {
    args: {
        trades: mockTrades.map((t, i) => ({ ...t, isBuyerMaker: i % 4 !== 0 })),
        hasTrades: true,
        translations: mockTranslations,
        compact: false,
    },
};
