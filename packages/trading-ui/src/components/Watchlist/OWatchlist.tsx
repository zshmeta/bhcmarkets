/**
 * Watchlist Component (Premium)
 * 
 * Professional market watch with real-time updates.
 * Features:
 * - Category tabs with pill indicator
 * - Search with autocomplete styling
 * - Price flash animations on tick updates
 * - Sparkline mini-charts
 * - Favorites and custom groups
 */

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import type { Tick, InstrumentCategory, AnyInstrument } from '../../types';
import { formatPrice, formatPercent } from '../../utils';
import { COLORS, TYPOGRAPHY, SPACING, EFFECTS, SIZING } from '../../theme';

// =============================================================================
// ANIMATIONS
// =============================================================================

const flashBg = keyframes`
  0% { background-color: rgba(255, 255, 255, 0.1); }
  100% { background-color: transparent; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
`;

// =============================================================================
// STYLED COMPONENTS
// =============================================================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${COLORS.bg.tertiary};
  border-radius: ${EFFECTS.borderRadius.md};
  overflow: hidden;
  font-family: ${TYPOGRAPHY.fontFamily.sans};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${SPACING[2]} ${SPACING[3]};
  background: ${COLORS.bg.secondary};
  border-bottom: 1px solid ${COLORS.border.subtle};
  min-height: ${SIZING.panelHeaderCompact};
