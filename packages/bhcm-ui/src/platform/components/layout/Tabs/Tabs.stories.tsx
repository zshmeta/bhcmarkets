import type { Meta, StoryObj } from '@storybook/react';
import TabsView from './Tabs.view';

/* ═══════════════════════════════════════════════════════════
 * TabsView Stories
 * ═══════════════════════════════════════════════════════════
 * Note: This component renders child components (Positions, CurrentOrders, etc.)
 * In Storybook, those will need their own mocking or we show structure only.
 */

const defaultProps = {
    leftTab: 'positions' as const,
    rightTab: 'create' as const,
    positionsCount: 2,
    CurrentOrdersCount: 5,
    triggersCount: 3,
    automationCounts: {
        armed: 2,
        paused: 1,
        triggered: 5,
    },
    selectedSymbol: 'BTCUSD',
    onLeftTabChange: () => { },
    onRightTabChange: () => { },
    onPriceClick: () => { },
    onTriggerSuccess: () => { },
};

const meta: Meta<typeof TabsView> = {
    title: 'Layout/TabsView',
    component: TabsView,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Two-column tabbed layout for positions, orders, and automation.',
            },
        },
    },
    argTypes: {
        leftTab: {
            control: 'select',
            options: ['positions', 'orders', 'Level2Book'],
        },
        rightTab: {
            control: 'select',
            options: ['create', 'triggers'],
        },
        onLeftTabChange: { action: 'left tab changed' },
        onRightTabChange: { action: 'right tab changed' },
        onPriceClick: { action: 'price clicked' },
        onTriggerSuccess: { action: 'trigger success' },
    },
};

export default meta;
type Story = StoryObj<typeof TabsView>;

export const Default: Story = {
    args: defaultProps,
    decorators: [(Story) => <div style={{ height: 400 }}><Story /></div>],
};

export const PositionsTab: Story = {
    args: { ...defaultProps, leftTab: 'positions' },
    decorators: [(Story) => <div style={{ height: 400 }}><Story /></div>],
};

export const OrdersTab: Story = {
    args: { ...defaultProps, leftTab: 'orders', CurrentOrdersCount: 8 },
    decorators: [(Story) => <div style={{ height: 400 }}><Story /></div>],
};

export const Level2BookTab: Story = {
    args: { ...defaultProps, leftTab: 'Level2Book' },
    decorators: [(Story) => <div style={{ height: 400 }}><Story /></div>],
};

export const TriggersTab: Story = {
    args: { ...defaultProps, rightTab: 'triggers', triggersCount: 7 },
    decorators: [(Story) => <div style={{ height: 400 }}><Story /></div>],
};

export const NoBadges: Story = {
    args: {
        ...defaultProps,
        positionsCount: 0,
        CurrentOrdersCount: 0,
        triggersCount: 0,
        automationCounts: { armed: 0, paused: 0, triggered: 0 },
    },
    decorators: [(Story) => <div style={{ height: 400 }}><Story /></div>],
};
