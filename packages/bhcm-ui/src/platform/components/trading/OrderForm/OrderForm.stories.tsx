import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import { OrderFormView } from './OrderForm.view';
import type { OrderFormViewProps } from './OrderForm.view';
import type { OrderFormData, OrderFormActions, OrderFormFormState } from '@repo/sdk';

/* ═══════════════════════════════════════════════════════════
 * OrderFormView Stories
 * ═══════════════════════════════════════════════════════════
 * The most complex trading component - supports spot, conditional, and OCO orders.
 */

// Wrapper to provide refs
// Stories will pass partial data, and this wrapper fills in the refs
type StoryProps = Omit<OrderFormData, 'refs'> & { actions: OrderFormActions };

function OrderFormWithRefs({ actions, ...dataProps }: StoryProps) {
    const priceInputRef = useRef<HTMLInputElement>(null);
    const quantityInputRef = useRef<HTMLInputElement>(null);
    const tpInputRef = useRef<HTMLInputElement>(null);
    const slInputRef = useRef<HTMLInputElement>(null);

    const fullData: OrderFormData = {
        ...dataProps,
        refs: {
            price: priceInputRef,
            quantity: quantityInputRef,
            tp: tpInputRef,
            sl: slInputRef,
        }
    };

    return <OrderFormView data={fullData} actions={actions} />;
}

const defaultForm: OrderFormFormState = {
    side: 'buy',
    orderCategory: 'spot',
    type: 'limit',
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
    trailingType: 'percent',
    trailingValue: '',
    trailingActivationPrice: '',
};

const defaultTranslations = {
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
    invalidTrailingValue: 'Invalid trailing value',
    invalidTriggerPrice: 'Invalid trigger price',
    invalidLimitPrice: 'Invalid limit price',
    insufficientBalance: 'Insufficient balance',
};

const defaultData: Omit<OrderFormData, 'refs'> = {
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
    showConfirmModal: false,
    translations: defaultTranslations,
    commonConfirm: 'Confirm',
    commonCancel: 'Cancel',
    bestBidPrice: '52495.00',
    bestAskPrice: '52500.50',
};

const defaultActions: OrderFormActions = {
    onSideChange: () => { },
    onOrderCategoryChange: () => { },
    onTypeChange: () => { },
    onPriceChange: () => { },
    onQuantityChange: () => { },
    onTakeProfitPriceChange: () => { },
    onStopLossPriceChange: () => { },
    onTriggerPriceChange: () => { },
    onLimitPriceChange: () => { },
    onTrailingTypeChange: () => { },
    onTrailingValueChange: () => { },
    onTrailingActivationPriceChange: () => { },
    onQuantityPercentChange: () => { },
    onShowTpChange: () => { },
    onShowSlChange: () => { },
    onCommentChange: () => { },
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
        // We can't map actions easily with the new structure in Storybook 7 unless we flatten them
        // For now we just use the defaultActions
    },
    args: {
        ...defaultData,
        actions: defaultActions,
    },
};

export default meta;
type Story = StoryObj<typeof OrderFormWithRefs>;

// ─── Spot Orders ───

export const SpotBuyLimit: Story = {
    args: {
        ...defaultData,
        actions: defaultActions,
    },
    decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};

export const SpotSellLimit: Story = {
    args: {
        ...defaultData,
        form: { ...defaultForm, side: 'sell', quantity: '0.25' },
        actions: defaultActions,
    },
    decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};

export const SpotMarket: Story = {
    args: {
        ...defaultData,
        form: { ...defaultForm, type: 'market', price: '' },
        actions: defaultActions,
    },
    decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};

// ─── Conditional Orders ───

export const ConditionalStopLimit: Story = {
    args: {
        ...defaultData,
        form: {
            ...defaultForm,
            orderCategory: 'conditional',
            type: 'stop_limit',
            triggerPrice: '51000.00',
            limitPrice: '50800.00',
        },
        actions: defaultActions,
    },
    decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};

export const ConditionalTrailingStop: Story = {
    args: {
        ...defaultData,
        form: {
            ...defaultForm,
            orderCategory: 'conditional',
            type: 'trailing_stop',
            trailingType: 'percent',
            trailingValue: '2.0',
        },
        actions: defaultActions,
    },
    decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};

export const WithTPSL: Story = {
    args: {
        ...defaultData,
        form: {
            ...defaultForm,
            showTp: true,
            showSl: true,
            takeProfitPrice: '55000.00',
            stopLossPrice: '48000.00',
        },
        actions: defaultActions,
    },
    decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};

export const EmptyForm: Story = {
    args: {
        ...defaultData,
        form: { ...defaultForm, price: '', quantity: '', total: '' },
        isSubmitDisabled: true,
        actions: defaultActions,
    },
    decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
};
