import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
    useWatchlistStore,
    selectFilteredSymbols,
    selectCategories,
    selectFavorites,
    selectPinned,
    selectSelectedSymbol,
    selectSearchQuery,
    selectShowFavoritesOnly,
    selectExpandedCategories,
    selectActiveTab,
    type SymbolInfo,
    type WatchlistCategory
} from '@repo/sdk';
import { useTradingStore, selectPositions } from '@repo/sdk';
import { useMarketStore } from '@repo/sdk';
import { getSymbolDef, type AssetKind } from '@repo/sdk';
import { useI18n } from '../../i18n';

/* ═══════════════════════════════════════════════════════════
 * useWatchlist Hook
 * ═══════════════════════════════════════════════════════════
 * Extracts all business logic from Watchlist component:
 * - Store subscriptions (symbols, categories, favorites, positions)
 * - Category expansion state
 * - Tab switching
 * - Symbol selection/search handlers
 * - Keyboard navigation
 */

export interface WatchlistPosition {
    quantity: string;
    avgEntryPrice: string;
    unrealizedPnl: string;
}

export interface WatchlistTranslations {
    title: string;
    searchPlaceholder: string;
    favorites: string;
    showFavorites: string;
    showAll: string;
    all: string;
    noResults: string;
    empty: string;
    symbols: string;
    watchlists?: string;
    allSymbols?: string;
    createWatchlist?: string;
    bid?: string;
    ask?: string;
}

export interface UseWatchlistReturn {
    /** Filtered list of symbols */
    symbols: SymbolInfo[];
    /** Categories for hierarchical view */
    categories: WatchlistCategory[];
    /** Currently selected symbol */
    selectedSymbol: string;
    /** Set of favorite symbol names */
    favorites: string[];
    /** Set of pinned symbol names */
    pinned: string[];
    /** Current search query */
    searchQuery: string;
    /** Whether favorites-only filter is active */
    showFavoritesOnly: boolean;
    /** Active asset filter */
    activeFilter: AssetKind | 'all' | 'favorites';
    /** Expanded category IDs */
    expandedCategories: Set<string>;
    /** Active tab */
    activeTab: 'watchlists' | 'all';
    /** Get position for a symbol (if any) */
    getPosition: (symbol: string) => WatchlistPosition | undefined;
    /** Translations */
    translations: WatchlistTranslations;
    /** Ref for search input (for focus management) */
    inputRef: React.RefObject<HTMLInputElement | null>;

    // Actions
    /** Select a symbol */
    handleSymbolSelect: (symbol: string) => void;
    /** Update search query */
    handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** Clear search */
    handleClearSearch: () => void;
    /** Set asset filter */
    handleFilterChange: (filter: AssetKind | 'all' | 'favorites') => void;
    /** Toggle favorites filter */
    handleToggleFavoritesFilter: () => void;
    /** Toggle favorite for a symbol */
    toggleFavorite: (symbol: string) => void;
    /** Toggle pinned for a symbol */
    togglePinned: (symbol: string) => void;
    /** Toggle category expansion */
    handleToggleCategory: (categoryId: string) => void;
    /** Change active tab */
    handleTabChange: (tab: 'watchlists' | 'all') => void;
    /** Keyboard navigation handler */
    handleKeyDown: (e: React.KeyboardEvent) => void;
}

