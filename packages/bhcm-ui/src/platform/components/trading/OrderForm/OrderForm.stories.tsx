import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import OrderFormView from './OrderForm.view';
import type { OrderFormViewProps } from './OrderForm.view';

/* ═══════════════════════════════════════════════════════════
 * OrderFormView Stories
 * ═══════════════════════════════════════════════════════════
 * The most complex trading component - supports spot, conditional, and OCO orders.
 */

// Wrapper to provide refs
function OrderFormWithRefs(props: Omit<OrderFormViewProps, 'priceInputRef' | 'quantityInputRef' | 'tpInputRef' | 'slInputRef'>) {
    const priceInputRef = useRef<HTMLInputElement>(null!);
    const quantityInputRef = useRef<HTMLInputElement>(null!);
    const tpInputRef = useRef<HTMLInputElement>(null!);
    const slInputRef = useRef<HTMLInputElement>(null!);
    return (
        <OrderFormView
            {...props}
            priceInputRef={priceInputRef}
            quantityInputRef={quantityInputRef}
            tpInputRef={tpInputRef}
            slInputRef={slInputRef}
        />
    );
}

const defaultForm = {
    side: 'buy' as const,
    orderCategory: 'spot' as const,
    type: 'limit' as const,
    price: '52500.00',
    quantity: '0.5',
    total: '26250.00',
    quantityPercent: 50,
    takeProfitPrice: '',
    stopLossPrice: '',
    triggerPrice: '',
    limitPrice: '',
    showTp: false,
    showSl: false,
    comment: '',
    trailingType: 'percent' as const,
    trailingValue: '',
    trailingActivationPrice: '',
};

const defaultProps: Omit<OrderFormViewProps, 'priceInputRef' | 'quantityInputRef' | 'tpInputRef' | 'slInputRef'> = {
    form: defaultForm,
    baseAsset: 'EUR',
    quoteAsset: 'USD',
    balances: {
        base: { asset: 'EUR', available: '1.5' },
        quote: { asset: 'USD', available: '50000.00' },
    },
    dataConfidence: { level: 'live', reason: 'Connected' },
    focusMode: false,
    estimated: { price: '52,500.00', slippage: '~0.02%', fee: '~26.25 USD' },
    isSubmitDisabled: false,
    showDegradedConfirm: false,
    translations: {
        title: 'Order Entry',
        buy: 'Buy',
        sell: 'Sell',
        limit: 'Limit',
        market: 'Market',
        price: 'Price',
        amount: 'Amount',
        total: 'Total',
        available: 'Available',
        takeProfit: 'TP',
        stopLoss: 'SL',
        estimatedPrice: 'Est. Price',
        slippage: 'Slippage',
        fee: 'Fee',
        bid1: 'Bid 1',
        mid: 'Mid',
        ask1: 'Ask 1',
        confirmDegraded: 'Data may be stale. Confirm order?',
        placeBuyOrder: 'Buy',
        placeSellOrder: 'Sell',
        invalidAmount: 'Invalid amount',
        invalidPrice: 'Invalid price',
        insufficientBalance: 'Insufficient balance',
    },
    onSideChange: () => { },
    onOrderCategoryChange: () => { },
    onTypeChange: () => { },
    onPriceChange: () => { },
    onQuantityChange: () => { },
    onTakeProfitPriceChange: () => { },
    onStopLossPriceChange: () => { },
    onTriggerPriceChange: () => { },
    onLimitPriceChange: () => { },
    onShowTpChange: () => { },
    onShowSlChange: () => { },
    onCommentChange: () => { },
    onTrailingTypeChange: () => { },
    onTrailingValueChange: () => { },
    onTrailingActivationPriceChange: () => { },
    onQuantityPercentChange: () => { },
    onSetFromBestBid: () => { },
    onSetFromBestAsk: () => { },
    onSetFromMid: () => { },
    onStepUp: () => { },
    onStepDown: () => { },
    onUpdateQuantityFromPercent: () => { },
    onInputFocus: () => () => { },
    onInputBlur: () => { },
    onSubmit: (e) => e.preventDefault(),
    onShowDegradedConfirm: () => { },
    onShowConfirmModal: () => { },
    onConfirmOrder: () => { },
    showConfirmModal: false,
    commonConfirm: 'Confirm',
    commonCancel: 'Cancel',
    bestBidPrice: '52495.00',
    bestAskPrice: '52500.50',
};

const meta: Meta<typeof OrderFormWithRefs> = {
    title: 'Trading/OrderFormView',
    component: OrderFormWithRefs,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Order entry form supporting spot, conditional, and OCO orders. Pure presentational - no store hooks.',
            },
        },
    },
    argTypes: {
        onSideChange: { action: 'side changed' },
        onOrderCategoryChange: { action: 'category changed' },
        onTypeChange: { action: 'type changed' },
        onSubmit: { action: 'submitted' },
    },
    args: {
        ...defaultProps,
        bestBidPrice: '52495.00',
        bestAskPrice: '52500.50',
    },
};

export default meta;
type Story = StoryObj<typeof OrderFormWithRefs>;

// ─── Spot Orders ───

export const SpotBuyLimit: Story = {
    args: defaultProps,
    decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};

export const SpotSellLimit: Story = {
    args: {
        ...defaultProps,
        form: { ...defaultForm, side: 'sell', quantity: '0.25' },
    },
    decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};

export const SpotMarket: Story = {
    args: {
        ...defaultProps,
        form: { ...defaultForm, type: 'market', price: '' },
    },
    decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};

// ─── Conditional Orders ───

export const ConditionalStopLimit: Story = {
    args: {
        ...defaultProps,
        form: {
            ...defaultForm,
            orderCategory: 'conditional',
            type: 'stop_limit',
            triggerPrice: '51000.00',
            limitPrice: '50800.00',
        },
    },
    decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};

export const ConditionalTrailingStop: Story = {
    args: {
        ...defaultProps,
        form: {
            ...defaultForm,
            orderCategory: 'conditional',
            type: 'trailing_stop',
            trailingType: 'percent',
            trailingValue: '2.0',
        },
    },
    decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};

export const WithTPSL: Story = {
    args: {
        ...defaultProps,
        form: {
            ...defaultForm,
            showTp: true,
            showSl: true,
            takeProfitPrice: '55000.00',
            stopLossPrice: '48000.00',
        },
    },
    decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};

export const EmptyForm: Story = {
    args: {
        ...defaultProps,
        form: { ...defaultForm, price: '', quantity: '', total: '' },
        isSubmitDisabled: true,
    },
    decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};
