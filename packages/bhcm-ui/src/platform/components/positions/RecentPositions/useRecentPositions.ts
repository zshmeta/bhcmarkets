import { useMarketStore, selectRecentPositions } from '../../store/marketStore';
import { useI18n } from '../../i18n';
import type { Trade } from '../../../../../../sdk/utils/types/market';

/* ═══════════════════════════════════════════════════════════
 * useRecentPositions Hook
 * ═══════════════════════════════════════════════════════════
 * Extracts all business logic from RecentPositions component:
 * - Store subscription for trades
 * - Translations
 * - Slice logic for compact mode
 */

export interface UseRecentPositionsReturn {
    /** Recent trades list (already sliced based on compact mode) */
    trades: Trade[];
    /** Whether there are any trades */
    hasTrades: boolean;
    /** Translations */
    translations: {
        title: string;
        price: string;
        amount: string;
        time: string;
        noTrades: string;
    };
}

const useRecentPositions = (compact: boolean = false): UseRecentPositionsReturn => {
    const { t } = useI18n();
    const allTrades = useMarketStore(selectRecentPositions);

    // Compact mode shows fewer trades
    const maxTrades = compact ? 20 : 50;
    const trades = allTrades?.slice(0, maxTrades) ?? [];

    const translations = {
        title: t.RecentPositions?.title || 'Recent Trades',
        price: t.Level2Book?.price || 'Price',
        amount: t.Level2Book?.amount || 'Amount',
        time: t.RecentPositions?.time || 'Time',
        noTrades: t.RecentPositions?.noTrades || 'No trades',
    };

    return {
        trades,
        hasTrades: trades.length > 0,
        translations,
    };
}

export { useRecentPositions };
