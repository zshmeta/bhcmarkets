import type { Meta, StoryObj } from '@storybook/react';
import RiskBannerView from './RiskBanner.view';
import type { RiskBannerViewProps } from './RiskBanner.view';

/* ═══════════════════════════════════════════════════════════
 * RiskBannerView Stories
 * ═══════════════════════════════════════════════════════════
 */

const defaultProps: RiskBannerViewProps = {
    riskMetrics: {
        positionSizePercent: 35,
        unrealizedPnlPercent: 2.5,
        volatilityRisk: 20,
        hasRealTimePrice: true,
    },
    overallRisk: 28,
    riskLevel: 'low',
    riskLabel: 'Low Risk',
    riskDescription: 'Account in excellent condition, risk under control.',
    performanceMetrics: {
        winRate: 0.65,
        profitFactor: 1.8,
        maxDrawdown: 5.2,
        totalRealizedPnl: '1,250.00',
    },
    marketMetrics: {
        microVolatility: 0.0045,
        liquidityScore: 82,
    },
    translations: {
        title: 'Risk Score',
        low: 'Low Risk',
        medium: 'Medium Risk',
        high: 'High Risk',
        positionRatio: 'Position Ratio',
        unrealizedPnL: 'Unrealized PnL',
        winRate: 'Win Rate',
        profitFactor: 'Profit Factor',
        maxDrawdown: 'Max Drawdown',
        totalRealizedPnl: 'Total Realized PnL',
    },
};

const meta: Meta<typeof RiskBannerView> = {
    title: 'Trading/RiskBannerView',
    component: RiskBannerView,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Risk metrics display with 3 modes: compact, default, full dashboard.',
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof RiskBannerView>;

export const Default: Story = {
    args: defaultProps,
    decorators: [(Story) => <div style={{ width: 400 }}><Story /></div>],
};

export const Compact: Story = {
    args: { ...defaultProps, compact: true },
    decorators: [(Story) => <div style={{ width: 300 }}><Story /></div>],
};

export const FullDashboard: Story = {
    args: { ...defaultProps, full: true },
    decorators: [(Story) => <div style={{ width: 500 }}><Story /></div>],
};

export const MediumRisk: Story = {
    args: {
        ...defaultProps,
        riskMetrics: { ...defaultProps.riskMetrics!, positionSizePercent: 55 },
        overallRisk: 48,
        riskLevel: 'medium',
        riskLabel: 'Medium Risk',
        riskDescription: 'Watch position size, volatility risk increasing.',
    },
    decorators: [(Story) => <div style={{ width: 400 }}><Story /></div>],
};

export const HighRisk: Story = {
    args: {
        ...defaultProps,
        riskMetrics: {
            positionSizePercent: 85,
            unrealizedPnlPercent: -8.5,
            volatilityRisk: 65,
            hasRealTimePrice: true,
        },
        overallRisk: 78,
        riskLevel: 'high',
        riskLabel: 'High Risk',
        riskDescription: 'High risk! Consider adjusting position or hedging.',
    },
    decorators: [(Story) => <div style={{ width: 400 }}><Story /></div>],
};

export const NoPosition: Story = {
    args: {
        ...defaultProps,
        riskMetrics: {
            positionSizePercent: 0,
            unrealizedPnlPercent: 0,
            volatilityRisk: 0,
            hasRealTimePrice: true,
        },
        overallRisk: 0,
        riskLevel: 'low',
    },
    decorators: [(Story) => <div style={{ width: 400 }}><Story /></div>],
};

export const Loading: Story = {
    args: {
        ...defaultProps,
        riskMetrics: null,
    },
};
