import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import WatchlistView from './Watchlist.view';
import type { WatchlistViewProps } from './Watchlist.view';
import type { SymbolInfo, WatchlistCategory } from '../../store/watchlistStore';

/* ═══════════════════════════════════════════════════════════
 * WatchlistView Stories - Enhanced with Categories & Sparklines
 * ═══════════════════════════════════════════════════════════
 */

/* ─── Mock Data Generation ─── */
const generateSparkline = (base: number, trend: number): number[] => {
    const data: number[] = [];
    let current = base;
    for (let i = 0; i < 20; i++) {
        current += (Math.random() - 0.5 + trend * 0.1) * base * 0.01;
        data.push(current);
    }
    return data;
};

const mockSymbols: SymbolInfo[] = [
    { symbol: 'BTCUSD', baseAsset: 'BTC', quoteAsset: 'USD', price: '52450.25', priceChange24h: 2.35, bidPrice: '52449.50', askPrice: '52450.75', sparklineData: generateSparkline(52450, 1) },
    { symbol: 'ETHUSD', baseAsset: 'ETH', quoteAsset: 'USD', price: '3125.80', priceChange24h: -1.25, bidPrice: '3125.50', askPrice: '3126.10', sparklineData: generateSparkline(3125, -1) },
    { symbol: 'BNBUSD', baseAsset: 'BNB', quoteAsset: 'USD', price: '425.50', priceChange24h: 0.85, bidPrice: '425.40', askPrice: '425.60', sparklineData: generateSparkline(425, 0.5) },
    { symbol: 'SOLUSD', baseAsset: 'SOL', quoteAsset: 'USD', price: '105.35', priceChange24h: 5.2, bidPrice: '105.30', askPrice: '105.40', sparklineData: generateSparkline(105, 1) },
    { symbol: 'XRPUSD', baseAsset: 'XRP', quoteAsset: 'USD', price: '0.5234', priceChange24h: -0.5, bidPrice: '0.5233', askPrice: '0.5235', sparklineData: generateSparkline(0.52, -0.3) },
    { symbol: 'EURUSD', baseAsset: 'EUR', quoteAsset: 'USD', price: '1.1636', priceChange24h: -0.06, bidPrice: '1.16363', askPrice: '1.16365', sparklineData: generateSparkline(1.16, -0.2) },
    { symbol: 'GBPUSD', baseAsset: 'GBP', quoteAsset: 'USD', price: '1.3426', priceChange24h: -0.07, bidPrice: '1.34262', askPrice: '1.34263', sparklineData: generateSparkline(1.34, -0.3) },
    { symbol: 'XAUUSD', baseAsset: 'XAU', quoteAsset: 'USD', price: '4589.37', priceChange24h: -0.80, bidPrice: '4589.37', askPrice: '4589.61', sparklineData: generateSparkline(4589, -0.5) },
    { symbol: 'US500', baseAsset: 'US 500', quoteAsset: 'USD', price: '6919.20', priceChange24h: -0.02, bidPrice: '6919.20', askPrice: '6919.30', sparklineData: generateSparkline(6919, 0.1) },
    { symbol: 'USDJPY', baseAsset: 'USD', quoteAsset: 'JPY', price: '158.57', priceChange24h: 0.03, bidPrice: '158.578', askPrice: '158.579', sparklineData: generateSparkline(158, 0.2) },
];

const mockCategories: WatchlistCategory[] = [
    {
        id: 'popular',
        label: 'Popular Markets',
        symbols: mockSymbols.filter(s => ['BTCUSD', 'ETHUSD', 'EURUSD', 'XAUUSD', 'US500'].includes(s.symbol)),
    },
    {
        id: 'focus',
        label: 'Focus',
        symbols: mockSymbols.filter(s => ['SOLUSD', 'BNBUSD'].includes(s.symbol)),
    },
    {
        id: 'metals',
        label: 'Metals',
        symbols: mockSymbols.filter(s => ['XAUUSD'].includes(s.symbol)),
    },
    {
        id: 'forex',
        label: 'Forex',
        symbols: mockSymbols.filter(s => ['EURUSD', 'GBPUSD', 'USDJPY'].includes(s.symbol)),
    },
    {
        id: 'indices',
        label: 'Indices',
        symbols: mockSymbols.filter(s => ['US500'].includes(s.symbol)),
    },
    {
        id: 'eu-shares',
        label: 'EU Shares',
        symbols: [],
        children: [
            { id: 'germany', label: 'Germany', symbols: [] },
            { id: 'switzerland', label: 'Switzerland', symbols: [] },
            { id: 'france', label: 'France', symbols: [] },
            { id: 'spain', label: 'Spain', symbols: [] },
        ],
    },
    {
        id: 'crypto',
        label: 'Cryptocurrency',
        symbols: mockSymbols.filter(s => s.quoteAsset === 'USD'),
    },
];

