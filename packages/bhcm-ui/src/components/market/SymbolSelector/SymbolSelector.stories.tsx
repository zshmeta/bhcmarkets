import type { Meta, StoryObj } from '@storybook/react';
import SymbolSelectorView from './SymbolSelector.view';
import { POPULAR_SYMBOLS } from './SymbolSelector.types';

/* ═══════════════════════════════════════════════════════════
 * SYMBOL SELECTOR STORIES
 * ═══════════════════════════════════════════════════════════
 */

const meta: Meta<typeof SymbolSelectorView> = {
    title: 'Trading/SymbolSelector',
    component: SymbolSelectorView,
    parameters: {
        layout: 'padded',
        backgrounds: { default: 'dark' },
    },
    tags: ['autodocs'],
    argTypes: {
        onInputChange: { action: 'inputChanged' },
        onConnect: { action: 'connect' },
        onDisconnect: { action: 'disconnect' },
        onQuickSelect: { action: 'quickSelect' },
        onKeyDown: { action: 'keyDown' },
    },
};

export default meta;
type Story = StoryObj<typeof SymbolSelectorView>;

/* ─── Mock Data ─── */
const mockTranslations = {
    placeholder: 'Symbol (e.g., BTCUSDT)',
    connect: 'Connect',
    connecting: 'Connecting...',
    disconnect: 'Disconnect',
};

/* ═══════════════════════════════════════════════════════════
 * STORIES
 * ═══════════════════════════════════════════════════════════
 */

/** Disconnected state */
export const Disconnected: Story = {
    args: {
        inputValue: 'BTCUSDT',
        symbol: 'BTCUSDT',
        isConnected: false,
        isConnecting: false,
        popularSymbols: POPULAR_SYMBOLS,
        translations: mockTranslations,
    },
};

/** Connected state */
export const Connected: Story = {
    args: {
        inputValue: 'BTCUSDT',
        symbol: 'BTCUSDT',
        isConnected: true,
        isConnecting: false,
        popularSymbols: POPULAR_SYMBOLS,
        translations: mockTranslations,
    },
};

/** Connecting state */
export const Connecting: Story = {
    args: {
        inputValue: 'ETHUSDT',
        symbol: 'ETHUSDT',
        isConnected: false,
        isConnecting: true,
        popularSymbols: POPULAR_SYMBOLS,
        translations: mockTranslations,
    },
};

/** Empty input */
export const EmptyInput: Story = {
    args: {
        inputValue: '',
        symbol: '',
        isConnected: false,
        isConnecting: false,
        popularSymbols: POPULAR_SYMBOLS,
        translations: mockTranslations,
    },
};

/** Connected to ETH */
export const ConnectedToETH: Story = {
    args: {
        inputValue: 'ETHUSDT',
        symbol: 'ETHUSDT',
        isConnected: true,
        isConnecting: false,
        popularSymbols: POPULAR_SYMBOLS,
        translations: mockTranslations,
    },
};
