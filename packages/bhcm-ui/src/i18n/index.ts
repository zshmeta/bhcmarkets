/**
 * i18n module - Internationalization utilities
 * Provides translation hooks and utilities for the application
 */

// Default translations - English
const defaultTranslations = {
    common: {
        confirm: 'Confirm',
        cancel: 'Cancel',
        close: 'Close',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
    },
    positions: {
        title: 'Positions',
        noPositions: 'No open positions',
        symbol: 'Symbol',
        amount: 'Amount',
        avgPrice: 'Avg Price',
        currentPrice: 'Current Price',
        unrealizedPnL: 'Unrealized P&L',
        close: 'Close',
    },
    CurrentOrders: {
        title: 'Open Orders',
        noOrders: 'No open orders',
    },
    Level2Book: {
        title: 'Order Book',
        price: 'Price',
        amount: 'Amount',
        total: 'Total',
    },
    OrderForm: {
        title: 'Order Entry',
        buy: 'Buy',
        sell: 'Sell',
        price: 'Price',
        amount: 'Amount',
        total: 'Total',
    },
    RecentPositions: {
        title: 'Recent Trades',
        noTrades: 'No recent trades',
        price: 'Price',
        amount: 'Amount',
        time: 'Time',
    },
    toast: {
        orderCancelled: 'Order cancelled',
        orderPlaced: 'Order placed',
    },
    automation: {
        title: 'Automation',
        triggers: 'Triggers',
        noTriggers: 'No triggers',
        hints: {
            noTriggers: 'No active triggers',
            noLogs: 'No logs',
        },
        type: {
            entry: 'Entry',
            stop_loss: 'Stop Loss',
            take_profit: 'Take Profit',
        },
        status: {
            armed: 'Armed',
            paused: 'Paused',
            blocked: 'Blocked',
            triggered: 'Triggered',
            completed: 'Completed',
            failed: 'Failed',
            cancelled: 'Cancelled',
            expired: 'Expired',
        },
        form: {
            buy: 'Buy',
            sell: 'Sell',
        },
    },
};

type Translations = typeof defaultTranslations;

/**
 * Hook to get translations
 * Returns the translation object and current locale
 */
export const useI18n = () => {
    return {
        t: defaultTranslations as Translations & Record<string, any>,
        locale: 'en',
    };
};

export type { Translations };
export default { useI18n };
