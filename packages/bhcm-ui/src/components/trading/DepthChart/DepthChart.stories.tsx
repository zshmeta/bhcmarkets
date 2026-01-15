import type { Meta, StoryObj } from '@storybook/react';
import DepthChartView from './DepthChart.view';
import type { DepthLevel, TradeIndicator } from './useDepthChart';

/* ═══════════════════════════════════════════════════════════
 * DEPTH CHART STORIES
 * ═══════════════════════════════════════════════════════════
 * Storybook stories for the pure DepthChartView component.
 * Since DepthChartView takes all data as props, we can
 * easily mock different states without store setup.
 */

const meta: Meta<typeof DepthChartView> = {
    title: 'Trading/DepthChart',
    component: DepthChartView,
    parameters: {
        layout: 'padded',
        backgrounds: { default: 'dark' },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DepthChartView>;

/* ─── Mock Data ─── */
const mockTranslations = {
    title: 'Depth Chart',
    midPrice: 'Mid',
    bids: 'Bids',
    asks: 'Asks',
    RecentPositions: 'Trades',
    loading: 'Loading...',
};

const generateMockLevels = (basePrice: number, count: number, side: 'bid' | 'ask'): DepthLevel[] => {
    const levels: DepthLevel[] = [];
    let cumulative = 0;

    for (let i = 0; i < count; i++) {
        const quantity = Math.random() * 5 + 0.1;
        cumulative += quantity;
        const priceOffset = side === 'bid' ? -(i + 1) * 10 : (i + 1) * 10;

        levels.push({
            price: basePrice + priceOffset,
            quantity,
            cumulative,
        });
    }

    return levels;
};

const mockMidPrice = 98500;
const mockBidLevels = generateMockLevels(mockMidPrice, 15, 'bid');
const mockAskLevels = generateMockLevels(mockMidPrice, 15, 'ask');
const maxCumulative = Math.max(
    mockBidLevels[mockBidLevels.length - 1]?.cumulative ?? 0,
    mockAskLevels[mockAskLevels.length - 1]?.cumulative ?? 0
);

const mockScaleWidth = (cumulative: number): number => {
    if (maxCumulative === 0) return 0;
    const logMax = Math.log10(maxCumulative + 1);
    const logCum = Math.log10(cumulative + 1);
    return (logCum / logMax) * 100;
};

const mockTrades: TradeIndicator[] = [
    { price: 98502, isBuy: true },
    { price: 98498, isBuy: false },
    { price: 98505, isBuy: true },
    { price: 98490, isBuy: false },
    { price: 98510, isBuy: true },
];

/* ═══════════════════════════════════════════════════════════
 * STORIES
 * ═══════════════════════════════════════════════════════════
 */

/** Default state with balanced order book */
export const Default: Story = {
    args: {
        midPrice: mockMidPrice,
        bidLevels: mockBidLevels,
        askLevels: mockAskLevels,
        RecentPositionsPrices: mockTrades,
        scaleWidth: mockScaleWidth,
        translations: mockTranslations,
        isReady: true,
    },
};

/** Loading state */
export const Loading: Story = {
    args: {
        midPrice: 0,
        bidLevels: [],
        askLevels: [],
        RecentPositionsPrices: [],
        scaleWidth: mockScaleWidth,
        translations: mockTranslations,
        isReady: false,
    },
};

/** Heavy bid side (more buy orders) */
export const HeavyBidSide: Story = {
    args: {
        midPrice: mockMidPrice,
        bidLevels: generateMockLevels(mockMidPrice, 15, 'bid').map(l => ({ ...l, quantity: l.quantity * 3 })),
        askLevels: mockAskLevels,
        RecentPositionsPrices: mockTrades,
        scaleWidth: mockScaleWidth,
        translations: mockTranslations,
        isReady: true,
    },
};

/** Heavy ask side (more sell orders) */
export const HeavyAskSide: Story = {
    args: {
        midPrice: mockMidPrice,
        bidLevels: mockBidLevels,
        askLevels: generateMockLevels(mockMidPrice, 15, 'ask').map(l => ({ ...l, quantity: l.quantity * 3 })),
        RecentPositionsPrices: mockTrades,
        scaleWidth: mockScaleWidth,
        translations: mockTranslations,
        isReady: true,
    },
};

/** Few depth levels */
export const ShallowDepth: Story = {
    args: {
        midPrice: mockMidPrice,
        bidLevels: generateMockLevels(mockMidPrice, 5, 'bid'),
        askLevels: generateMockLevels(mockMidPrice, 5, 'ask'),
        RecentPositionsPrices: mockTrades.slice(0, 2),
        scaleWidth: mockScaleWidth,
        translations: mockTranslations,
        isReady: true,
    },
};
