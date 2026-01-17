import { useMemo } from 'react';
import { useAuthStore } from '@repo/sdk';
import { useWalletStore } from '@repo/sdk';
import { useMarketStore, selectMetrics } from '@repo/sdk';
import { useI18n } from '../../i18n';
import Decimal from 'decimal.js';

/* ═══════════════════════════════════════════════════════════
 * useUserOverview Hook
 * ═══════════════════════════════════════════════════════════
 * Extracts all business logic from UserOverview:
 * - Auth state (user, isAuthenticated)
 * - Wallet state (balances, account)
 * - Market metrics (for equity calculation)
 * - Equity calculations
 * - Translations
 */

export interface UserInfo {
    displayName: string;
    username: string;
    avatar?: string | null;
}

export interface AccountInfo {
    accountId: string;
}

export interface EquityData {
    totalEquity: string;
    availableBalance: string;
    frozenBalance: string;
    hasFunds: boolean;
}

export interface AccountOverviewTranslations {
    notLoggedIn: string;
    signInPrompt: string;
    signIn: string;
    totalEquity: string;
    available: string;
    reserved: string;
    depositPrompt: string;
    viewWallet: string;
    viewOrders: string;
    accountSettings: string;
}

export interface NavigationConfig {
    signIn: string;
    wallet: string;
    orders: string;
    settings: string;
}

export interface UseUserOverviewReturn {
    /** Whether user is authenticated */
    isAuthenticated: boolean;
    /** User info (if authenticated) */
    user: UserInfo | null;
    /** Account info (if available) */
    account: AccountInfo | null;
    /** Equity data */
    equity: EquityData;
    /** Translations */
    translations: AccountOverviewTranslations;
    /** Navigation routes */
    navigation: NavigationConfig;
}

// formatNumber is now imported from centralized utils

const useUserOverview = (): UseUserOverviewReturn => {
    const { t } = useI18n();
    const { user: authUser, isAuthenticated } = useAuthStore();
    const { balances, account: walletAccount } = useWalletStore();
    const metrics = useMarketStore(selectMetrics);

    // Equity calculation
    const equity = useMemo<EquityData>(() => {
        if (!balances || !balances.length) {
            return {
                totalEquity: '0.00',
                availableBalance: '0.00',
                frozenBalance: '0.00',
                hasFunds: false,
            };
        }

        let total = new Decimal(0);
        let available = new Decimal(0);
        let frozen = new Decimal(0);

        for (const b of balances) {
            const avail = new Decimal(b.available || '0');
            const froz = new Decimal(b.frozen || '0');
            const qty = avail.plus(froz);

            if (qty.lte(0)) continue;

            if (b.asset === 'USDT') {
                available = available.plus(avail);
                frozen = frozen.plus(froz);
                total = total.plus(qty);
            } else {
                const midPrice = metrics?.mid ? parseFloat(metrics.mid) : 0;
                if (midPrice > 0) {
                    total = total.plus(qty.times(midPrice));
                }
            }
        }

        const totalValue = total.toFixed(2);
        return {
            totalEquity: totalValue,
            availableBalance: available.toFixed(2),
            frozenBalance: frozen.toFixed(2),
            hasFunds: parseFloat(totalValue) > 0,
        };
    }, [balances, metrics]);

    // User info
    const user: UserInfo | null = authUser ? {
        displayName: authUser.displayName || authUser.username,
        username: authUser.username,
        avatar: authUser.avatar,
    } : null;

    // Account info
    const account: AccountInfo | null = walletAccount ? {
        accountId: walletAccount.accountId,
    } : null;

    // Translations
    const translations: AccountOverviewTranslations = {
        notLoggedIn: t.accountOverview?.notLoggedIn || 'Not Signed In',
        signInPrompt: t.accountOverview?.signInPrompt || 'Sign in to view your account',
        signIn: t.auth?.signIn || 'Sign In',
        totalEquity: t.accountOverview?.totalEquity || 'Total Equity',
        available: t.accountOverview?.available || 'Available',
        reserved: t.accountOverview?.reserved || 'Reserved',
        depositPrompt: t.accountOverview?.depositPrompt || 'Deposit to start trading',
        viewWallet: t.accountOverview?.viewWallet || 'Wallet',
        viewOrders: t.accountOverview?.viewOrders || 'Orders',
        accountSettings: t.accountOverview?.accountSettings || 'Settings',
    };

    // Navigation config (app-specific routes)
    const navigation: NavigationConfig = {
        signIn: '/auth',
        wallet: '/wallet',
        orders: '/orders',
        settings: '/settings',
    };

    return {
        isAuthenticated,
        user,
        account,
        equity,
        translations,
        navigation,
    };
}

export { useUserOverview };
