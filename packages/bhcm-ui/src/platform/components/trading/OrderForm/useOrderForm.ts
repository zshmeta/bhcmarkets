import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { clamp } from '../../../../../../sdk/utils';
import { useMarketStore, selectLevel2Book, selectMetrics, selectBestBid, selectBestAsk, selectDataConfidence } from '@repo/sdk';
import { useTradingStore, selectFocusMode } from '@repo/sdk';
import { useWalletStore, selectBalances } from '@repo/sdk';
import { useI18n, formatMessage } from '../../i18n';
import { toast } from '../Toast';
import type { OrderSide, OrderType, TrailingType } from '../../types/trading';
import type {
    OrderCategory,
    OrderFormFormState,
    DataConfidenceInfo,
    BalanceInfo,
    EstimatedValues,
    OrderFormTranslations,
    OrderFormData,
    OrderFormActions
} from './OrderForm.types';

/* ═══════════════════════════════════════════════════════════
 * useOrderForm Hook
 * ═══════════════════════════════════════════════════════════
 * Extracts all business logic from OrderForm component:
 * - Form state management (20+ fields)
 * - Store subscriptions (market, trading, wallet)
 * - Order validation and submission
 * - Focus mode handling
 * - Confirmation modal state
 */

export interface UseOrderFormReturn {
    data: OrderFormData;
    actions: OrderFormActions;
}

