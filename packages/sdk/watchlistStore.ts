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
    updateSymbolPrice: (symbol: string, price: string, change24h: number, bid?: string, ask?: string) => void;
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
    { symbol: 'BTC/USD', baseAsset: 'BTC', quoteAsset: 'USD', price: '52450.25', priceChange24h: 2.35, bidPrice: '52449.50', askPrice: '52450.75', sparklineData: generateSparkline(52450, 1) },
    { symbol: 'ETH/USD', baseAsset: 'ETH', quoteAsset: 'USD', price: '3125.80', priceChange24h: -1.25, bidPrice: '3125.50', askPrice: '3126.10', sparklineData: generateSparkline(3125, -1) },
    { symbol: 'BNB/USD', baseAsset: 'BNB', quoteAsset: 'USD', price: '425.50', priceChange24h: 0.85, bidPrice: '425.40', askPrice: '425.60', sparklineData: generateSparkline(425, 0.5) },
    { symbol: 'SOL/USD', baseAsset: 'SOL', quoteAsset: 'USD', price: '105.35', priceChange24h: 5.2, bidPrice: '105.30', askPrice: '105.40', sparklineData: generateSparkline(105, 1) },
    { symbol: 'XRP/USD', baseAsset: 'XRP', quoteAsset: 'USD', price: '0.5234', priceChange24h: -0.5, bidPrice: '0.5233', askPrice: '0.5235', sparklineData: generateSparkline(0.52, -0.3) },
    { symbol: 'ADA/USD', baseAsset: 'ADA', quoteAsset: 'USD', price: '0.3934', priceChange24h: -0.06, bidPrice: '0.3933', askPrice: '0.3935', sparklineData: generateSparkline(0.39, -0.2) },
    { symbol: 'DOGE/USD', baseAsset: 'DOGE', quoteAsset: 'USD', price: '0.1402', priceChange24h: -0.07, bidPrice: '0.1401', askPrice: '0.1403', sparklineData: generateSparkline(0.14, -0.3) },
    { symbol: 'AVAX/USD', baseAsset: 'AVAX', quoteAsset: 'USD', price: '13.80', priceChange24h: -0.80, bidPrice: '13.79', askPrice: '13.81', sparklineData: generateSparkline(13.8, -0.5) },
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

const forexSymbols: SymbolInfo[] = [
    { symbol: 'EUR/USD', baseAsset: 'EUR', quoteAsset: 'USD', price: '1.0850', priceChange24h: 0.15, bidPrice: '1.0849', askPrice: '1.0851', sparklineData: generateSparkline(1.085, 0.1) },
    { symbol: 'GBP/USD', baseAsset: 'GBP', quoteAsset: 'USD', price: '1.2650', priceChange24h: -0.08, bidPrice: '1.2649', askPrice: '1.2651', sparklineData: generateSparkline(1.265, -0.1) },
    { symbol: 'USD/JPY', baseAsset: 'USD', quoteAsset: 'JPY', price: '149.50', priceChange24h: 0.25, bidPrice: '149.49', askPrice: '149.51', sparklineData: generateSparkline(149.5, 0.2) },
    { symbol: 'USD/CHF', baseAsset: 'USD', quoteAsset: 'CHF', price: '0.8850', priceChange24h: -0.12, bidPrice: '0.8849', askPrice: '0.8851', sparklineData: generateSparkline(0.885, -0.1) },
    { symbol: 'AUD/USD', baseAsset: 'AUD', quoteAsset: 'USD', price: '0.6520', priceChange24h: 0.18, bidPrice: '0.6519', askPrice: '0.6521', sparklineData: generateSparkline(0.652, 0.1) },
    { symbol: 'USD/CAD', baseAsset: 'USD', quoteAsset: 'CAD', price: '1.3650', priceChange24h: 0.05, bidPrice: '1.3649', askPrice: '1.3651', sparklineData: generateSparkline(1.365, 0.05) },
    { symbol: 'NZD/USD', baseAsset: 'NZD', quoteAsset: 'USD', price: '0.5920', priceChange24h: -0.22, bidPrice: '0.5919', askPrice: '0.5921', sparklineData: generateSparkline(0.592, -0.2) },
    { symbol: 'EUR/GBP', baseAsset: 'EUR', quoteAsset: 'GBP', price: '0.8580', priceChange24h: 0.08, bidPrice: '0.8579', askPrice: '0.8581', sparklineData: generateSparkline(0.858, 0.1) },
    { symbol: 'EUR/JPY', baseAsset: 'EUR', quoteAsset: 'JPY', price: '162.20', priceChange24h: 0.35, bidPrice: '162.19', askPrice: '162.21', sparklineData: generateSparkline(162.2, 0.3) },
    { symbol: 'GBP/JPY', baseAsset: 'GBP', quoteAsset: 'JPY', price: '189.10', priceChange24h: -0.15, bidPrice: '189.08', askPrice: '189.12', sparklineData: generateSparkline(189.1, -0.1) },
];

