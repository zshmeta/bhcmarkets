import { useTradingStore } from '../../store/tradingStore';
import { useI18n } from '../../i18n';
import type { PaperOrder } from '../../types/trading';

/* ═══════════════════════════════════════════════════════════
 * useCurrentOrders Hook
 * ═══════════════════════════════════════════════════════════
 * Extracts all business logic from CurrentOrders component:
 * - Store subscription for open orders
 * - Cancel order action
 * - Translations
 */

export interface UseCurrentOrdersReturn {
    /** List of open orders */
    orders: PaperOrder[];
    /** Whether there are any orders */
    hasOrders: boolean;
    /** Cancel order handler */
    cancelOrder: (clientOrderId: string) => void;
    /** Translations */
    translations: {
        title: string;
        noOrders: string;
        orderCancelled: string;
    };
}

const useCurrentOrders = (): UseCurrentOrdersReturn => {
    const { t } = useI18n();
    const orders = useTradingStore((state) => state.getCurrentOrders());
    const cancelOrderAction = useTradingStore((state) => state.cancelOrder);

    const translations = {
        title: t.CurrentOrders?.title || 'Open Orders',
        noOrders: t.CurrentOrders?.noOrders || 'No open orders',
        orderCancelled: t.toast?.orderCancelled || 'Order cancelled',
    };

    return {
        orders,
        hasOrders: orders.length > 0,
        cancelOrder: cancelOrderAction,
        translations,
    };
}

export default useCurrentOrders;