`;

const TitleText = styled.span`
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  color: ${COLORS.text.primary};
  text-transform: uppercase;
  letter-spacing: ${TYPOGRAPHY.letterSpacing.wide};
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${SPACING[1]};
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: ${EFFECTS.borderRadius.sm};
  background: transparent;
  color: ${COLORS.text.tertiary};
  cursor: pointer;
  transition: ${EFFECTS.transition.fast};
  
  &:hover {
    background: ${COLORS.bg.hover};
    color: ${COLORS.text.primary};
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

// Category Tabs
const CategoryTabs = styled.div`
  display: flex;
  gap: ${SPACING[1]};
  padding: ${SPACING[2]} ${SPACING[3]};
  background: ${COLORS.bg.secondary};
  border-bottom: 1px solid ${COLORS.border.subtle};
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryTab = styled.button<{ $active?: boolean }>`
  position: relative;
  padding: ${SPACING[1]} ${SPACING[3]};
  border: none;
  border-radius: ${EFFECTS.borderRadius.full};
  background: ${({ $active }) => $active ? COLORS.semantic.info.bg : 'transparent'};
  color: ${({ $active }) => $active ? COLORS.semantic.info.main : COLORS.text.tertiary};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  cursor: pointer;
  transition: ${EFFECTS.transition.base};
  white-space: nowrap;
  
  &:hover {
    background: ${({ $active }) => $active ? COLORS.semantic.info.bg : COLORS.bg.hover};
    color: ${({ $active }) => $active ? COLORS.semantic.info.main : COLORS.text.secondary};
  }
`;

// Search
const SearchContainer = styled.div`
  padding: ${SPACING[2]} ${SPACING[3]};
  border-bottom: 1px solid ${COLORS.border.subtle};
`;

const SearchWrapper = styled.div`
  position: relative;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: ${SPACING[3]};
  top: 50%;
  transform: translateY(-50%);
  color: ${COLORS.text.tertiary};
  pointer-events: none;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${SPACING[2]} ${SPACING[3]} ${SPACING[2]} 36px;
  border: 1px solid ${COLORS.border.default};
  border-radius: ${EFFECTS.borderRadius.base};
  background: ${COLORS.bg.primary};
  color: ${COLORS.text.primary};
  font-size: ${TYPOGRAPHY.fontSize.sm};
  transition: ${EFFECTS.transition.base};
  
  &:focus {
    outline: none;
    border-color: ${COLORS.border.focus};
    box-shadow: 0 0 0 3px ${COLORS.semantic.info.bg};
  }
  
  &::placeholder {
    color: ${COLORS.text.tertiary};
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: ${SPACING[2]};
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: ${EFFECTS.borderRadius.full};
  background: ${COLORS.bg.elevated};
  color: ${COLORS.text.tertiary};
  cursor: pointer;
  transition: ${EFFECTS.transition.fast};
  
  &:hover {
    background: ${COLORS.bg.hover};
    color: ${COLORS.text.primary};
  }
  
  svg {
    width: 10px;
    height: 10px;
  }
`;

// List
const List = styled.div`
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${COLORS.border.default};
    border-radius: 2px;
  }
`;

const ListHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: ${SPACING[3]};
  padding: ${SPACING[1]} ${SPACING[3]};
  background: ${COLORS.bg.secondary};
  border-bottom: 1px solid ${COLORS.border.subtle};
  position: sticky;
  top: 0;
  z-index: 1;
`;

const ListHeaderCell = styled.span<{ $align?: 'left' | 'right' }>`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  color: ${COLORS.text.tertiary};
  text-transform: uppercase;
  letter-spacing: ${TYPOGRAPHY.letterSpacing.wider};
  text-align: ${({ $align }) => $align || 'left'};
`;

const WatchlistRow = styled.div<{ $selected?: boolean; $flash?: boolean }>`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: ${SPACING[3]};
  align-items: center;
  padding: ${SPACING[2]} ${SPACING[3]};
  border-bottom: 1px solid ${COLORS.border.subtle};
  cursor: pointer;
  transition: background-color 0.15s ease;
  animation: ${fadeIn} 0.2s ease;
  
  ${({ $selected }) => $selected && css`
    background: ${COLORS.semantic.info.bg};
    border-left: 2px solid ${COLORS.semantic.info.main};
    padding-left: calc(${SPACING[3]} - 2px);
  `}
  
  ${({ $flash }) => $flash && css`
    animation: ${flashBg} 0.4s ease-out;
  `}
  
  &:hover {
    background: ${({ $selected }) => $selected ? COLORS.semantic.info.bg : COLORS.bg.hover};
  }
`;

const SymbolCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const SymbolName = styled.span`
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${COLORS.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SymbolLabel = styled.span`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  color: ${COLORS.text.tertiary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PriceCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

const Price = styled.span<{ $direction?: 'up' | 'down' | 'unchanged' }>`
  font-weight: ${TYPOGRAPHY.fontWeight.semibold};
  font-family: ${TYPOGRAPHY.fontFamily.mono};
  font-size: ${TYPOGRAPHY.fontSize.md};
  color: ${({ $direction }) =>
    $direction === 'up' ? COLORS.semantic.positive.main :
      $direction === 'down' ? COLORS.semantic.negative.main :
        COLORS.text.primary
  };
  transition: color 0.3s ease;
`;

const Change = styled.span<{ $value: number }>`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: ${EFFECTS.borderRadius.sm};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  font-family: ${TYPOGRAPHY.fontFamily.mono};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  background: ${({ $value }) =>
    $value > 0 ? COLORS.semantic.positive.bg :
      $value < 0 ? COLORS.semantic.negative.bg :
        'transparent'
  };
  color: ${({ $value }) =>
    $value > 0 ? COLORS.semantic.positive.main :
      $value < 0 ? COLORS.semantic.negative.main :
        COLORS.text.secondary
  };
`;

const SpreadCell = styled.div`
  text-align: right;
  min-width: 50px;
`;

const SpreadValue = styled.span`
  font-size: ${TYPOGRAPHY.fontSize.xs};
  font-family: ${TYPOGRAPHY.fontFamily.mono};
  color: ${COLORS.text.tertiary};
`;

const FavoriteButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: ${({ $active }) => $active ? COLORS.semantic.warning.main : COLORS.text.tertiary};
  cursor: pointer;
  transition: ${EFFECTS.transition.fast};
  
  &:hover {
    color: ${COLORS.semantic.warning.main};
    transform: scale(1.1);
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 120px;
  gap: ${SPACING[2]};
  color: ${COLORS.text.tertiary};
  font-size: ${TYPOGRAPHY.fontSize.md};
  
  svg {
    width: 32px;
    height: 32px;
    opacity: 0.5;
  }
`;

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

interface WatchlistProps {
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
      if (prev && prev.last !== ticks[symbol].last) {
        newFlash.add(symbol);
      }
    });

    if (newFlash.size > 0) {
      setFlashSymbols(newFlash);
      setTimeout(() => setFlashSymbols(new Set()), 400);
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