const useOrderForm = (
    priceFromLevel2Book?: string,
    sideFromLevel2Book?: OrderSide
): UseOrderFormReturn => {
    const { t } = useI18n();

    // ─── Form State ───
    const [side, setSide] = useState<OrderSide>(() => sideFromLevel2Book ?? 'buy');
    const [orderCategory, setOrderCategoryState] = useState<OrderCategory>('spot');
    const [type, setType] = useState<OrderType>('limit');
    const [price, setPrice] = useState(() => priceFromLevel2Book ?? '');
    const [quantity, setQuantity] = useState('');
    const [quantityPercent, setQuantityPercent] = useState(0);
    const [takeProfitPrice, setTakeProfitPrice] = useState('');
    const [stopLossPrice, setStopLossPrice] = useState('');
    const [showDegradedConfirm, setShowDegradedConfirm] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Conditional order fields
    const [triggerPrice, setTriggerPrice] = useState('');
    const [limitPrice, setLimitPrice] = useState('');

    const [showTp, setShowTp] = useState(false);
    const [showSl, setShowSl] = useState(false);
    const [comment, setComment] = useState('');

    // Trailing stop fields
    const [trailingType, setTrailingType] = useState<TrailingType>('percent');
    const [trailingValue, setTrailingValue] = useState('');
    const [trailingActivationPrice, setTrailingActivationPrice] = useState('');

    // ─── Store Subscriptions ───
    const Level2Book = useMarketStore(selectLevel2Book);
    const metrics = useMarketStore(selectMetrics);
    const bestBid = useMarketStore(selectBestBid);
    const bestAsk = useMarketStore(selectBestAsk);
    const dataConfidence = useMarketStore(selectDataConfidence);
    const storeBalances = useWalletStore(selectBalances);
    const focusMode = useTradingStore(selectFocusMode);
    const createOrder = useTradingStore((state) => state.createOrder);
    const createTrailingStopOrder = useTradingStore((state) => state.createTrailingStopOrder);
    const setFocusMode = useTradingStore((state) => state.setFocusMode);

    // ─── Refs ───
    const priceInputRef = useRef<HTMLInputElement>(null);
    const quantityInputRef = useRef<HTMLInputElement>(null);
    const tpInputRef = useRef<HTMLInputElement>(null);
    const slInputRef = useRef<HTMLInputElement>(null);
    const isInputFocused = useRef(false);
    const activeInputRef = useRef<string | null>(null);

    // ─── Derived Values ───
    const symbol = Level2Book?.symbol ?? 'BTCUSDT';
    const baseAsset = symbol.replace('USDT', '');
    const quoteAsset = 'USDT';
    const baseBalance = storeBalances.find(b => b.asset === baseAsset);
    const quoteBalance = storeBalances.find(b => b.asset === quoteAsset);

    const setOrderCategory = useCallback((cat: OrderCategory) => {
        setOrderCategoryState(cat);
        if (cat === 'spot') {
            setType('limit');
            setTriggerPrice('');
            setLimitPrice('');
        } else {
            setType('stop_limit');
            if (priceFromLevel2Book) {
                setTriggerPrice(priceFromLevel2Book);
            }
        }
    }, [priceFromLevel2Book]);

    // ─── Calculate Total (Derived) ───
    const total = useMemo(() => {
        let priceForCalc = '0';
        if (orderCategory === 'spot') {
            if (type === 'limit' && price) priceForCalc = price;
            else if (type === 'market' && metrics) priceForCalc = metrics.mid;
        } else if (orderCategory === 'conditional') {
            if (['stop_limit', 'take_profit_limit'].includes(type) && limitPrice) priceForCalc = limitPrice;
            else if (triggerPrice) priceForCalc = triggerPrice;
        }

        if (priceForCalc && quantity) {
            const p = parseFloat(priceForCalc);
            const q = parseFloat(quantity);
            return !isNaN(p) && !isNaN(q) ? (p * q).toFixed(2) : '0';
        }
        return '0';
    }, [price, quantity, type, metrics, orderCategory, triggerPrice, limitPrice]);

    // ─── Max Quantity Calculation ───
    const getMaxQuantity = useCallback(() => {
        if (side === 'buy' && quoteBalance && metrics) {
            const av = parseFloat(quoteBalance.available);
            const p = type === 'limit' && price ? parseFloat(price) : parseFloat(metrics.mid);
            return p > 0 ? av / p : 0;
        } else if (side === 'sell' && baseBalance) {
            return parseFloat(baseBalance.available);
        }
        return 0;
    }, [side, type, price, quoteBalance, baseBalance, metrics]);

    const updateQuantityFromPercent = useCallback((pct: number) => {
        const max = getMaxQuantity();
        setQuantityPercent(clamp(pct, 0, 100));
        if (max > 0) setQuantity((max * pct / 100).toFixed(6));
    }, [getMaxQuantity]);

    // ─── Quick Fill Handlers ───
    const setFromBestBid = useCallback(() => {
        if (bestBid) { setPrice(bestBid.price); setSide('buy'); }
    }, [bestBid]);

    const setFromBestAsk = useCallback(() => {
        if (bestAsk) { setPrice(bestAsk.price); setSide('sell'); }
    }, [bestAsk]);

    const setFromMid = useCallback(() => {
        if (metrics) setPrice(metrics.mid);
    }, [metrics]);

    // ─── Step Buttons ───
    const handleStepUp = useCallback(() => {
        if (price) {
            const p = parseFloat(price);
            if (!isNaN(p)) {
                const step = p >= 1 ? 0.01 : 0.0001;
                setPrice((p + step).toFixed(p >= 1 ? 2 : 4));
            }
        }
    }, [price]);

    const handleStepDown = useCallback(() => {
        if (price) {
            const p = parseFloat(price);
            if (!isNaN(p)) {
                const step = p >= 1 ? 0.01 : 0.0001;
                setPrice(Math.max(0, p - step).toFixed(p >= 1 ? 2 : 4));
            }
        }
    }, [price]);

    // ─── Keyboard Navigation ───
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement === priceInputRef.current) {
                if (e.key === 'ArrowUp') { e.preventDefault(); handleStepUp(); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); handleStepDown(); }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleStepUp, handleStepDown]);

    // ─── Focus Mode Handlers ───
    const handleInputFocus = useCallback((inputName: string) => () => {
        isInputFocused.current = true;
        activeInputRef.current = inputName;
        setFocusMode(true);
    }, [setFocusMode]);

    const handleInputBlur = useCallback(() => {
        isInputFocused.current = false;
        setTimeout(() => {
            if (!isInputFocused.current) {
                setFocusMode(false);
                activeInputRef.current = null;
            }
        }, 100);
    }, [setFocusMode]);

    // ─── Form Submission ───
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (dataConfidence.level === 'stale') {
            toast.warning(t.dataConfidence.staleDesc);
            return;
        }
        if (dataConfidence.level === 'degraded' && !showDegradedConfirm) {
            setShowDegradedConfirm(true);
            return;
        }
        if (!quantity || parseFloat(quantity) <= 0) {
            toast.warning(t.OrderForm.invalidAmount);
            return;
        }

        let order = null;

        if (orderCategory === 'spot') {
            if (type === 'limit' && (!price || parseFloat(price) <= 0)) {
                toast.warning(t.OrderForm.invalidPrice);
                return;
            }
            order = await createOrder({
                symbol, side, type,
                price: type === 'limit' ? price : undefined,
                quantity,
                takeProfitPrice: takeProfitPrice || undefined,
                stopLossPrice: stopLossPrice || undefined,
            });

        } else if (orderCategory === 'conditional') {
            if (type === 'trailing_stop') {
                if (!trailingValue || parseFloat(trailingValue) <= 0) {
                    toast.warning(t.OrderForm.invalidTrailingValue);
                    return;
                }
                order = await createTrailingStopOrder({
                    symbol, side, quantity,
                    trailingType,
                    trailingValue,
                    activationPrice: trailingActivationPrice || undefined,
                });
            } else {
                if (!triggerPrice || parseFloat(triggerPrice) <= 0) {
                    toast.warning(t.OrderForm.invalidTriggerPrice);
                    return;
                }
                if (['stop_limit', 'take_profit_limit'].includes(type) && (!limitPrice || parseFloat(limitPrice) <= 0)) {
                    toast.warning(t.OrderForm.invalidLimitPrice);
                    return;
                }
                order = await createOrder({
                    symbol, side, type,
                    triggerPrice,
                    price: ['stop_limit', 'take_profit_limit'].includes(type) ? limitPrice : undefined,
                    quantity,
                });
            }
        }

        if (order) {
            toast.success(t.toast.orderSubmitted);
            // Reset form
            setQuantity('');
            setQuantityPercent(0);
            if (!showTp) setTakeProfitPrice('');
            if (!showSl) setStopLossPrice('');
            setTriggerPrice('');
            setLimitPrice('');
            setTrailingValue('');
            setTrailingActivationPrice('');
            setComment('');
            if (type === 'limit') setPrice('');
            setShowDegradedConfirm(false);
            setShowConfirmModal(false);
            setFocusMode(false);
        } else {
            toast.error(t.OrderForm.insufficientBalance);
        }
    }, [
        dataConfidence, t, quantity, price, type, side, symbol, orderCategory,
        takeProfitPrice, stopLossPrice, triggerPrice, limitPrice, trailingType,
        trailingValue, trailingActivationPrice, showTp, showSl,
        showDegradedConfirm, createOrder,
        createTrailingStopOrder, setFocusMode
    ]);

    const handleConfirmOrder = useCallback(() => {
        // The view's modal is currently informational; submission happens via the form.
        setShowConfirmModal(false);
    }, []);

    // ─── Submit Button Validation ───
    const isSubmitDisabled = useMemo(() => {
        if (dataConfidence.level === 'stale' || dataConfidence.level === 'resyncing') return true;
        if (!quantity || parseFloat(quantity) <= 0) return true;

        if (orderCategory === 'spot') {
            if (type === 'limit' && (!price || parseFloat(price) <= 0)) return true;
        } else if (orderCategory === 'conditional') {
            if (type === 'trailing_stop') {
                if (!trailingValue || parseFloat(trailingValue) <= 0) return true;
            } else {
                if (!triggerPrice || parseFloat(triggerPrice) <= 0) return true;
                if (['stop_limit', 'take_profit_limit'].includes(type) && (!limitPrice || parseFloat(limitPrice) <= 0)) return true;
            }
        }
        return false;
    }, [dataConfidence, quantity, price, type, orderCategory, triggerPrice, limitPrice, trailingValue]);

    // ─── Estimated Values ───
    const estimated = useMemo((): EstimatedValues => {
        const estimatedPrice = type === 'market' && metrics
            ? metrics.mid
            : (type === 'limit' ? price : (triggerPrice || '—'));
        const slippage = metrics?.slippageEst && metrics.slippageEst !== 'N/A'
            ? `${metrics.slippageEst}bp`
            : '—';
        const fee = total !== '0' ? (parseFloat(total) * 0.001).toFixed(2) : '0';
        return { price: estimatedPrice || '—', slippage, fee };
    }, [type, price, triggerPrice, metrics, total]);

    // ─── Balances for View ───
    const balances: BalanceInfo = useMemo(() => ({
        base: { asset: baseAsset, available: baseBalance?.available ?? '0' },
        quote: { asset: quoteAsset, available: quoteBalance?.available ?? '0' },
    }), [baseAsset, quoteAsset, baseBalance, quoteBalance]);

    // ─── Translations ───
    const translations = useMemo((): OrderFormTranslations => ({
        title: t.OrderForm.title,
        buy: t.OrderForm.buy,
        sell: t.OrderForm.sell,
        limit: t.OrderForm.limit,
        market: t.OrderForm.market,
        price: t.OrderForm.price,
        amount: t.OrderForm.amount,
        takeProfit: t.OrderForm.takeProfit,
        stopLoss: t.OrderForm.stopLoss,
        estimatedPrice: t.OrderForm.estimatedPrice,
        slippage: t.OrderForm.slippage,
        fee: t.OrderForm.fee,
        total: t.OrderForm.total,
        available: t.OrderForm.available,
        bid1: t.OrderForm.bid1,
        mid: t.OrderForm.mid,
        ask1: t.OrderForm.ask1,
        placeBuyOrder: t.OrderForm.placeBuyOrder,
        placeSellOrder: t.OrderForm.placeSellOrder,
        confirmDegraded: t.OrderForm.confirmDegraded,
        invalidAmount: t.OrderForm.invalidAmount,
        invalidPrice: t.OrderForm.invalidPrice,
        invalidTrailingValue: t.OrderForm.invalidTrailingValue,
        invalidTriggerPrice: t.OrderForm.invalidTriggerPrice,
        invalidLimitPrice: t.OrderForm.invalidLimitPrice,
        insufficientBalance: t.OrderForm.insufficientBalance,
    }), [t]);

    // ─── Validation ───
    const errors = useMemo(() => {
        const errs: OrderFormData['errors'] = {};
        
        // Quantity validation
        if (quantity && parseFloat(quantity) > 0) {
            const max = getMaxQuantity();
            if (parseFloat(quantity) > max) {
                errs.quantity = t.OrderForm.insufficientBalance;
            }
        } else if (quantity && parseFloat(quantity) <= 0) {
             errs.quantity = t.OrderForm.invalidAmount;
        }

        // Price validation
        if (type === 'limit' && price && parseFloat(price) <= 0) {
            errs.price = t.OrderForm.invalidPrice;
        }

        // Conditional validation
        if (orderCategory === 'conditional') {
            if (type === 'trailing_stop') {
                if (trailingValue && parseFloat(trailingValue) <= 0) {
                    errs.trailingValue = t.OrderForm.invalidTrailingValue;
                }
            } else {
                 if (triggerPrice && parseFloat(triggerPrice) <= 0) {
                    errs.triggerPrice = t.OrderForm.invalidTriggerPrice;
                 }
                 if (['stop_limit', 'take_profit_limit'].includes(type) && limitPrice && parseFloat(limitPrice) <= 0) {
                     errs.limitPrice = t.OrderForm.invalidLimitPrice;
                 }
            }
        }
        return errs;
    }, [quantity, price, type, orderCategory, trailingValue, triggerPrice, limitPrice, getMaxQuantity, t]);

    // ─── Form State Object ───
    const form: OrderFormFormState = {
        side, orderCategory, type, price, quantity, total, quantityPercent,
        takeProfitPrice, stopLossPrice, triggerPrice, limitPrice,
        showTp, showSl, comment,
        trailingType, trailingValue, trailingActivationPrice,
    };

    return {
        data: {
            form,
            baseAsset,
            quoteAsset,
            balances,
            dataConfidence: { level: dataConfidence.level, reason: dataConfidence.reason },
            estimated,
            focusMode,
            isSubmitDisabled,
            showDegradedConfirm,
            showConfirmModal,
            translations,
            bestBidPrice: bestBid?.price || metrics?.mid || '0.00',
            bestAskPrice: bestAsk?.price || metrics?.mid || '0.00',
            refs: {
                price: priceInputRef,
                quantity: quantityInputRef,
                tp: tpInputRef,
                sl: slInputRef,
            },
            commonConfirm: t.common.confirm,
            commonCancel: t.common.cancel,
            errors,
        },
        actions: {
            onSideChange: setSide,
            onOrderCategoryChange: setOrderCategory,
            onTypeChange: setType,
            onPriceChange: setPrice,
            onQuantityChange: setQuantity,
            onTakeProfitPriceChange: setTakeProfitPrice,
            onStopLossPriceChange: setStopLossPrice,
            onTriggerPriceChange: setTriggerPrice,
            onLimitPriceChange: setLimitPrice,
            onTrailingTypeChange: setTrailingType,
            onTrailingValueChange: setTrailingValue,
            onTrailingActivationPriceChange: setTrailingActivationPrice,
            onQuantityPercentChange: setQuantityPercent,
            onShowTpChange: setShowTp,
            onShowSlChange: setShowSl,
            onCommentChange: setComment,
            onSetFromBestBid: setFromBestBid,
            onSetFromBestAsk: setFromBestAsk,
            onSetFromMid: setFromMid,
            onStepUp: handleStepUp,
            onStepDown: handleStepDown,
            onUpdateQuantityFromPercent: updateQuantityFromPercent,
            onInputFocus: handleInputFocus,
            onInputBlur: handleInputBlur,
            onSubmit: handleSubmit,
            onShowDegradedConfirm: setShowDegradedConfirm,
            onShowConfirmModal: setShowConfirmModal,
            onConfirmOrder: handleConfirmOrder,
        }
    };
}

export { useOrderForm };