// Wrapper component to provide ref
function WatchlistViewWithRef(props: Omit<WatchlistViewProps, 'inputRef'>) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    return <WatchlistView {...props} inputRef={inputRef} />;
}

const defaultProps: Omit<WatchlistViewProps, 'inputRef'> = {
    symbols: mockSymbols,
    categories: mockCategories,
    selectedSymbol: 'BTCUSD',
    favorites: ['BTCUSD', 'ETHUSD', 'XAUUSD'],
    searchQuery: '',
    expandedCategories: new Set(['popular']),
    activeTab: 'all',
    getPosition: (symbol) => symbol === 'BTCUSD' ? { quantity: '0.5', avgEntryPrice: '50000', unrealizedPnl: '1250.00' } : undefined,
    translations: {
        title: 'Trade',
        searchPlaceholder: 'Search...',
        favorites: 'Favorites',
        all: 'All',
        noResults: 'No symbols found',
        empty: 'Add symbols to your watchlist',
        symbols: 'symbols',
        showFavorites: 'Show favorites only',
        showAll: 'Show all symbols',
        watchlists: 'Watchlists',
        allSymbols: 'All Symbols',
        createWatchlist: '+ Create new watchlist',
        bid: 'Bid',
        ask: 'Ask',
    },
    onSymbolSelect: () => { },
    onSearchChange: () => { },
    onClearSearch: () => { },
    onToggleFavorite: () => { },
    onToggleCategory: () => { },
    onTabChange: () => { },
    onKeyDown: () => { },
};

const meta: Meta<typeof WatchlistViewWithRef> = {
    title: 'Trading/WatchlistView',
    component: WatchlistViewWithRef,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Enhanced watchlist with collapsible categories, mini sparkline charts, bid/ask prices, and tabs.',
            },
        },
    },
    argTypes: {
        onSymbolSelect: { action: 'symbol selected' },
        onToggleFavorite: { action: 'favorite toggled' },
        onToggleCategory: { action: 'category toggled' },
        onTabChange: { action: 'tab changed' },
    },
};

export default meta;
type Story = StoryObj<typeof WatchlistViewWithRef>;

export const Default: Story = {
    args: defaultProps,
    decorators: [(Story) => <div style={{ width: 380, height: 600 }}><Story /></div>],
};

export const AllCategoriesExpanded: Story = {
    args: {
        ...defaultProps,
        expandedCategories: new Set(['popular', 'focus', 'metals', 'forex', 'crypto']),
    },
    decorators: [(Story) => <div style={{ width: 380, height: 700 }}><Story /></div>],
};

export const NestedCategories: Story = {
    args: {
        ...defaultProps,
        expandedCategories: new Set(['eu-shares', 'germany', 'switzerland']),
    },
    decorators: [(Story) => <div style={{ width: 380, height: 600 }}><Story /></div>],
};

export const WatchlistsTab: Story = {
    args: {
        ...defaultProps,
        activeTab: 'watchlists',
        expandedCategories: new Set(['popular', 'focus']),
    },
    decorators: [(Story) => <div style={{ width: 380, height: 600 }}><Story /></div>],
};

export const WithSearch: Story = {
    args: {
        ...defaultProps,
        searchQuery: 'EUR',
        expandedCategories: new Set(['popular', 'forex']),
    },
    decorators: [(Story) => <div style={{ width: 380, height: 600 }}><Story /></div>],
};

export const CollapsedSidebar: Story = {
    args: {
        ...defaultProps,
        isCollapsed: true,
    },
    decorators: [(Story) => <div style={{ width: 60, height: 500 }}><Story /></div>],
};

export const Empty: Story = {
    args: {
        ...defaultProps,
        symbols: [],
        categories: [],
    },
    decorators: [(Story) => <div style={{ width: 380, height: 400 }}><Story /></div>],
};

export const NoResults: Story = {
    args: {
        ...defaultProps,
        searchQuery: 'xyz',
        categories: [],
    },
    decorators: [(Story) => <div style={{ width: 380, height: 400 }}><Story /></div>],
};
