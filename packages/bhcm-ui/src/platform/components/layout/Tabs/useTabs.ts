import { useState, useCallback, useMemo } from 'react';
import { useTradingStore } from '../../store/tradingStore';
import { useAutomationStore } from '../../store/automationStore';
import { useWatchlistStore, selectSelectedSymbol } from '../../store/watchlistStore';

/* ═══════════════════════════════════════════════════════════
 * useTabs Hook
 * ═══════════════════════════════════════════════════════════
 * Extracts business logic from Tabs component:
 * - Tab state management
 * - Store subscriptions for badge counts
 * - Selected symbol tracking
 */

export type LeftTab = 'positions' | 'orders' | 'Level2Book';
export type RightTab = 'create' | 'triggers';

export interface AutomationCounts {
    armed: number;
    paused: number;
    triggered: number;
}

export interface UseTabsReturn {
    // Tab state
    leftTab: LeftTab;
    rightTab: RightTab;

    // Badge counts
    positionsCount: number;
    CurrentOrdersCount: number;
    triggersCount: number;
    automationCounts: AutomationCounts;

    // Symbol
    selectedSymbol: string;

    // Actions
    setLeftTab: (tab: LeftTab) => void;
    setRightTab: (tab: RightTab) => void;
    handlePriceClick: (price: string, side?: 'buy' | 'sell') => void;
    goToTriggers: () => void;
}

const useTabs = (
    onPriceClick?: (price: string, side?: 'buy' | 'sell') => void
): UseTabsReturn => {
    // Tab state
    const [leftTab, setLeftTab] = useState<LeftTab>('positions');
    const [rightTab, setRightTab] = useState<RightTab>('create');

    // Store subscriptions
    const CurrentOrdersCount = useTradingStore((state) => state.getCurrentOrders().length);
    const positions = useTradingStore((state) => state.positions);
    const triggers = useAutomationStore((state) => state.triggers);
    const selectedSymbol = useWatchlistStore(selectSelectedSymbol);

    // Computed: positions count
    const positionsCount = useMemo(() => {
        let entries: [string, any][] = [];
        if (positions instanceof Map) {
            entries = Array.from(positions.entries());
        } else if (typeof positions === 'object' && positions !== null) {
            entries = Object.entries(positions);
        }
        return entries.filter(([_, pos]) => parseFloat(pos.quantity) > 0).length;
    }, [positions]);

    // Computed: triggers count (enabled only)
    const triggersCount = useMemo(() => {
        return triggers.filter((t) => t.enabled).length;
    }, [triggers]);

    // Computed: automation status counts
    const automationCounts = useMemo((): AutomationCounts => {
        return {
            armed: triggers.filter((t) => t.enabled && t.status === 'armed').length,
            paused: triggers.filter((t) => !t.enabled || t.status === 'paused').length,
            triggered: triggers.filter((t) => t.status === 'triggered' || t.status === 'completed').length,
        };
    }, [triggers]);

    // Price click handler
    const handlePriceClick = useCallback(
        (price: string, side?: 'buy' | 'sell') => {
            onPriceClick?.(price, side);
        },
        [onPriceClick]
    );

    // Navigate to triggers tab
    const goToTriggers = useCallback(() => {
        setRightTab('triggers');
    }, []);

    return {
        leftTab,
        rightTab,
        positionsCount,
        CurrentOrdersCount,
        triggersCount,
        automationCounts,
        selectedSymbol,
        setLeftTab,
        setRightTab,
        handlePriceClick,
        goToTriggers,
    };
}

export { useTabs };
