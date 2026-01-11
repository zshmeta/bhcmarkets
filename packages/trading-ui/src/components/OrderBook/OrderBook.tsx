/**
 * OrderBook Component (Premium)
 * 
 * Professional market depth display with real-time updates.
 * Features:
 * - Depth visualization with gradient bars
 * - Price flash animations on updates
 * - Hover highlighting with price tooltip
 * - Click-to-trade functionality
 * - Configurable precision and levels
 */

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import type { OrderBookData, OrderBookLevel } from '../../types';
import { formatPrice, formatVolume } from '../../utils';
import { COLORS } from '../../theme';
import {
  Container,
  Header,
  Title,
  TitleText,
  ViewToggle,
  ViewButton,
  SpreadBadge,
  SpreadValue,
  SpreadLabel,
  BookContainer,
  ColumnHeaders,
  ColumnHeader,
  AsksContainer,
  BidsContainer,
  SpreadRow,
  MidPrice,
  DirectionIcon,
  LevelRow,
  Cell,
  PriceCell,
  Tooltip,
  TooltipRow,
  TooltipLabel,
  TooltipValue,
  EmptyState,
  LoadingSpinner
} from './OrderBook.styles';

// =============================================================================
// ICONS
// =============================================================================

const BothSidesIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="2" width="5" height="5" rx="1" />
    <rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" />
    <rect x="9" y="9" width="5" height="5" rx="1" />
  </svg>
);

const BidsOnlyIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="2" width="12" height="5" rx="1" fill={COLORS.semantic.positive.main} />
    <rect x="2" y="9" width="12" height="5" rx="1" opacity="0.3" />
  </svg>
);

const AsksOnlyIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="2" width="12" height="5" rx="1" fill={COLORS.semantic.negative.main} />
    <rect x="2" y="9" width="12" height="5" rx="1" opacity="0.3" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

type ViewMode = 'both' | 'bids' | 'asks';

interface OrderBookProps {
  /** Order book data */
  orderBook: OrderBookData | null;
  /** Number of levels to display */
  levels?: number;
  /** Decimal places for price */
  decimals?: number;
  /** Called when a price level is clicked */
  onPriceClick?: (price: number, side: 'bid' | 'ask') => void;
  /** Show cumulative volume */
  showCumulative?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Custom title */
  title?: string;
}

