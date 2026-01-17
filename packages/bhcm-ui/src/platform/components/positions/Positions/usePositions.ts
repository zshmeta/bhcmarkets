import { useState, useMemo, useCallback } from 'react';
import Decimal from 'decimal.js';
import { useTradingStore } from '@repo/sdk';
import { useWalletStore, selectBalances } from '@repo/sdk';
import { useMarketStore, selectMetrics, selectLevel2Book } from '@repo/sdk';
import { useWatchlistStore, selectSelectedSymbol, selectSymbols } from '@repo/sdk';
import { useI18n } from '../../i18n';

/* ═══════════════════════════════════════════════════════════
 * usePositions Hook
 * ═══════════════════════════════════════════════════════════
 * Extracts all business logic from Positions component:
 * - Store subscriptions (positions, balances, market data)
 * - P&L calculations
 * - Position list transformation
 * - Modal state management
 */

import type { Position, PositionPnL, BalanceInfo, PositionsTranslations } from './Positions.types';

export interface UsePositionsReturn {
    /** List of active positions [symbol, position] */
    positionList: [string, Position][];
    /** Current symbol being viewed */
    currentSymbol: string;
    /** Current market price */
    currentPrice: number;
    /** Total unrealized P&L */
    totalPnL: number;
    /** USDT balance info */
    usdtBalance: BalanceInfo | undefined;
    /** Translations */
    translations: PositionsTranslations;

    // Modal state
    confirmClose: string | null;
    tpslSymbol: string | null;

    // Calculations
    calculatePnL: (pos: Position) => PositionPnL;
    getPrice: (symbol: string) => number;

    // Actions
    setConfirmClose: (symbol: string | null) => void;
    setTPSLSymbol: (symbol: string | null) => void;
    handleClosePosition: () => void;
    // Privacy
    privacyMode: boolean;
    onTogglePrivacy: () => void;
}

const usePositions = (): UsePositionsReturn => {
    const { t } = useI18n();

    // Store subscriptions - use correct API from stores
    const balances = useWalletStore(selectBalances);
    const positions = useTradingStore((state) => state.positions);
    const metrics = useMarketStore(selectMetrics);
    const Level2Book = useMarketStore(selectLevel2Book);
    const selectedSymbol = useWatchlistStore(selectSelectedSymbol);
    const allSymbols = useWatchlistStore(selectSymbols);

    // Modal state
    const [confirmClose, setConfirmClose] = useState<string | null>(null);
    const [tpslSymbol, setTPSLSymbol] = useState<string | null>(null);

    // Derived values
    const currentSymbol = Level2Book?.symbol || selectedSymbol;
    const currentPrice = metrics ? parseFloat(metrics.mid) : 0;

    // Create a price map for ALL symbols to support PnL calculation across different assets
    const priceMap = useMemo(() => {
        const map = new Map<string, number>();
        allSymbols.forEach(s => {
            map.set(s.symbol, parseFloat(s.price || '0'));
        });
        return map;
    }, [allSymbols]);

    // Convert positions to array
    const positionList = useMemo((): [string, Position][] => {
        let entries: [string, Position][] = [];
        if (positions instanceof Map) {
            entries = Array.from(positions.entries()) as [string, Position][];
        } else if (typeof positions === 'object' && positions !== null) {
            entries = Object.entries(positions) as [string, Position][];
        }
        return entries.filter(([_, pos]) => pos.side === 'long' && parseFloat(pos.quantity) > 0);
    }, [positions]);

    // Calculate P&L for a position
    const calculatePnL = useCallback((pos: Position): PositionPnL => {
        const qty = new Decimal(pos.quantity);
        const entry = new Decimal(pos.avgEntryPrice);
        
        // Use the price from the map (all symbols), fallback to currentPrice if active symbol, or 0
        let marketPrice = priceMap.get(pos.symbol) || 0;
        
        // Fallback for the active symbol if it hasn't updated in the watchlist store yet
        if (marketPrice === 0 && pos.symbol === currentSymbol) {
            marketPrice = currentPrice;
        }

        if (marketPrice === 0) {
            return { pnl: null, pnlPercent: null, hasPrice: false };
        }

        const price = new Decimal(marketPrice);
        const pnl = qty.times(price.minus(entry));
        const pnlPercent = entry.gt(0) ? price.minus(entry).div(entry).times(100).toNumber() : 0;

        return { pnl: pnl.toNumber(), pnlPercent, hasPrice: true };
    }, [priceMap, currentSymbol, currentPrice]);

    const getPrice = useCallback((symbol: string): number => {
        return priceMap.get(symbol) || (symbol === currentSymbol ? currentPrice : 0);
    }, [priceMap, currentSymbol, currentPrice]);

    // Total unrealized P&L
    const totalPnL = useMemo(() => {
        return positionList.reduce((sum, [_, pos]) => {
            const { pnl } = calculatePnL(pos);
            return sum + (pnl || 0);
        }, 0);
    }, [positionList, calculatePnL]);

    // Close position handler - resets confirmation, actual close would need market order
    const handleClosePosition = useCallback(() => {
        if (confirmClose) {
            // Note: Full position close would require creating a market sell order
            // For now, just close the confirmation modal
            setConfirmClose(null);
        }
    }, [confirmClose]);

    // Privacy mode state
    const [privacyMode, setPrivacyMode] = useState(false);

    const togglePrivacy = useCallback(() => {
        setPrivacyMode((prev) => !prev);
    }, []);

    // Balance info - use 'frozen' from WalletBalance, map to 'locked' for display
    const usdtBalance = useMemo(() => {
        const balance = balances.find((b) => b.asset === 'USDT');
        return balance ? {
            asset: balance.asset,
            available: balance.available,
            locked: balance.frozen, // WalletBalance uses 'frozen', display as 'locked'
        } : undefined;
    }, [balances]);

    // Translations - use correct i18n keys
    const translations = useMemo((): PositionsTranslations => ({
        title: t.positions?.title || 'Positions',
        noPositions: t.positions?.noPositions || 'No open positions',
        symbol: t.positions?.symbol || 'Symbol',
        quantity: t.positions?.amount || 'Qty',
        entryPrice: t.positions?.avgPrice || 'Entry',
        marketPrice: t.positions?.currentPrice || 'Mark',
        pnl: t.positions?.unrealizedPnL || 'P&L',
        actions: t.positions?.close || 'Actions',
        tpsl: {
            takeProfit: t.tpsl?.takeProfit || 'Take Profit',
            stopLoss: t.tpsl?.stopLoss || 'Stop Loss',
            triggerPrice: t.tpsl?.triggerPrice || 'Trigger Price',
            save: t.tpsl?.save || 'Save',
            cancel: t.tpsl?.cancel || 'Cancel',
            close: t.tpsl?.close || 'Close',
            error: t.tpsl?.error || 'Error',
            success: t.tpsl?.success || 'TP/SL updated',
        },
    }), [t]);

    return {
        positionList,
        currentSymbol,
        currentPrice,
        totalPnL,
        usdtBalance,
        translations,
        confirmClose,
        tpslSymbol,
        calculatePnL,
        getPrice,
        setConfirmClose,
        setTPSLSymbol,
        handleClosePosition,
        privacyMode,
        onTogglePrivacy: togglePrivacy,
    };
}

export { usePositions };