const useWatchlist = (
    onSymbolChange?: (symbol: string) => void
): UseWatchlistReturn => {
    const { t } = useI18n();
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [activeFilter, setActiveFilter] = useState<AssetKind | 'all' | 'favorites'>('all');

    // Store subscriptions
    const filteredSymbols = useWatchlistStore(selectFilteredSymbols);
    const categories = useWatchlistStore(selectCategories);
    const favorites = useWatchlistStore(selectFavorites);
    const pinned = useWatchlistStore(selectPinned);
    const selectedSymbol = useWatchlistStore(selectSelectedSymbol);
    const searchQuery = useWatchlistStore(selectSearchQuery);
    const showFavoritesOnly = useWatchlistStore(selectShowFavoritesOnly);
    const expandedCategories = useWatchlistStore(selectExpandedCategories);
    const activeTab = useWatchlistStore(selectActiveTab);
    const positions = useTradingStore(selectPositions);
    const symbols = useWatchlistStore(state => state.symbols);
    const updateSymbolPrice = useWatchlistStore(state => state.updateSymbolPrice);

    // Store actions
    const setSelectedSymbol = useWatchlistStore(state => state.setSelectedSymbol);
    const setSearchQuery = useWatchlistStore(state => state.setSearchQuery);
    const setShowFavoritesOnly = useWatchlistStore(state => state.setShowFavoritesOnly);
    const toggleFavoriteAction = useWatchlistStore(state => state.toggleFavorite);
    const togglePinnedAction = useWatchlistStore(state => state.togglePinned);
    const toggleCategoryAction = useWatchlistStore(state => state.toggleCategory);
    const setActiveTabAction = useWatchlistStore(state => state.setActiveTab);

    // Get marketStore subscribe function for syncing
    const subscribeMarket = useMarketStore(state => state.subscribe);

    // Sync marketStore with selectedSymbol (for Level2Book, OrderForm, HealthBar, etc.)
    useEffect(() => {
        if (selectedSymbol) {
            console.log('[Watchlist] Syncing marketStore with symbol:', selectedSymbol);
            subscribeMarket(selectedSymbol);
        }
    }, [selectedSymbol, subscribeMarket]);


    // Get marketStore subscribe function handling both regular and list modes
    const subscribeWatchlist = useMarketStore(state => state.subscribeWatchlist);

    // Initial load of symbols and live subscription
    useEffect(() => {
        const loadSymbols = async () => {
            try {
                const response = await fetch('/market/symbols');
                if (!response.ok) return;

                const data = await response.json();
                if (!data.symbols || !Array.isArray(data.symbols)) return;

                // Sync store with API symbols
                const existingSymbols = useWatchlistStore.getState().symbols;
                const existingPriceMap = new Map(existingSymbols.map(s => [s.symbol, s]));

                const symbolInfos: SymbolInfo[] = data.symbols.map((s: any) => ({
                    symbol: s.symbol,
                    baseAsset: s.base || s.symbol,
                    quoteAsset: s.quote || 'USD',
                    price: existingPriceMap.get(s.symbol)?.price || '0.00',
                    priceChange24h: existingPriceMap.get(s.symbol)?.priceChange24h || 0,
                    bidPrice: existingPriceMap.get(s.symbol)?.bidPrice || '0.00',
                    askPrice: existingPriceMap.get(s.symbol)?.askPrice || '0.00',
                    sparklineData: existingPriceMap.get(s.symbol)?.sparklineData,
                }));

                // Update store
                const setSymbols = useWatchlistStore.getState().setSymbols;
                setSymbols(symbolInfos);

                // TRIGGER LIVE SUBSCRIPTION
                const symbolsList = symbolInfos.map(s => s.symbol);
                console.log('[Watchlist] Subscribing to live updates for', symbolsList.length, 'symbols');
                subscribeWatchlist(symbolsList);

            } catch (err) {
                console.error('[Watchlist] Failed to load symbols:', err);
            }
        };

        loadSymbols();
    }, [subscribeWatchlist]);

    // Initial fetch of snapshot prices (for immediate display before WebSocket connects)
    useEffect(() => {
        const fetchOnce = async () => {
            try {
                const response = await fetch('/market/prices');
                if (response.ok) {
                    const data = await response.json();
                    const prices = data.prices || {};
                    for (const [symbol, priceData] of Object.entries(prices)) {
                        const p = priceData as any;
                        if (p.last) updateSymbolPrice(symbol, String(p.last), p.changePercent || 0);
                    }
                }
            } catch (e) { /* ignore */ }
        };
        fetchOnce();
    }, [updateSymbolPrice]);


    // Apply local filters (Asset Class) on top of store filters (Search)
    const finalSymbols = useMemo(() => {
        let result = filteredSymbols;

        // Apply Favorites Filter (mapped to 'favorites' chip)
        if (activeFilter === 'favorites') {
            result = result.filter(s => favorites.includes(s.symbol));
        }
        // Apply Asset Class Filter
        else if (activeFilter !== 'all') {
            result = result.filter(s => {
                const def = getSymbolDef(s.symbol);
                return def?.kind === activeFilter;
            });
        }

        return result;
    }, [filteredSymbols, activeFilter, favorites]);

    // Position lookup
    const getPosition = useCallback((symbol: string): WatchlistPosition | undefined => {
        if (positions instanceof Map) {
            const pos = positions.get(symbol);
            if (!pos) return undefined;
            // The store position doesn't have unrealizedPnl, so we add a default
            return { ...pos, unrealizedPnl: '0.00' };
        }
        if (typeof positions === 'object' && positions !== null) {
            const pos = (positions as Record<string, any>)[symbol];
            if (!pos) return undefined;
            return { ...pos, unrealizedPnl: pos.unrealizedPnl || '0.00' };
        }
        return undefined;
    }, [positions]);

    // Handlers
    const handleSymbolSelect = useCallback((symbol: string) => {
        setSelectedSymbol(symbol);
        onSymbolChange?.(symbol);
    }, [setSelectedSymbol, onSymbolChange]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, [setSearchQuery]);

    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
        inputRef.current?.focus();
    }, [setSearchQuery]);

    const handleToggleFavoritesFilter = useCallback(() => {
        // Toggle between 'favorites' and 'all' for backward compatibility if needed
        setActiveFilter(prev => prev === 'favorites' ? 'all' : 'favorites');
    }, []);

    const handleFilterChange = useCallback((filter: AssetKind | 'all' | 'favorites') => {
        setActiveFilter(filter);
    }, []);

    const handleToggleCategory = useCallback((categoryId: string) => {
        toggleCategoryAction(categoryId);
    }, [toggleCategoryAction]);

    const handleTabChange = useCallback((tab: 'watchlists' | 'all') => {
        setActiveTabAction(tab);
        // Reset filter when switching tabs to avoid confusion? Or keep it?
        // Let's keep it for now.
    }, [setActiveTabAction]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (finalSymbols.length === 0) return;
        const currentIndex = finalSymbols.findIndex(s => s.symbol === selectedSymbol);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = currentIndex < finalSymbols.length - 1 ? currentIndex + 1 : 0;
            const nextSymbol = finalSymbols[nextIndex];
            if (nextSymbol) handleSymbolSelect(nextSymbol.symbol);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : finalSymbols.length - 1;
            const prevSymbol = finalSymbols[prevIndex];
            if (prevSymbol) handleSymbolSelect(prevSymbol.symbol);
        } else if (e.key === 'Enter' && currentIndex >= 0) {
            onSymbolChange?.(selectedSymbol);
        }
    }, [finalSymbols, selectedSymbol, handleSymbolSelect, onSymbolChange]);

    // Translations
    const translations = useMemo((): WatchlistTranslations => ({
        title: t.watchlist?.title || 'Trade',
        searchPlaceholder: t.watchlist?.searchPlaceholder || 'Search...',
        favorites: t.watchlist?.favorites || 'Favorites Only',
        showFavorites: t.watchlist?.showFavorites || 'Show favorites only',
        showAll: t.watchlist?.showAll || 'Show all',
        all: t.watchlist?.all || 'All',
        noResults: t.watchlist?.noResults || 'No matching symbols',
        empty: t.watchlist?.empty || 'No symbols in watchlist',
        symbols: t.watchlist?.symbols || 'symbols',
        watchlists: t.watchlist?.watchlists || 'Watchlists',
        allSymbols: t.watchlist?.allSymbols || 'All Symbols',
        createWatchlist: t.watchlist?.createWatchlist || '+ Create new watchlist',
        bid: t.watchlist?.bid || 'Bid',
        ask: t.watchlist?.ask || 'Ask',
    }), [t]);

    return {
        symbols: finalSymbols,
        categories,
        selectedSymbol,
        favorites,
        pinned,
        searchQuery,
        showFavoritesOnly: activeFilter === 'favorites',
        activeFilter,
        expandedCategories,
        activeTab,
        getPosition,
        translations,
        inputRef,
        handleSymbolSelect,
        handleSearchChange,
        handleClearSearch,
        handleToggleFavoritesFilter,
        handleFilterChange,
        toggleFavorite: toggleFavoriteAction,
        togglePinned: togglePinnedAction,
        handleToggleCategory,
        handleTabChange,
        handleKeyDown,
    };
};

export { useWatchlist };
