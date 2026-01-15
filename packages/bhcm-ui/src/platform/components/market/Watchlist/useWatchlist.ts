import { useCallback, useMemo, useRef, useEffect } from 'react';
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
} from '../../store/watchlistStore';
import { useTradingStore, selectPositions } from '../../store/tradingStore';
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

    // Price fetching effect (mock for now, will use real API)
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                if (symbols.length === 0) return;
                const symbolList = symbols.map(s => s.symbol).join(',');
                const response = await fetch(`/binance-api/api/v3/ticker/24hr?symbols=[${symbolList.split(',').map(s => `"${s}"`).join(',')}]`);

                if (!response.ok) {
                    console.warn('Watchlist fetch failed:', response.status);
                    return;
                }

                const data = await response.json();
                for (const ticker of data) {
                    updateSymbolPrice(
                        ticker.symbol,
                        ticker.lastPrice,
                        parseFloat(ticker.priceChangePercent)
                    );
                }
            } catch (err) {
                console.error('Failed to fetch prices:', err);
            }
        };

        const initialDelay = setTimeout(fetchPrices, 500);
        const interval = setInterval(fetchPrices, 60000);

        return () => {
            clearTimeout(initialDelay);
            clearInterval(interval);
        };
    }, [symbols, updateSymbolPrice]);

    // Position lookup
    const getPosition = useCallback((symbol: string): WatchlistPosition | undefined => {
        if (positions instanceof Map) {
            return positions.get(symbol);
        }
        if (typeof positions === 'object' && positions !== null) {
            return (positions as Record<string, WatchlistPosition>)[symbol];
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
        setShowFavoritesOnly(!showFavoritesOnly);
    }, [setShowFavoritesOnly, showFavoritesOnly]);

    const handleToggleCategory = useCallback((categoryId: string) => {
        toggleCategoryAction(categoryId);
    }, [toggleCategoryAction]);

    const handleTabChange = useCallback((tab: 'watchlists' | 'all') => {
        setActiveTabAction(tab);
    }, [setActiveTabAction]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (filteredSymbols.length === 0) return;
        const currentIndex = filteredSymbols.findIndex(s => s.symbol === selectedSymbol);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = currentIndex < filteredSymbols.length - 1 ? currentIndex + 1 : 0;
            const nextSymbol = filteredSymbols[nextIndex];
            if (nextSymbol) handleSymbolSelect(nextSymbol.symbol);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredSymbols.length - 1;
            const prevSymbol = filteredSymbols[prevIndex];
            if (prevSymbol) handleSymbolSelect(prevSymbol.symbol);
        } else if (e.key === 'Enter' && currentIndex >= 0) {
            onSymbolChange?.(selectedSymbol);
        }
    }, [filteredSymbols, selectedSymbol, handleSymbolSelect, onSymbolChange]);

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
        symbols: filteredSymbols,
        categories,
        selectedSymbol,
        favorites,
        pinned,
        searchQuery,
        showFavoritesOnly,
        expandedCategories,
        activeTab,
        getPosition,
        translations,
        inputRef,
        handleSymbolSelect,
        handleSearchChange,
        handleClearSearch,
        handleToggleFavoritesFilter,
        toggleFavorite: toggleFavoriteAction,
        togglePinned: togglePinnedAction,
        handleToggleCategory,
        handleTabChange,
        handleKeyDown,
    };
};

export { useWatchlist };