const indicesSymbols: SymbolInfo[] = [
    { symbol: 'SPX', baseAsset: 'SPX', quoteAsset: 'USD', price: '5250.50', priceChange24h: 0.45, bidPrice: '5250.00', askPrice: '5251.00', sparklineData: generateSparkline(5250, 0.3) },
    { symbol: 'NDX', baseAsset: 'NDX', quoteAsset: 'USD', price: '18450.00', priceChange24h: 0.75, bidPrice: '18448.00', askPrice: '18452.00', sparklineData: generateSparkline(18450, 0.5) },
    { symbol: 'DJI', baseAsset: 'DJI', quoteAsset: 'USD', price: '39850.00', priceChange24h: 0.22, bidPrice: '39845.00', askPrice: '39855.00', sparklineData: generateSparkline(39850, 0.2) },
    { symbol: 'VIX', baseAsset: 'VIX', quoteAsset: 'USD', price: '14.50', priceChange24h: -2.50, bidPrice: '14.45', askPrice: '14.55', sparklineData: generateSparkline(14.5, -0.5) },
    { symbol: 'FTSE', baseAsset: 'FTSE', quoteAsset: 'GBP', price: '8250.00', priceChange24h: 0.15, bidPrice: '8248.00', askPrice: '8252.00', sparklineData: generateSparkline(8250, 0.1) },
    { symbol: 'DAX', baseAsset: 'DAX', quoteAsset: 'EUR', price: '18950.00', priceChange24h: 0.55, bidPrice: '18948.00', askPrice: '18952.00', sparklineData: generateSparkline(18950, 0.4) },
    { symbol: 'N225', baseAsset: 'N225', quoteAsset: 'JPY', price: '39500.00', priceChange24h: -0.35, bidPrice: '39495.00', askPrice: '39505.00', sparklineData: generateSparkline(39500, -0.2) },
];

const commoditiesSymbols: SymbolInfo[] = [
    { symbol: 'XAU/USD', baseAsset: 'XAU', quoteAsset: 'USD', price: '2350.50', priceChange24h: 0.85, bidPrice: '2350.00', askPrice: '2351.00', sparklineData: generateSparkline(2350, 0.5) },
    { symbol: 'XAG/USD', baseAsset: 'XAG', quoteAsset: 'USD', price: '27.85', priceChange24h: 1.25, bidPrice: '27.80', askPrice: '27.90', sparklineData: generateSparkline(27.85, 0.8) },
    { symbol: 'WTI', baseAsset: 'WTI', quoteAsset: 'USD', price: '78.50', priceChange24h: -0.45, bidPrice: '78.45', askPrice: '78.55', sparklineData: generateSparkline(78.5, -0.3) },
    { symbol: 'BRENT', baseAsset: 'BRENT', quoteAsset: 'USD', price: '82.30', priceChange24h: -0.35, bidPrice: '82.25', askPrice: '82.35', sparklineData: generateSparkline(82.3, -0.2) },
    { symbol: 'NATGAS', baseAsset: 'NATGAS', quoteAsset: 'USD', price: '2.45', priceChange24h: 2.15, bidPrice: '2.44', askPrice: '2.46', sparklineData: generateSparkline(2.45, 1.0) },
];

const defaultCategories: WatchlistCategory[] = [
    {
        id: 'crypto',
        label: 'Cryptocurrency',
        symbols: defaultSymbols,
    },
    {
        id: 'forex',
        label: 'Forex',
        symbols: forexSymbols,
    },
    {
        id: 'commodities',
        label: 'Commodities',
        symbols: commoditiesSymbols,
    },


    {
        id: 'stocks',
        label: 'Stocks',
        symbols: stockSymbols,
    },

    {
        id: 'indices',
        label: 'Indices',
        symbols: indicesSymbols,
    },
];

/* ─── Store ─── */
export const useWatchlistStore = create<WatchlistState & WatchlistActions>((set) => ({
    symbols: [...defaultSymbols, ...stockSymbols, ...forexSymbols, ...indicesSymbols, ...commoditiesSymbols],
    categories: defaultCategories,
    selectedSymbol: 'BTC/USD',
    favorites: ['BTC/USD', 'ETH/USD', 'AAPL', 'NVDA'],
    pinned: ['EUR/USD'],
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

    updateSymbolPrice: (symbol, price, change24h, bid, ask) => set((state) => ({
        symbols: state.symbols.map(s =>
            s.symbol === symbol ? {
                ...s,
                price,
                priceChange24h: change24h,
                bidPrice: bid || s.bidPrice,
                askPrice: ask || s.askPrice
            } : s
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
