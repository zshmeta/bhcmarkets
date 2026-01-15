import type { Meta, StoryObj } from '@storybook/react';
import UserOverviewView from './UserOverview.view';

/* ═══════════════════════════════════════════════════════════
 * ACCOUNT OVERVIEW PANEL STORIES
 * ═══════════════════════════════════════════════════════════
 */

const meta: Meta<typeof UserOverviewView> = {
    title: 'Account/UserOverview',
    component: UserOverviewView,
    parameters: {
        layout: 'padded',
        backgrounds: { default: 'dark' },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UserOverviewView>;

/* ─── Mock Data ─── */
const mockTranslations = {
    notLoggedIn: 'Not Signed In',
    signInPrompt: 'Sign in to view your account',
    signIn: 'Sign In',
    totalEquity: 'Total Equity',
    available: 'Available',
    reserved: 'Reserved',
    depositPrompt: 'Deposit to start trading',
    viewWallet: 'Wallet',
    viewOrders: 'Orders',
    accountSettings: 'Settings',
};

const mockNavigation = {
    signIn: '#/auth',
    wallet: '#/wallet',
    orders: '#/orders',
    settings: '#/settings',
};

const mockUser = {
    displayName: 'John Trader',
    username: 'johntrader',
    avatar: null,
};

const mockAccount = { accountId: 'ACC-12345678' };

const mockEquity = {
    totalEquity: '45678.90',
    availableBalance: '42500.00',
    frozenBalance: '3178.90',
    hasFunds: true,
};

/* ═══════════════════════════════════════════════════════════
 * STORIES
 * ═══════════════════════════════════════════════════════════
 */

/** Authenticated with funds */
export const Authenticated: Story = {
    args: {
        isAuthenticated: true,
        user: mockUser,
        account: mockAccount,
        equity: mockEquity,
        translations: mockTranslations,
        navigation: mockNavigation,
    },
};

/** Not logged in */
export const NotLoggedIn: Story = {
    args: {
        isAuthenticated: false,
        user: null,
        account: null,
        equity: { totalEquity: '0.00', availableBalance: '0.00', frozenBalance: '0.00', hasFunds: false },
        translations: mockTranslations,
        navigation: mockNavigation,
    },
};

/** Authenticated but no funds */
export const NoFunds: Story = {
    args: {
        isAuthenticated: true,
        user: mockUser,
        account: mockAccount,
        equity: { totalEquity: '0.00', availableBalance: '0.00', frozenBalance: '0.00', hasFunds: false },
        translations: mockTranslations,
        navigation: mockNavigation,
    },
};

/** With avatar */
export const WithAvatar: Story = {
    args: {
        isAuthenticated: true,
        user: { ...mockUser, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trader' },
        account: mockAccount,
        equity: mockEquity,
        translations: mockTranslations,
        navigation: mockNavigation,
    },
};

/** Large balance */
export const LargeBalance: Story = {
    args: {
        isAuthenticated: true,
        user: mockUser,
        account: mockAccount,
        equity: {
            totalEquity: '1234567.89',
            availableBalance: '1000000.00',
            frozenBalance: '234567.89',
            hasFunds: true,
        },
        translations: mockTranslations,
        navigation: mockNavigation,
    },
};
