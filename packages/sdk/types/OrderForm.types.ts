import type { OrderSide, OrderType } from './order.types.js';
import React from 'react';

/* ═══════════════════════════════════════════════════════════
 * ORDER FORM TYPES
 * ═══════════════════════════════════════════════════════════
 */

export type OrderCategory = 'spot' | 'conditional';

export type TrailingType = 'amount' | 'percentage';

export interface OrderFormFormState {
    side: OrderSide;
    orderCategory: OrderCategory;
    type: OrderType;
    price: string;
    quantity: string;
    total: string;
    quantityPercent: number;
    takeProfitPrice: string;
    stopLossPrice: string;
    triggerPrice: string;
    limitPrice: string;
    showTp: boolean;
    showSl: boolean;
    comment: string;
    trailingType: TrailingType;
    trailingValue: string;
    trailingActivationPrice: string;
}

export interface DataConfidenceInfo {
    level: string;
    reason: string;
}

export interface BalanceInfo {
    base: { asset: string; available: string };
    quote: { asset: string; available: string };
}

export interface EstimatedValues {
    price: string;
    slippage: string;
    fee: string;
}

export interface OrderFormTranslations {
    title: string;
    buy: string;
    sell: string;
    limit: string;
    market: string;
    price: string;
    amount: string;
    takeProfit: string;
    stopLoss: string;
    estimatedPrice: string;
    slippage: string;
    fee: string;
    total: string;
    available: string;
    bid1: string;
    mid: string;
    ask1: string;
    placeBuyOrder: string;
    placeSellOrder: string;
    confirmDegraded: string;
    invalidAmount: string;
    invalidPrice: string;
    invalidTrailingValue: string;
    invalidTriggerPrice: string;
    invalidLimitPrice: string;
    insufficientBalance: string;
}

/* ═══════════════════════════════════════════════════════════
 * NEW DATA/ACTIONS INTERFACES
 * ═══════════════════════════════════════════════════════════
 */

export interface OrderFormData {
    // Form State
    form: OrderFormFormState;

    // Context
    baseAsset: string;
    quoteAsset: string;
    balances: BalanceInfo;
    dataConfidence: DataConfidenceInfo;
    estimated: EstimatedValues;

    // UI State
    focusMode: boolean;
    isSubmitDisabled: boolean;
    showDegradedConfirm: boolean;
    showConfirmModal: boolean;

    // Market Data
    bestBidPrice: string;
    bestAskPrice: string;

    // Refs
    refs: {
        price: React.RefObject<HTMLInputElement | null>;
        quantity: React.RefObject<HTMLInputElement | null>;
        tp: React.RefObject<HTMLInputElement | null>;
        sl: React.RefObject<HTMLInputElement | null>;
    };

    // I18n
    translations: OrderFormTranslations;
    commonConfirm: string;
    commonCancel: string;

    // Validation
    errors: {
        price?: string;
        quantity?: string;
        triggerPrice?: string;
        limitPrice?: string;
        trailingValue?: string;
    };
}

export interface OrderFormActions {
    // Field Updates
    onSideChange: (side: OrderSide) => void;
    onOrderCategoryChange: (cat: OrderCategory) => void;
    onTypeChange: (type: OrderType) => void;
    onPriceChange: (val: string) => void;
    onQuantityChange: (val: string) => void;
    onTakeProfitPriceChange: (val: string) => void;
    onStopLossPriceChange: (val: string) => void;
    onTriggerPriceChange: (val: string) => void;
    onLimitPriceChange: (val: string) => void;
    onTrailingTypeChange: (type: TrailingType) => void;
    onTrailingValueChange: (val: string) => void;
    onTrailingActivationPriceChange: (val: string) => void;
    onQuantityPercentChange: (pct: number) => void;
    onShowTpChange: (show: boolean) => void;
    onShowSlChange: (show: boolean) => void;
    onCommentChange: (val: string) => void;

    // Quick Actions
    onSetFromBestBid: () => void;
    onSetFromBestAsk: () => void;
    onSetFromMid: () => void;
    onStepUp: () => void;
    onStepDown: () => void;
    onUpdateQuantityFromPercent: (pct: number) => void;

    // UI Actions
    onInputFocus: (inputName: string) => () => void;
    onInputBlur: () => void;
    onShowDegradedConfirm: (show: boolean) => void;
    onShowConfirmModal: (show: boolean) => void;

    // Submission
    onSubmit: (e: React.FormEvent) => void;
    onConfirmOrder: () => void;
}
