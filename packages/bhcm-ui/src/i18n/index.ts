/**
 * i18n module - Internationalization utilities
 * Provides translation hooks and utilities for the application
 */

import { useEffect, useState } from 'react';

export type LocaleKey = 'en-US' | 'en-US';
export type Locale = LocaleKey;

// Default translations - English
const defaultTranslations = {
    common: {
        username: 'Username',
        password: 'Password',
        usernamePlaceholder: 'Enter username',
        passwordPlaceholder: '••••••••',
        confirm: 'Confirm',
        cancel: 'Cancel',
        close: 'Close',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        info: 'Info',
    },
    help: {
        title: 'Help',
        contactUs: 'Contact us',
        contactDesc: 'Open our contact page',
        chatNow: 'Chat now',
        chatDesc: 'Open live support chat',
        callUs: 'Call us',
        hint: 'Need a hand? Our team is here to help.',
    },
    header: {
        title: 'BHC Markets',
    },
    auth: {
        signIn: 'Sign In',
        signUp: 'Sign Up',
        usernameRequired: 'Username is required',
        passwordRequired: 'Password is required',
        passwordTooShort: 'Password must be at least 6 characters',
        passwordMismatch: 'Passwords do not match',
        welcomeTitle: 'Welcome',
        welcomeMessageEn: 'Sign in to continue.',
        welcomeMessageZh: '登录以继续。',
        welcomeMessageMobile: 'Sign in to continue.',
        noAccount: 'New here?',
        haveAccount: 'Already a member?',
        switchToRegister: 'Create Account',
        switchToLogin: 'Sign In',
        createAccount: 'Create Account',
    },
    language: {
        label: 'Language',
        en: 'EN',
        zh: '中文',
    },
    theme: {
        switchToDark: 'Switch to dark theme',
        switchToLight: 'Switch to light theme',
    },
    dataConfidence: {
        live: 'Live',
        degraded: 'Degraded',
        resyncing: 'Resyncing',
        stale: 'Stale',
        staleDesc: 'Market data is stale. Please reconnect and try again.',
        diagnostics: 'Diagnostics',
        systemStatus: 'System Status',
        sessionStats: 'Session Stats',
        truthTimeline: 'Timeline',
        reconnect: 'Reconnect',
        forceResync: 'Force resync',
        passed: 'Passed',
        failed: 'Failed',
        wsConnection: 'WS connection',
        sequenceCheck: 'Sequence',
        latencyCheck: 'Latency',
        updateFrequency: 'Update frequency',
        queueHealth: 'Queue health',
        reconnectCount: 'Reconnects',
        gapCount: 'Gaps',
        lastUpdate: 'Update',
        metricsUncertain: 'May be inaccurate',
    },
    networkHealth: {
        title: 'Network Health',
        sessionDuration: 'Session',
        uptime: 'Uptime',
        avgLatency: 'Avg Latency',
        p95Latency: 'P95 Latency',
        minLatency: 'Min',
        maxLatency: 'Max',
        excellent: 'Excellent',
        good: 'Good',
        fair: 'Fair',
        poor: 'Poor',
        noEvents: 'No events yet',
        latencyScore: 'Latency',
        stabilityScore: 'Stability',
        throughputScore: 'Throughput',
        reliabilityScore: 'Reliability',
        events: {
            connected: 'Connected',
            disconnected: 'Disconnected',
            reconnecting: 'Reconnecting',
            latencySpike: 'Latency Spike',
            latencyNormal: 'Latency Normal',
            gapDetected: 'Gap Detected',
            resyncStart: 'Resync Started',
            resyncComplete: 'Resync Complete',
            rateDrop: 'Rate Drop',
            rateNormal: 'Rate Normal',
        },
    },
    wallet: {
        title: 'Wallet',
        overview: 'Overview',
        spot: 'Spot',
        funding: 'Funding',
        history: 'History',
        simulatedBadge: 'Simulated',
        simulatedTooltip: 'This is a simulated wallet for paper trading.',
        assetBalances: 'Asset Balances',
        searchAssets: 'Search...',
        hideSmallBalances: 'Hide small balances',
        noAssets: 'No assets yet',
        depositNow: 'Deposit Now',
        deposit: 'Deposit',
        withdraw: 'Withdraw',
        available: 'Available',
        frozen: 'Frozen',
        total: 'Total',
        ledger: 'Fund History',
        linkedMethods: 'Linked Methods',
        bankCards: 'Bank Cards',
        cryptoAddresses: 'Crypto',
        noBankCards: 'No bank cards linked',
        noAddresses: 'No addresses linked',
        addBankCard: 'Add Bank Card',
        addAddress: 'Add Address',
        deleteConfirm: 'Are you sure you want to delete this?',
        createAccountTitle: 'Initialize Wallet',
        createAccountDesc: 'Detection session for {username}. Would you like to initialize a simulated wallet?',
        accountCreated: 'Wallet initialized!',
        createAccount: 'Initialize Now',
        creatingAccount: 'Initializing...',
        addPaymentFirst: 'Add a payment method to deposit funds',
        addPaymentDesc: 'Link a bank card or crypto address to simulate deposits and withdrawals.',
        noFundsYet: 'No funds yet',
        noFundsDesc: 'Deposit funds to start trading. This is simulated money for paper trading.',
        step: 'Step',
        of: 'of',
        filterAll: 'All',
        filterDeposit: 'Deposit',
        filterWithdraw: 'Withdraw',
        filterTrade: 'Trade',
        filterFee: 'Fee',
        noRecords: 'No records yet',
        loadMore: 'Load More',
        time: 'Time',
        type: 'Type',
        asset: 'Asset',
        amount: 'Amount',
        reference: 'Reference',
        ledgerTypes: {
            DEPOSIT: 'Deposit',
            WITHDRAW_FREEZE: 'Withdraw (freeze)',
            WITHDRAW_COMPLETE: 'Withdraw',
            WITHDRAW_REFUND: 'Withdraw (refund)',
            ORDER_FREEZE: 'Order (freeze)',
            ORDER_UNFREEZE: 'Order (unfreeze)',
            FILL: 'Fill',
            FEE: 'Fee',
        },
    },
    account: {
        totalValue: 'Total Value',
    },
    accountOverview: {
        accountSettings: 'Account Settings',
        viewWallet: 'Wallet',
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
        limit: 'Limit',
        market: 'Market',
        price: 'Price',
        amount: 'Amount',
        takeProfit: 'Take Profit',
        stopLoss: 'Stop Loss',
        estimatedPrice: 'Est. Price',
        slippage: 'Slippage',
        fee: 'Fee',
        total: 'Total',
        available: 'Available',
        bid1: 'Bid',
        mid: 'Mid',
        ask1: 'Ask',
        placeBuyOrder: 'Place Buy Order',
        placeSellOrder: 'Place Sell Order',
        confirmDegraded: 'Market data is degraded. Continue anyway?',
        invalidAmount: 'Invalid amount',
        invalidPrice: 'Invalid price',
        invalidTrailingValue: 'Invalid trailing value',
        invalidTriggerPrice: 'Invalid trigger price',
        invalidLimitPrice: 'Invalid limit price',
        insufficientBalance: 'Insufficient balance',
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
        orderSubmitted: 'Order submitted',
    },
    automation: {
        title: 'Automation',
        triggers: 'Triggers',
        noTriggers: 'No triggers',
        logDetails: {
            success: 'Success',
            failed: 'Failed',
            blocked: 'Blocked',
            price: 'Price',
            latency: 'Latency',
            orderId: 'Order ID',
            errorCodes: {
                INSUFFICIENT_BALANCE: 'Insufficient balance',
                DATA_NOT_RELIABLE: 'Data not reliable',
                RATE_LIMITED: 'Rate limited',
                ORDER_REJECTED: 'Order rejected',
                POSITION_CLOSED: 'Position closed',
                TRIGGER_EXPIRED: 'Trigger expired',
                TRIGGER_CANCELLED: 'Trigger cancelled',
                OCO_CANCELLED: 'OCO cancelled',
                NETWORK_ERROR: 'Network error',
                UNKNOWN_ERROR: 'Unknown error',
            } as Record<string, string>,
        },
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

const STORAGE_KEY = 'bhcm.locale';

export const formatMessage = (template: string, params: Record<string, string | number> = {}) => {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => {
        const v = params[key];
        return v === undefined || v === null ? `{${key}}` : String(v);
    });
};

const getInitialLocale = (): LocaleKey => {
    if (typeof window === 'undefined') return 'en-US';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en-US' || stored === 'en-US') return stored;
    return 'en-US';
};

let currentLocale: LocaleKey = getInitialLocale();
const listeners = new Set<() => void>();

const setLocaleInternal = (next: LocaleKey) => {
    currentLocale = next;
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, next);
    }
    for (const l of listeners) l();
};

/**
 * Hook to get translations
 * Returns the translation object and current locale
 */
export const useI18n = () => {
    // Lightweight external-store subscription (no provider required)
    const [, force] = useState(0);

    useEffect(() => {
        const cb = () => force((x) => x + 1);
        listeners.add(cb);
        return () => listeners.delete(cb);
    }, []);

    return {
        t: defaultTranslations as Translations & Record<string, any>,
        locale: currentLocale,
        setLocale: setLocaleInternal,
    };
};

export type { Translations };
export default { useI18n };