export function OrderBook({
  orderBook,
  levels = 12,
  decimals = 5,
  onPriceClick,
  showCumulative = false,
  isLoading = false,
  title = 'Order Book',
}: OrderBookProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [hoveredLevel, setHoveredLevel] = useState<{ price: number; side: 'bid' | 'ask' } | null>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; level: OrderBookLevel | null }>({
    visible: false, x: 0, y: 0, level: null
  });
  const [lastMidPrice, setLastMidPrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'unchanged'>('unchanged');
  const prevOrderBookRef = useRef<OrderBookData | null>(null);

  // Track price direction
  useEffect(() => {
    if (orderBook && lastMidPrice !== null) {
      if (orderBook.midPrice > lastMidPrice) {
        setPriceDirection('up');
      } else if (orderBook.midPrice < lastMidPrice) {
        setPriceDirection('down');
      }
    }
    if (orderBook) {
      setLastMidPrice(orderBook.midPrice);
    }
  }, [orderBook?.midPrice]);

  // Calculate max cumulative for depth visualization
  const maxCumulative = useMemo(() => {
    if (!orderBook) return 1;
    const maxBid = orderBook.bids[Math.min(levels - 1, orderBook.bids.length - 1)]?.cumulative || 1;
    const maxAsk = orderBook.asks[Math.min(levels - 1, orderBook.asks.length - 1)]?.cumulative || 1;
    return Math.max(maxBid, maxAsk);
  }, [orderBook, levels]);

  // Get display levels
  const displayBids = useMemo(() =>
    orderBook?.bids.slice(0, levels) || [],
    [orderBook, levels]
  );

  const displayAsks = useMemo(() =>
    orderBook?.asks.slice(0, levels).reverse() || [],
    [orderBook, levels]
  );

  const handleMouseEnter = useCallback((e: React.MouseEvent, level: OrderBookLevel, side: 'bid' | 'ask') => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHoveredLevel({ price: level.price, side });
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      level,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredLevel(null);
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handleClick = useCallback((price: number, side: 'bid' | 'ask') => {
    onPriceClick?.(price, side);
  }, [onPriceClick]);

  const renderLevel = (level: OrderBookLevel, side: 'bid' | 'ask', index: number) => {
    const depth = maxCumulative > 0 ? (level.cumulative / maxCumulative) * 100 : 0;
    const volumeDisplay = showCumulative ? level.cumulative : level.quantity;
    const isHovered = hoveredLevel?.price === level.price && hoveredLevel?.side === side;

    return (
      <LevelRow
        key={`${side}-${level.price}-${index}`}
        $side={side}
        $depth={depth}
        $isHovered={isHovered}
        onMouseEnter={(e) => handleMouseEnter(e, level, side)}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleClick(level.price, side)}
      >
        <Cell $align="left" $color={COLORS.text.secondary}>
          {formatVolume(volumeDisplay)}
        </Cell>
        <PriceCell $align="center" $side={side} $bold>
          {formatPrice(level.price, decimals)}
        </PriceCell>
        <Cell $align="right" $color={COLORS.text.tertiary}>
          {formatVolume(level.total)}
        </Cell>
      </LevelRow>
    );
  };

  // Loading state
  if (isLoading || !orderBook) {
    return (
      <Container>
        <Header>
          <Title>
            <TitleText>{title}</TitleText>
          </Title>
        </Header>
        <EmptyState>
          <LoadingSpinner />
          <span>{isLoading ? 'Loading...' : 'No data'}</span>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <TitleText>{title}</TitleText>
        </Title>
        <ViewToggle>
          <ViewButton $active={viewMode === 'both'} onClick={() => setViewMode('both')} title="Show both">
            <BothSidesIcon />
          </ViewButton>
          <ViewButton $active={viewMode === 'bids'} onClick={() => setViewMode('bids')} title="Bids only">
            <BidsOnlyIcon />
          </ViewButton>
          <ViewButton $active={viewMode === 'asks'} onClick={() => setViewMode('asks')} title="Asks only">
            <AsksOnlyIcon />
          </ViewButton>
        </ViewToggle>
      </Header>

      <ColumnHeaders>
        <ColumnHeader $align="left">Size</ColumnHeader>
        <ColumnHeader $align="center">Price</ColumnHeader>
        <ColumnHeader $align="right">Total</ColumnHeader>
      </ColumnHeaders>

      <BookContainer>
        {viewMode !== 'bids' && (
          <AsksContainer>
            {displayAsks.map((level, i) => renderLevel(level, 'ask', i))}
          </AsksContainer>
        )}

        <SpreadRow>
          <MidPrice $direction={priceDirection}>
            {priceDirection !== 'unchanged' && (
              <DirectionIcon $direction={priceDirection}>
                {priceDirection === 'up' ? '▲' : '▼'}
              </DirectionIcon>
            )}
            {formatPrice(orderBook.midPrice, decimals)}
          </MidPrice>
          <SpreadBadge>
            <SpreadLabel>Spread:</SpreadLabel>
            <SpreadValue>{formatPrice(orderBook.spread, decimals)}</SpreadValue>
          </SpreadBadge>
        </SpreadRow>

        {viewMode !== 'asks' && (
          <BidsContainer>
            {displayBids.map((level, i) => renderLevel(level, 'bid', i))}
          </BidsContainer>
        )}
      </BookContainer>

      {tooltip.level && (
        <Tooltip $visible={tooltip.visible} $x={tooltip.x} $y={tooltip.y}>
          <TooltipRow>
            <TooltipLabel>Price:</TooltipLabel>
            <TooltipValue>{formatPrice(tooltip.level.price, decimals)}</TooltipValue>
          </TooltipRow>
          <TooltipRow>
            <TooltipLabel>Quantity:</TooltipLabel>
            <TooltipValue>{formatVolume(tooltip.level.quantity)}</TooltipValue>
          </TooltipRow>
          <TooltipRow>
            <TooltipLabel>Total:</TooltipLabel>
            <TooltipValue>${formatVolume(tooltip.level.total)}</TooltipValue>
          </TooltipRow>
        </Tooltip>
      )}
    </Container>
  );
}

export default OrderBook;
