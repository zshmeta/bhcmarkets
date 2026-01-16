import { create } from 'zustand';

/* ═══════════════════════════════════════════════════════════
 * WATCHLIST STORE
 * ═══════════════════════════════════════════════════════════
 * Manages watchlist state including symbols, categories,
 * favorites, pinned, and selection.
 */

/* ─── Type Definitions ─── */
export interface SymbolInfo {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    price?: string;
    priceChange24h?: number;
    bidPrice?: string;
    askPrice?: string;
    sparklineData?: number[];
}

export interface WatchlistCategory {
    id: string;
    label: string;
    symbols: SymbolInfo[];
    children?: WatchlistCategory[];
}

interface WatchlistState {
    symbols: SymbolInfo[];
    categories: WatchlistCategory[];
    selectedSymbol: string;
    favorites: string[];
    pinned: string[];
    searchQuery: string;
    showFavoritesOnly: boolean;
    expandedCategories: Set<string>;
    activeTab: 'watchlists' | 'all';
}

interface WatchlistActions {
    setSelectedSymbol: (symbol: string) => void;
    setSearchQuery: (query: string) => void;
    setShowFavoritesOnly: (show: boolean) => void;
    toggleFavorite: (symbol: string) => void;
    togglePinned: (symbol: string) => void;
    toggleCategory: (categoryId: string) => void;
    setActiveTab: (tab: 'watchlists' | 'all') => void;
    updateSymbolPrice: (symbol: string, price: string, change24h: number) => void;
    setSymbols: (symbols: SymbolInfo[]) => void;
    setCategories: (categories: WatchlistCategory[]) => void;
}

/* ─── Default Data ─── */
const generateSparkline = (base: number, trend: number): number[] => {
    const data: number[] = [];
    let current = base;
    for (let i = 0; i < 20; i++) {
        current += (Math.random() - 0.5 + trend * 0.1) * base * 0.01;
        data.push(current);
    }
    return data;
};

