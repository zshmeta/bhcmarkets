/**
 * Watchlist Component (Premium)
 * 
 * Professional market watch with real-time updates.
 * Features:
 * - Category tabs with pill indicator
 * - Search with autocomplete styling
 * - Price flash animations on tick updates
 * - Sparkline mini-charts (Planned)
 * - Favorites and custom groups
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';
import type { Tick, InstrumentCategory, AnyInstrument } from '../../types';
import { formatPrice, formatPercent } from '../../utils';
import {
  Container,
  Header,
  TitleText,
  HeaderActions,
  IconButton,
  CategoryTabs,
  CategoryTab,
  SearchContainer,
  SearchWrapper,
  SearchIcon,
  SearchInput,
  ClearButton,
  List,
  ListHeader,
  ListHeaderCell,
  WatchlistRow,
  SymbolCell,
  SymbolName,
  SymbolLabel,
  PriceCell,
  Price,
  Change,
  SpreadCell,
  SpreadValue,
  FavoriteButton,
  EmptyState,
} from './Watchlist.styles';

// =============================================================================
// ICONS
// =============================================================================

const SearchSvg = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85a1.007 1.007 0 00-.115-.1zM12 6.5a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z" />
  </svg>
);

const StarSvg = ({ filled }: { filled?: boolean }) => (
  <svg viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
    <path d="M8 1l2.245 4.549 5.022.729-3.634 3.542.858 5.002L8 12.347l-4.491 2.475.858-5.002L.733 6.278l5.022-.729L8 1z" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const CATEGORY_LABELS: Record<InstrumentCategory | 'all', string> = {
  all: 'All',
  fx: 'Forex',
  crypto: 'Crypto',
  stocks: 'Stocks',
  commodities: 'Commodities',
};

export interface WatchlistProps {
  instruments: AnyInstrument[];
  ticks: Record<string, Tick>;
  selectedSymbol?: string;
  category?: InstrumentCategory | 'all';
  categories?: (InstrumentCategory | 'all')[];
  searchQuery?: string;
  favorites?: string[];
  onSelect?: (symbol: string) => void;
  onCategoryChange?: (category: InstrumentCategory | 'all') => void;
  onSearchChange?: (query: string) => void;
  onToggleFavorite?: (symbol: string) => void;
  showCategories?: boolean;
  showSearch?: boolean;
  compact?: boolean;
}

export function Watchlist({
  instruments,
  ticks,
  selectedSymbol,
  category = 'all',
  categories = ['all', 'fx', 'crypto', 'stocks', 'commodities'],
  searchQuery = '',
  favorites = [],
  onSelect,
  onCategoryChange,
  onSearchChange,
  onToggleFavorite,
  showCategories = true,
  showSearch = true,
  compact = false,
}: WatchlistProps) {
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const prevTicksRef = useRef<Record<string, Tick>>({});
  const [flashSymbols, setFlashSymbols] = useState<Set<string>>(new Set());

  // Track price changes for flash animation
  useEffect(() => {
    const newFlash = new Set<string>();
    Object.keys(ticks).forEach(symbol => {
      const prev = prevTicksRef.current[symbol];
      const currentTick = ticks[symbol];
      if (prev && currentTick && prev.last !== currentTick.last) {
        newFlash.add(symbol);
      }
    });

    if (newFlash.size > 0) {
      setFlashSymbols(newFlash);
      const timer = setTimeout(() => setFlashSymbols(new Set()), 400);
      return () => clearTimeout(timer);
    }

    prevTicksRef.current = { ...ticks };
  }, [ticks]);

  // Mock change data (in real app would come from market data)
  const getChangeData = useCallback((symbol: string): { value: number; percent: number } => {
    // Deterministic random based on symbol for demo
    const hash = symbol.charCodeAt(0) + symbol.charCodeAt(symbol.length - 1);
    const value = ((hash % 100) - 50) / 25;
    return { value, percent: value };
  }, []);

  return (
    <Container>
      <Header>
        <TitleText>Market Watch</TitleText>
        <HeaderActions>
          <IconButton title="Settings">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4.754a3.246 3.246 0 100 6.492 3.246 3.246 0 000-6.492zM5.754 8a2.246 2.246 0 114.492 0 2.246 2.246 0 01-4.492 0z" />
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 01-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 01-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 01.52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 011.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 011.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 01.52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 01-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 01-1.255-.52l-.094-.319z" />
            </svg>
          </IconButton>
        </HeaderActions>
      </Header>

      {showCategories && (
        <CategoryTabs>
          {categories.map(cat => (
            <CategoryTab
              key={cat}
              $active={category === cat}
              onClick={() => onCategoryChange?.(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </CategoryTab>
          ))}
        </CategoryTabs>
      )}

      {showSearch && (
        <SearchContainer>
          <SearchWrapper>
            <SearchIcon><SearchSvg /></SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search symbols..."
              value={searchQuery}
              onChange={e => onSearchChange?.(e.target.value)}
            />
            {searchQuery && (
              <ClearButton onClick={() => onSearchChange?.('')}>
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
                </svg>
              </ClearButton>
            )}
          </SearchWrapper>
        </SearchContainer>
      )}

      <ListHeader>
        <ListHeaderCell>Symbol</ListHeaderCell>
        <ListHeaderCell $align="right">Price</ListHeaderCell>
        <ListHeaderCell $align="right">Change</ListHeaderCell>
        <ListHeaderCell $align="right">Spread</ListHeaderCell>
      </ListHeader>

      <List>
        {instruments.length === 0 ? (
          <EmptyState>
            <SearchSvg />
            <span>No instruments found</span>
          </EmptyState>
        ) : (
          instruments.map(inst => {
            const tick = ticks[inst.symbol];
            const change = getChangeData(inst.symbol);
            const isFavorite = favorites.includes(inst.symbol);

            return (
              <WatchlistRow
                key={inst.symbol}
                $selected={selectedSymbol === inst.symbol}
                $flash={flashSymbols.has(inst.symbol)}
                onClick={() => onSelect?.(inst.symbol)}
                onMouseEnter={() => setHoveredSymbol(inst.symbol)}
                onMouseLeave={() => setHoveredSymbol(null)}
              >
                <SymbolCell>
                  <SymbolName>{inst.symbol}</SymbolName>
                  {!compact && <SymbolLabel>{inst.name}</SymbolLabel>}
                </SymbolCell>

                <PriceCell>
                  <Price $direction={tick?.direction}>
                    {tick ? formatPrice(tick.last, inst.decimals) : '—'}
                  </Price>
                </PriceCell>

                <Change $value={change.value}>
                  {change.value >= 0 ? '▲' : '▼'}
                  {formatPercent(Math.abs(change.percent), 2, false)}
                </Change>

                <SpreadCell>
                  <SpreadValue>
                    {tick ? formatPrice(tick.spread, inst.decimals) : '—'}
                  </SpreadValue>
                </SpreadCell>

                {(hoveredSymbol === inst.symbol || isFavorite) && onToggleFavorite && (
                  <FavoriteButton
                    $active={isFavorite}
                    onClick={e => {
                      e.stopPropagation();
                      onToggleFavorite(inst.symbol);
                    }}
                  >
                    <StarSvg filled={isFavorite} />
                  </FavoriteButton>
                )}
              </WatchlistRow>
            );
          })
        )}
      </List>
    </Container>
  );
}

export default Watchlist;

