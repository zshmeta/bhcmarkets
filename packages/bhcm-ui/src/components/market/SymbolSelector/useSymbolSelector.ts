import { useState, useEffect, useCallback } from 'react';
import { useMarketStore, selectConnectionStatus } from '../../store/marketStore';
import { useI18n } from '../../i18n';

/* ═══════════════════════════════════════════════════════════
 * useSymbolSelector Hook
 * ═══════════════════════════════════════════════════════════
 * Extracts all business logic from SymbolSelector:
 * - Connection state management
 * - Symbol input handling
 * - WebSocket subscribe/unsubscribe
 * - Translations
 */

import { POPULAR_SYMBOLS } from './SymbolSelector.types';

export interface UseSymbolSelectorReturn {
    /** Current input value */
    inputValue: string;
    /** Currently connected symbol */
    symbol: string;
    /** Whether connected */
    isConnected: boolean;
    /** Whether connecting */
    isConnecting: boolean;
    /** Handler for input change */
    onInputChange: (value: string) => void;
    /** Handler for connect action */
    onConnect: () => void;
    /** Handler for disconnect action */
    onDisconnect: () => void;
    /** Handler for quick select */
    onQuickSelect: (sym: string) => void;
    /** Handler for keydown (Enter triggers connect) */
    onKeyDown: (e: React.KeyboardEvent) => void;
    /** List of popular symbols */
    popularSymbols: string[];
    /** Translations */
    translations: {
        placeholder: string;
        connect: string;
        connecting: string;
        disconnect: string;
    };
}

const useSymbolSelector = (): UseSymbolSelectorReturn => {
    const { t } = useI18n();

    // Local state
    const [symbol, setSymbol] = useState('BTCUSDT');
    const [inputValue, setInputValue] = useState('BTCUSDT');

    // Store selectors
    const connectionStatus = useMarketStore(selectConnectionStatus);
    const subscribe = useMarketStore((state) => state.subscribe);
    const unsubscribe = useMarketStore((state) => state.unsubscribe);

    const isConnected = connectionStatus.state === 'connected';
    const isConnecting = connectionStatus.state === 'connecting' || connectionStatus.state === 'reconnecting';

    // Handlers
    const onInputChange = useCallback((value: string) => {
        setInputValue(value.toUpperCase());
    }, []);

    const onConnect = useCallback(() => {
        const normalized = inputValue.toUpperCase().trim();
        if (normalized) {
            setSymbol(normalized);
            subscribe(normalized);
        }
    }, [inputValue, subscribe]);

    const onDisconnect = useCallback(() => {
        unsubscribe();
    }, [unsubscribe]);

    const onQuickSelect = useCallback((sym: string) => {
        setInputValue(sym);
        setSymbol(sym);
        subscribe(sym);
    }, [subscribe]);

    const onKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onConnect();
        }
    }, [onConnect]);

    // Auto-connect on mount
    useEffect(() => {
        subscribe(symbol);
        return () => {
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const translations = {
        placeholder: t.symbolSelector?.placeholder || 'Symbol (e.g., BTCUSDT)',
        connect: t.symbolSelector?.connect || 'Connect',
        connecting: t.symbolSelector?.connecting || 'Connecting...',
        disconnect: t.symbolSelector?.disconnect || 'Disconnect',
    };

    return {
        inputValue,
        symbol,
        isConnected,
        isConnecting,
        onInputChange,
        onConnect,
        onDisconnect,
        onQuickSelect,
        onKeyDown,
        popularSymbols: POPULAR_SYMBOLS,
        translations,
    };
}

export default useSymbolSelector;