const defaultSymbols: SymbolInfo[] = [
    { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', price: '52450.25', priceChange24h: 2.35, bidPrice: '52449.50', askPrice: '52450.75', sparklineData: generateSparkline(52450, 1) },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', price: '3125.80', priceChange24h: -1.25, bidPrice: '3125.50', askPrice: '3126.10', sparklineData: generateSparkline(3125, -1) },
    { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', price: '425.50', priceChange24h: 0.85, bidPrice: '425.40', askPrice: '425.60', sparklineData: generateSparkline(425, 0.5) },
    { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', price: '105.35', priceChange24h: 5.2, bidPrice: '105.30', askPrice: '105.40', sparklineData: generateSparkline(105, 1) },
    { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', price: '0.5234', priceChange24h: -0.5, bidPrice: '0.5233', askPrice: '0.5235', sparklineData: generateSparkline(0.52, -0.3) },
    { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', price: '0.3934', priceChange24h: -0.06, bidPrice: '0.3933', askPrice: '0.3935', sparklineData: generateSparkline(0.39, -0.2) },
    { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', price: '0.1402', priceChange24h: -0.07, bidPrice: '0.1401', askPrice: '0.1403', sparklineData: generateSparkline(0.14, -0.3) },
    { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', price: '13.80', priceChange24h: -0.80, bidPrice: '13.79', askPrice: '13.81', sparklineData: generateSparkline(13.8, -0.5) },
];

const stockSymbols: SymbolInfo[] = [
    // US Stocks
    { symbol: 'AAPL', baseAsset: 'AAPL', quoteAsset: 'USD', price: '178.50', priceChange24h: 1.25, bidPrice: '178.48', askPrice: '178.52', sparklineData: generateSparkline(178.5, 0.5) },
    { symbol: 'MSFT', baseAsset: 'MSFT', quoteAsset: 'USD', price: '425.30', priceChange24h: 0.85, bidPrice: '425.28', askPrice: '425.32', sparklineData: generateSparkline(425, 0.2) },
    { symbol: 'GOOGL', baseAsset: 'GOOGL', quoteAsset: 'USD', price: '140.20', priceChange24h: -0.42, bidPrice: '140.18', askPrice: '140.22', sparklineData: generateSparkline(140, -0.1) },
    { symbol: 'AMZN', baseAsset: 'AMZN', quoteAsset: 'USD', price: '185.60', priceChange24h: 2.10, bidPrice: '185.58', askPrice: '185.62', sparklineData: generateSparkline(185, 0.8) },
    { symbol: 'NVDA', baseAsset: 'NVDA', quoteAsset: 'USD', price: '875.40', priceChange24h: 3.45, bidPrice: '875.35', askPrice: '875.45', sparklineData: generateSparkline(875, 1.5) },
    { symbol: 'TSLA', baseAsset: 'TSLA', quoteAsset: 'USD', price: '245.80', priceChange24h: -1.80, bidPrice: '245.75', askPrice: '245.85', sparklineData: generateSparkline(245, -0.5) },
    // EU Stocks
    { symbol: 'ASML', baseAsset: 'ASML', quoteAsset: 'EUR', price: '920.50', priceChange24h: 1.95, bidPrice: '920.40', askPrice: '920.60', sparklineData: generateSparkline(920, 0.6) },
    { symbol: 'SAP', baseAsset: 'SAP', quoteAsset: 'EUR', price: '178.20', priceChange24h: 0.65, bidPrice: '178.15', askPrice: '178.25', sparklineData: generateSparkline(178, 0.3) },
    { symbol: 'LVMH', baseAsset: 'LVMH', quoteAsset: 'EUR', price: '845.30', priceChange24h: -0.35, bidPrice: '845.20', askPrice: '845.40', sparklineData: generateSparkline(845, -0.2) },
    { symbol: 'NESN', baseAsset: 'NESN', quoteAsset: 'CHF', price: '98.50', priceChange24h: 0.25, bidPrice: '98.45', askPrice: '98.55', sparklineData: generateSparkline(98.5, 0.1) },
    { symbol: 'SIE', baseAsset: 'SIE', quoteAsset: 'EUR', price: '178.40', priceChange24h: 1.15, bidPrice: '178.35', askPrice: '178.45', sparklineData: generateSparkline(178, 0.4) },
    { symbol: 'BMW', baseAsset: 'BMW', quoteAsset: 'EUR', price: '105.80', priceChange24h: -0.55, bidPrice: '105.75', askPrice: '105.85', sparklineData: generateSparkline(105, -0.3) },
];

const defaultCategories: WatchlistCategory[] = [
    {
        id: 'crypto',
        label: 'Cryptocurrency',
        symbols: defaultSymbols,
    },
    {
        id: 'stocks',
        label: 'Stocks',
        symbols: stockSymbols,
    },
    {
        id: 'forex',
        label: 'Forex',
        symbols: [],
    },
    {
        id: 'indices',
        label: 'Indices',
        symbols: [],
    },
    {
        id: 'commodities',
        label: 'Commodities',
        symbols: [],
    },
];

/* ─── Store ─── */
export const useWatchlistStore = create<WatchlistState & WatchlistActions>((set) => ({
    symbols: [...defaultSymbols, ...stockSymbols],
    categories: defaultCategories,
    selectedSymbol: 'BTCUSDT',
    favorites: ['BTCUSDT', 'ETHUSDT', 'AAPL', 'NVDA'],
    pinned: ['BTCUSDT'],
    searchQuery: '',
    showFavoritesOnly: false,
    expandedCategories: new Set(['crypto']),
    activeTab: 'all',

    setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),

    toggleFavorite: (symbol) => set((state) => {
        const newFavorites = state.favorites.includes(symbol)
            ? state.favorites.filter(s => s !== symbol)
            : [...state.favorites, symbol];
        return { favorites: newFavorites };
    }),

    togglePinned: (symbol) => set((state) => {
        const newPinned = state.pinned.includes(symbol)
            ? state.pinned.filter(s => s !== symbol)
            : [...state.pinned, symbol];
        return { pinned: newPinned };
    }),

    toggleCategory: (categoryId) => set((state) => {
        const wasExpanded = state.expandedCategories.has(categoryId);
        const newExpanded = new Set<string>();
        if (!wasExpanded) {
            newExpanded.add(categoryId);
        }
        return { expandedCategories: newExpanded };
    }),
    
    setActiveTab: (tab) => set({ activeTab: tab }),

    updateSymbolPrice: (symbol, price, change24h) => set((state) => ({
        symbols: state.symbols.map(s =>
            s.symbol === symbol ? { ...s, price, priceChange24h: change24h } : s
        ),
    })),

    setSymbols: (symbols) => set({ symbols }),
    setCategories: (categories) => set({ categories }),
}));

/* ─── Selectors ─── */
export const selectSymbols = (state: WatchlistState) => state.symbols;
export const selectCategories = (state: WatchlistState) => state.categories;
export const selectSelectedSymbol = (state: WatchlistState) => state.selectedSymbol;
export const selectFavorites = (state: WatchlistState) => state.favorites;
export const selectPinned = (state: WatchlistState) => state.pinned;
export const selectSearchQuery = (state: WatchlistState) => state.searchQuery;
export const selectShowFavoritesOnly = (state: WatchlistState) => state.showFavoritesOnly;
export const selectExpandedCategories = (state: WatchlistState) => state.expandedCategories;
export const selectActiveTab = (state: WatchlistState) => state.activeTab;

export const selectFilteredSymbols = (state: WatchlistState) => {
    let filtered = state.symbols;
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter(s =>
            s.symbol.toLowerCase().includes(q) ||
            s.baseAsset.toLowerCase().includes(q)
        );
    }
    if (state.showFavoritesOnly) {
        filtered = filtered.filter(s => state.favorites.includes(s.symbol));
    }
    return filtered;
};

export const selectWatchlist = selectFilteredSymbols;
