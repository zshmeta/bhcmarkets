import { useMemo, memo } from 'react';
import { Icons } from '../Icons';
import { LineChart } from '../LineChart/LineChart';
import type { SymbolInfo, WatchlistCategory } from '@repo/sdk';
import type { WatchlistPosition, WatchlistTranslations } from './useWatchlist';
import {
    Container,
    SearchWrapper,
    SearchIcons,
    SearchInput,
    ClearButton,
    List,
    Empty,
    Footer,
    Count,
    TabBar,
    Tab,
    CategoryHeader,
    CategoryActions,
    CategoryBtn,
    CategoryContent,
    SymbolRow,
    SymbolCell,
    FavoriteIcon,
    // InWatchlistIcon, // Disabled - feature not active
    SymbolLabel,
    ChangeCell,
    SparklineCell,
    BidAskCell,
    TableHeader,
    AddListButton,
    FilterRow,
    FilterChip,
} from './Watchlist.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 * Watchlist.view.tsx - Enhanced with categories, sparklines,
 * bid/ask prices, and tab toggle.
 */

/* ─── SVG Icons ─── */
function StarIcon({ filled }: { filled: boolean }) {
    return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

function SearchSvgIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function ClearIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

/* ─── Symbol Row Component ─── */
interface SymbolRowItemProps {
    symbol: SymbolInfo;
    isSelected: boolean;
    isFavorite: boolean;
    isInWatchlist?: boolean;
    onSelect: () => void;
    onToggleFavorite: () => void;
}

const SymbolRowItem = memo(({
    symbol,
    isSelected,
    isFavorite,
    isInWatchlist = true,
    onSelect,
    onToggleFavorite,
}: SymbolRowItemProps) => {
    const priceChange = symbol.priceChange24h ?? 0;
    const isPositive = priceChange >= 0;
    const sparkData = symbol.sparklineData || [];

    return (
        <SymbolRow $selected={isSelected} onClick={onSelect}>
            <FavoriteIcon
                $active={isFavorite}
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
                <StarIcon filled={isFavorite} />
            </FavoriteIcon>

            <SymbolCell>
                {/* {isInWatchlist && (
                    <InWatchlistIcon title="In watchlist">
                        <CheckIcon />
                    </InWatchlistIcon>
                )} */}
                <SymbolLabel>{symbol.symbol}</SymbolLabel>
            </SymbolCell>

            <ChangeCell $positive={isPositive} $negative={!isPositive}>
                {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </ChangeCell>

            <SparklineCell>
                {sparkData.length >= 2 && (
                    <LineChart
                        data={sparkData}
                        width={50}
                        height={20}
                        lineWidth={1}
                        id={symbol.symbol}
                    />
                )}
            </SparklineCell>

            <BidAskCell $type="bid" className="tabular-nums">
                {symbol.bidPrice || symbol.price || '--'}
            </BidAskCell>

            <BidAskCell $type="ask" className="tabular-nums">
                {symbol.askPrice || symbol.price || '--'}
            </BidAskCell>
        </SymbolRow>
    );
});

SymbolRowItem.displayName = 'SymbolRowItem';

/* ─── Category Section Component ─── */
interface CategorySectionProps {
    category: WatchlistCategory;
    isExpanded: boolean;
    selectedSymbol: string;
    favorites: string[];
    onToggleCategory: (id: string) => void;
    onSymbolSelect: (symbol: string) => void;
    onToggleFavorite: (symbol: string) => void;
    nested?: boolean;
}

const CategorySection = memo(({
    category,
    isExpanded,
    selectedSymbol,
    favorites,
    onToggleCategory,
    onSymbolSelect,
    onToggleFavorite,
    nested = false,
}: CategorySectionProps) => {
    const hasSymbols = category.symbols.length > 0;

    return (
        <div>
            <CategoryHeader
                $expanded={isExpanded}
                $nested={nested}
                onClick={() => onToggleCategory(category.id)}
            >
                <Icons name="play" size="xs" />
                <span>{category.label}</span>
                <CategoryActions onClick={(e) => e.stopPropagation()}>
                    <CategoryBtn title="Add symbol">
                        <Icons name="plus" size="xs" />
                    </CategoryBtn>
                </CategoryActions>
            </CategoryHeader>

            {isExpanded && hasSymbols && (
                <CategoryContent>
                    {category.symbols.map((symbol) => (
                        <SymbolRowItem
                            key={symbol.symbol}
                            symbol={symbol}
                            isSelected={selectedSymbol === symbol.symbol}
                            isFavorite={favorites.includes(symbol.symbol)}
                            onSelect={() => onSymbolSelect(symbol.symbol)}
                            onToggleFavorite={() => onToggleFavorite(symbol.symbol)}
                        />
                    ))}
                </CategoryContent>
            )}
        </div>
    );
});

CategorySection.displayName = 'CategorySection';

/* ═══════════════════════════════════════════════════════════
 * VIEW PROPS INTERFACE
 * ═══════════════════════════════════════════════════════════
 */
export interface WatchlistViewProps {
    /** List of symbols to display (flat view) */
    symbols: SymbolInfo[];
    /** Categories for hierarchical view */
    categories: WatchlistCategory[];
    /** Currently selected symbol */
    selectedSymbol: string;
    /** Favorites list */
    favorites: string[];
    /** Current search query */
    searchQuery: string;
    /** Expanded category IDs */
    expandedCategories: Set<string>;
    /** Active tab */
    activeTab: 'watchlists' | 'all';
    /** Active asset filter */
    activeFilter: 'all' | 'favorites' | string;
    /** Get position for a symbol */
    getPosition: (symbol: string) => WatchlistPosition | undefined;
    /** Translations */
    translations: WatchlistTranslations & {
        watchlists?: string;
        allSymbols?: string;
        createWatchlist?: string;
        bid?: string;
        ask?: string;
    };
    /** Search input ref */
    inputRef: React.RefObject<HTMLInputElement | null>;

    // Actions
    onSymbolSelect: (symbol: string) => void;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClearSearch: () => void;
    onToggleFavorite: (symbol: string) => void;
    onToggleCategory: (categoryId: string) => void;
    onTabChange: (tab: 'watchlists' | 'all') => void;
    onFilterChange: (filter: any) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;

    /** Collapsed sidebar mode */
    isCollapsed?: boolean;
}

/* ═══════════════════════════════════════════════════════════
 * MAIN VIEW COMPONENT
 * ═══════════════════════════════════════════════════════════
 */
const WatchlistView = ({
    symbols,
    categories,
    selectedSymbol,
    favorites,
    searchQuery,
    expandedCategories,
    activeTab,
    activeFilter,
    translations: t,
    inputRef,
    onSymbolSelect,
    onSearchChange,
    onClearSearch,
    onToggleFavorite,
    onToggleCategory,
    onTabChange,
    onFilterChange,
    onKeyDown,
    isCollapsed = false,
}: WatchlistViewProps) => {
    // Filter categories based on search
    const filteredCategories = useMemo(() => {
        if (!searchQuery) return categories;

        const q = searchQuery.toLowerCase();
        return categories.map(cat => ({
            ...cat,
            symbols: cat.symbols.filter(s =>
                s.symbol.toLowerCase().includes(q) ||
                s.baseAsset.toLowerCase().includes(q)
            ),
            children: cat.children?.map(child => ({
                ...child,
                symbols: child.symbols.filter(s =>
                    s.symbol.toLowerCase().includes(q) ||
                    s.baseAsset.toLowerCase().includes(q)
                ),
            })).filter(child => child.symbols.length > 0),
        })).filter(cat => cat.symbols.length > 0 || (cat.children && cat.children.length > 0));
    }, [categories, searchQuery]);

    if (isCollapsed) {
        return (
            <Container $collapsed className="card collapsed">
                <List>
                    {symbols.slice(0, 10).map((symbol) => (
                        <SymbolRow
                            key={symbol.symbol}
                            $selected={selectedSymbol === symbol.symbol}
                            onClick={() => onSymbolSelect(symbol.symbol)}
                            style={{ gridTemplateColumns: '1fr', justifyContent: 'center' }}
                        >
                            <SymbolLabel style={{ textAlign: 'center' }}>
                                {symbol.symbol}
                            </SymbolLabel>
                        </SymbolRow>
                    ))}
                </List>
            </Container>
        );
    }

    return (
        <Container className="card">
            {/* Header with title */}
            <div className="card-header" style={{ padding: '0.25rem 0.25rem' }}>
                <span className="card-title" style={{ color: 'var(--buy, #3FB950)', fontWeight: 400 }}>
                    <Icons name="bar-chart-3" size="sm" style={{ marginRight: '0.5rem' }} />
                    {t.title || 'Trade'}
                </span>
            </div>

            {/* Tab Bar */}
            <TabBar>
                <Tab
                    $active={activeTab === 'watchlists'}
                    onClick={() => onTabChange('watchlists')}
                >
                    {t.watchlists || 'Watchlists'}
                </Tab>
                <Tab
                    $active={activeTab === 'all'}
                    onClick={() => onTabChange('all')}
                >
                    {t.allSymbols || 'All Symbols'}
                </Tab>
            </TabBar>

            {/* Search */}
            <SearchWrapper>
                <SearchIcons><SearchSvgIcon /></SearchIcons>
                <SearchInput
                    ref={inputRef}
                    type="text"
                    placeholder={t.searchPlaceholder || 'Search...'}
                    value={searchQuery}
                    onChange={onSearchChange}
                    onKeyDown={onKeyDown}
                />
                {searchQuery && (
                    <ClearButton onClick={onClearSearch}>
                        <ClearIcon />
                    </ClearButton>
                )}
            </SearchWrapper>

            {/* Filter Chips */}
            <FilterRow>
                <FilterChip $active={activeFilter === 'all'} onClick={() => onFilterChange('all')}>All</FilterChip>
                <FilterChip $active={activeFilter === 'favorites'} onClick={() => onFilterChange('favorites')}>Favorites</FilterChip>
                {/*
                <FilterChip $active={activeFilter === 'crypto'} onClick={() => onFilterChange('crypto')}>Crypto</FilterChip>
                <FilterChip $active={activeFilter === 'forex'} onClick={() => onFilterChange('forex')}>Forex</FilterChip>
                <FilterChip $active={activeFilter === 'stock'} onClick={() => onFilterChange('stock')}>Stocks</FilterChip>
                <FilterChip $active={activeFilter === 'index'} onClick={() => onFilterChange('index')}>Indices</FilterChip>
                <FilterChip $active={activeFilter === 'commodity'} onClick={() => onFilterChange('commodity')}>Commodities</FilterChip> */}
            </FilterRow>

            {/* Table Header */}
            <TableHeader>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </TableHeader>

            {/* Category List */}
            <List>
                {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                        <CategorySection
                            key={category.id}
                            category={category}
                            isExpanded={expandedCategories.has(category.id)}
                            selectedSymbol={selectedSymbol}
                            favorites={favorites}
                            onToggleCategory={onToggleCategory}
                            onSymbolSelect={onSymbolSelect}
                            onToggleFavorite={onToggleFavorite}
                        />
                    ))
                ) : (
                    <Empty>
                        {searchQuery ? t.noResults || 'No matching symbols' : t.empty || 'Add symbols to your watchlist'}
                    </Empty>
                )}
            </List>

            {/* Add Watchlist Button */}
            <AddListButton>
                <Icons name="plus" size="xs" />
                {t.createWatchlist || '+ Create new watchlist'}
            </AddListButton>

            {/* Footer */}
            <Footer>
                <Count>{symbols.length} {t.symbols || 'symbols'}</Count>
            </Footer>
        </Container>
    );
};

export { WatchlistView };
