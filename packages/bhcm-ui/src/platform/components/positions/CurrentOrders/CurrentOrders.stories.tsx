import type { Meta, StoryObj } from '@storybook/react';
import CurrentOrdersView from './CurrentOrders.view';
import type { PaperOrder } from '../../../../../../sdk/utils/types/trading';

/* ═══════════════════════════════════════════════════════════
 * OPEN ORDERS STORIES
 * ═══════════════════════════════════════════════════════════
 * Storybook stories for the pure CurrentOrdersView component.
 * Since CurrentOrdersView takes all data as props, we can
 * easily mock different states without store setup.
 */

const meta: Meta<typeof CurrentOrdersView> = {
    title: 'Trading/CurrentOrders',
    component: CurrentOrdersView,
    parameters: {
        layout: 'padded',
        backgrounds: { default: 'dark' },
    },
    tags: ['autodocs'],
    argTypes: {
        onCancel: { action: 'orderCancelled' },
    },
};

export default meta;
type Story = StoryObj<typeof CurrentOrdersView>;

/* ─── Mock Data ─── */
const mockTranslations = {
    title: 'Open Orders',
    noOrders: 'No open orders',
};

const createMockOrder = (overrides: Partial<PaperOrder> = {}): PaperOrder => ({
    clientOrderId: `order-${Math.random().toString(36).slice(2)}`,
    symbol: 'BTCUSD',
    side: 'buy',
    type: 'limit',
    price: '98500.00',
    quantity: '0.001000',
    filledQty: '0',
    status: 'open',
    timestamp: Date.now(),
    ...overrides,
});

const mockOrders: PaperOrder[] = [
    createMockOrder({ status: 'open', side: 'buy', price: '98500.00' }),
    createMockOrder({ status: 'pending', side: 'sell', price: '99000.00' }),
    createMockOrder({
        status: 'partial',
        side: 'buy',
        price: '98000.00',
        quantity: '0.010000',
        filledQty: '0.003500',
    }),
    createMockOrder({ status: 'open', side: 'sell', symbol: 'ETHUSD', price: '3450.50' }),
];

/* ═══════════════════════════════════════════════════════════
 * STORIES
 * ═══════════════════════════════════════════════════════════
 */

/** Default state with multiple orders */
export const Default: Story = {
    args: {
        orders: mockOrders,
        hasOrders: true,
        translations: mockTranslations,
    },
};

/** Empty state - no orders */
export const Empty: Story = {
    args: {
        orders: [],
        hasOrders: false,
        translations: mockTranslations,
    },
};

/** Single buy order */
export const SingleBuyOrder: Story = {
    args: {
        orders: [createMockOrder({ side: 'buy', status: 'open' })],
        hasOrders: true,
        translations: mockTranslations,
    },
};

/** Single sell order */
export const SingleSellOrder: Story = {
    args: {
        orders: [createMockOrder({ side: 'sell', status: 'open' })],
        hasOrders: true,
        translations: mockTranslations,
    },
};

/** Partially filled order */
export const PartiallyFilled: Story = {
    args: {
        orders: [createMockOrder({
            status: 'partial',
            quantity: '0.100000',
            filledQty: '0.065000',
        })],
        hasOrders: true,
        translations: mockTranslations,
    },
};

/** Multiple pending orders */
export const AllPending: Story = {
    args: {
        orders: [
            createMockOrder({ status: 'pending', side: 'buy' }),
            createMockOrder({ status: 'pending', side: 'sell' }),
            createMockOrder({ status: 'pending', side: 'buy' }),
        ],
        hasOrders: true,
        translations: mockTranslations,
    },
};
