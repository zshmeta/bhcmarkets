import type { Meta, StoryObj } from '@storybook/react';
import HealthBoardView from './HealthBoard.view';
import type { MetricItem, HealthBoardTranslations } from './useHealthBoard';

/* ═══════════════════════════════════════════════════════════
 * METRICS PANEL STORIES
 * ═══════════════════════════════════════════════════════════
 */

const meta: Meta<typeof HealthBoardView> = {
    title: 'Trading/HealthBoard',
    component: HealthBoardView,
    parameters: {
        layout: 'padded',
        backgrounds: { default: 'dark' },
    },
    tags: ['autodocs'],
    argTypes: {
        compact: { control: 'boolean' },
    },
};

export default meta;
type Story = StoryObj<typeof HealthBoardView>;

/* ─── Mock Data ─── */
const mockTranslations: HealthBoardTranslations = {
    title: 'Market Metrics',
    midPrice: 'Mid Price',
    midPriceDesc: 'Average of best bid and ask',
    spread: 'Spread',
    spreadDesc: 'Difference between bid and ask',
    spreadBps: 'bps',
    imbalance: 'Imbalance',
    imbalanceDesc: 'Order book imbalance',
    volatility: 'Volatility',
    volatilityDesc: 'Price volatility',
    tradeIntensity: 'Intensity',
    tradeIntensityDesc: 'Trades per 10 seconds',
    vwap: 'VWAP',
    vwapDesc: 'Volume weighted average price',
    liquidityScore: 'Liquidity',
    liquidityScoreDesc: 'Score from 0-100',
    slippageEst: 'Slippage',
    slippageEstDesc: 'Estimated slippage',
    depthLevels: 'Depth',
    lastUpdate: 'Update',
    loading: 'Loading...',
    info: 'Info',
    metricsUncertain: 'May be inaccurate',
};

const mockMetrics: MetricItem[] = [
    { label: 'Mid Price', value: '98,543.25', tooltip: 'Average of best bid and ask', isUncertain: true },
    { label: 'Spread', value: '1.25', unit: 'bps', tooltip: 'Difference between bid and ask', isUncertain: true },
    { label: 'Imbalance', value: '15.3', unit: '%', colorClass: 'positive', tooltip: 'Order book imbalance', isUncertain: true },
    { label: 'Volatility', value: '0.0023', tooltip: 'Price volatility' },
    { label: 'Intensity', value: '47', unit: '/10s', tooltip: 'Trades per 10 seconds', isUncertain: true },
    { label: 'VWAP', value: '98,521.50', tooltip: 'Volume weighted average price' },
    { label: 'Liquidity', value: '82', unit: '/100', colorClass: 'positive', tooltip: 'Liquidity score', isUncertain: true },
    { label: 'Slippage', value: '2.1', unit: 'bps', tooltip: 'Estimated slippage', isUncertain: true },
];

const mockCompactMetrics = {
    mid: '98,543.25',
    spread: '1.3 bps',
    volume: '12.5M',
};

/* ═══════════════════════════════════════════════════════════
 * STORIES
 * ═══════════════════════════════════════════════════════════
 */

/** Default state with live data */
export const Default: Story = {
    args: {
        hasData: true,
        metrics: mockMetrics,
        compactMetrics: mockCompactMetrics,
        depth: 25,
        lastUpdateTime: '14:32:45',
        confidenceLevel: 'live',
        canTrustMetrics: true,
        translations: mockTranslations,
        compact: false,
    },
};

/** Compact mode for headers */
export const Compact: Story = {
    args: {
        hasData: true,
        metrics: mockMetrics,
        compactMetrics: mockCompactMetrics,
        depth: 25,
        lastUpdateTime: '14:32:45',
        confidenceLevel: 'live',
        canTrustMetrics: true,
        translations: mockTranslations,
        compact: true,
    },
};

/** Loading state */
export const Loading: Story = {
    args: {
        hasData: false,
        metrics: [],
        compactMetrics: null,
        depth: 0,
        lastUpdateTime: '',
        confidenceLevel: 'stale',
        canTrustMetrics: false,
        translations: mockTranslations,
        compact: false,
    },
};

/** Degraded data confidence */
export const Degraded: Story = {
    args: {
        hasData: true,
        metrics: mockMetrics,
        compactMetrics: mockCompactMetrics,
        depth: 25,
        lastUpdateTime: '14:32:45',
        confidenceLevel: 'degraded',
        canTrustMetrics: false,
        confidenceReason: 'Data may be delayed',
        translations: mockTranslations,
        compact: false,
    },
};

/** Stale data */
export const Stale: Story = {
    args: {
        hasData: true,
        metrics: mockMetrics,
        compactMetrics: mockCompactMetrics,
        depth: 25,
        lastUpdateTime: '14:30:00',
        confidenceLevel: 'stale',
        canTrustMetrics: false,
        confidenceReason: 'Connection lost',
        translations: mockTranslations,
        compact: false,
    },
};

/** Negative imbalance */
export const NegativeImbalance: Story = {
    args: {
        hasData: true,
        metrics: mockMetrics.map(m =>
            m.label === 'Imbalance'
                ? { ...m, value: '-22.5', colorClass: 'negative' as const }
                : m
        ),
        compactMetrics: mockCompactMetrics,
        depth: 25,
        lastUpdateTime: '14:32:45',
        confidenceLevel: 'live',
        canTrustMetrics: true,
        translations: mockTranslations,
        compact: false,
    },
};
