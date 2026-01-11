/**
 * TradingWorkspace - Premium Trading Terminal
 * 
 * A professional-grade trading workspace featuring:
 * - Responsive grid layout with drag-and-drop
 * - Real-time market data visualization
 * - Professional trading components from @repo/trading-ui
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import styled, { ThemeProvider } from 'styled-components';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Import premium trading-ui components and hooks
import {
  tradingTheme,
  COLORS,
  OrderBook,
  TradingChart,
  OrderForm,
  Watchlist,
  AccountBar,
  TerminalPanel,
  useTicker,
  useOrderBook,
  usePositions,
  useInstruments,
  useChartData,
  type OrderRequest,
  type InstrumentCategory,
} from '@repo/trading-ui';

import { GlobalStyles } from '../../styles/GlobalStyles';

// =============================================================================
// STYLED COMPONENTS
// =============================================================================

const ResponsiveGridLayout = WidthProvider(Responsive) as any;

const WorkspaceContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${COLORS.bg.primary};
`;

const WorkspaceHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: linear-gradient(180deg, ${COLORS.bg.secondary} 0%, ${COLORS.bg.primary} 100%);
  border-bottom: 1px solid ${COLORS.border.subtle};
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
`;

const LogoIcon = styled.div`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${COLORS.semantic.info.main} 0%, ${COLORS.semantic.positive.main} 100%);
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  letter-spacing: 0.5px;
`;

const LogoText = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: ${COLORS.text.primary};
  letter-spacing: 0.5px;
`;

const GridWrapper = styled.div`
  flex: 1;
  padding: 8px;
  overflow: hidden;
`;

const GridItem = styled.div`
  background: ${COLORS.bg.tertiary};
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${COLORS.border.subtle};
  display: flex;
  flex-direction: column;
  
  &:hover {
    border-color: ${COLORS.border.default};
  }
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 4px;
  cursor: grab;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  &::before {
    content: '';
    width: 32px;
    height: 4px;
    background: ${COLORS.border.strong};
    border-radius: 2px;
  }
  
  ${GridItem}:hover & {
    opacity: 1;
  }
`;

const ItemContent = styled.div`
  flex: 1;
  overflow: hidden;
`;

const StatusBar = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  background: ${COLORS.bg.secondary};
  border-top: 1px solid ${COLORS.border.subtle};
  font-size: 11px;
  color: ${COLORS.text.tertiary};
`;

const StatusGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatusItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatusDot = styled.span<{ $status: 'online' | 'offline' | 'connecting' }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $status }) =>
    $status === 'online' ? COLORS.semantic.positive.main :
      $status === 'connecting' ? COLORS.semantic.warning.main :
        COLORS.semantic.negative.main
  };
`;

// =============================================================================
// LAYOUTS
// =============================================================================

const defaultLayouts = {
  lg: [
    { i: 'watchlist', x: 0, y: 0, w: 2, h: 10 },
    { i: 'chart', x: 2, y: 0, w: 6, h: 6 },
    { i: 'orderbook', x: 8, y: 0, w: 2, h: 6 },
    { i: 'orderform', x: 10, y: 0, w: 2, h: 6 },
    { i: 'terminal', x: 2, y: 6, w: 10, h: 4 },
  ],
  md: [
    { i: 'watchlist', x: 0, y: 0, w: 2, h: 8 },
    { i: 'chart', x: 2, y: 0, w: 5, h: 5 },
    { i: 'orderbook', x: 7, y: 0, w: 2, h: 5 },
    { i: 'orderform', x: 9, y: 0, w: 2, h: 5 },
    { i: 'terminal', x: 2, y: 5, w: 9, h: 3 },
  ],
  sm: [
    { i: 'watchlist', x: 0, y: 0, w: 2, h: 6 },
    { i: 'chart', x: 2, y: 0, w: 4, h: 5 },
    { i: 'orderbook', x: 0, y: 6, w: 3, h: 5 },
    { i: 'orderform', x: 3, y: 6, w: 3, h: 5 },
    { i: 'terminal', x: 0, y: 11, w: 6, h: 3 },
  ],
};

// =============================================================================
// COMPONENT
// =============================================================================

export const TradingWorkspace: React.FC = () => {
  // State
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [favorites, setFavorites] = useState<string[]>(['EURUSD', 'BTCUSD', 'XAUUSD']);

  // Hooks from trading-ui
  const {
    instruments,
    category,
    searchQuery,
    getInstrument,
    setCategory,
    setSearchQuery,
  } = useInstruments({
    initialCategory: 'all',
    initialSearch: ''
  });

  const { ticks, isStreaming } = useTicker(
    instruments.map(i => i.symbol)
  );

  const { orderBook, isLoading: orderBookLoading } = useOrderBook(selectedSymbol);

  const {
    data: chartData,
    timeframe,
    setTimeframe,
    isLoading: chartLoading
  } = useChartData(selectedSymbol);

  const {
    positions,
    orders,
    history,
    account,
    closePosition,
    cancelOrder,
  } = usePositions();

  // Get current instrument
  const currentInstrument = useMemo(() =>
    getInstrument(selectedSymbol),
    [selectedSymbol, getInstrument]
  );

  // Handlers
  const handleSymbolSelect = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
  }, []);

  const handleCategoryChange = useCallback((cat: InstrumentCategory | 'all') => {
    setCategory(cat);
  }, [setCategory]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleToggleFavorite = useCallback((symbol: string) => {
    setFavorites(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  }, []);

  const handleOrderSubmit = useCallback((order: OrderRequest) => {
    console.log('Order submitted:', order);
    // In real app, this would send to the trading engine
  }, []);

  const handlePriceClick = useCallback((price: number, side: 'bid' | 'ask') => {
    console.log('Price clicked:', price, side);
    // In real app, this would pre-fill the order form
  }, []);

  return (
    <ThemeProvider theme={tradingTheme}>
      <GlobalStyles />
      <WorkspaceContainer>
        {/* Account Bar */}
        <AccountBar account={account} />

        {/* Header */}
        <WorkspaceHeader>
          <Logo>
            <LogoIcon>BHC</LogoIcon>
            <LogoText>Markets Terminal</LogoText>
          </Logo>
        </WorkspaceHeader>

        {/* Grid Layout */}
        <GridWrapper>
          <ResponsiveGridLayout
            className="layout"
            layouts={defaultLayouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 11, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            margin={[8, 8]}
            containerPadding={[0, 0]}
            draggableHandle=".drag-handle"
            useCSSTransforms
          >
            {/* Watchlist */}
            <GridItem key="watchlist">
              <DragHandle className="drag-handle" />
              <ItemContent>
                <Watchlist
                  instruments={instruments}
                  ticks={ticks}
                  selectedSymbol={selectedSymbol}
                  category={category}
                  searchQuery={searchQuery}
                  favorites={favorites}
                  onSelect={handleSymbolSelect}
                  onCategoryChange={handleCategoryChange}
                  onSearchChange={handleSearchChange}
                  onToggleFavorite={handleToggleFavorite}
                />
              </ItemContent>
            </GridItem>

            {/* Chart */}
            <GridItem key="chart">
              <DragHandle className="drag-handle" />
              <ItemContent>
                <TradingChart
                  symbol={selectedSymbol}
                  data={chartData}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  isLoading={chartLoading}
                />
              </ItemContent>
            </GridItem>

            {/* Order Book */}
            <GridItem key="orderbook">
              <DragHandle className="drag-handle" />
              <ItemContent>
                <OrderBook
                  orderBook={orderBook}
                  decimals={currentInstrument?.decimals || 5}
                  onPriceClick={handlePriceClick}
                  isLoading={orderBookLoading}
                />
              </ItemContent>
            </GridItem>

            {/* Order Form */}
            <GridItem key="orderform">
              <DragHandle className="drag-handle" />
              <ItemContent>
                <OrderForm
                  symbol={selectedSymbol}
                  instrument={currentInstrument}
                  tick={ticks[selectedSymbol]}
                  freeMargin={account.freeMargin}
                  maxLeverage={currentInstrument?.maxLeverage || 100}
                  onSubmit={handleOrderSubmit}
                />
              </ItemContent>
            </GridItem>

            {/* Terminal Panel */}
            <GridItem key="terminal">
              <DragHandle className="drag-handle" />
              <ItemContent>
                <TerminalPanel
                  positions={positions}
                  orders={orders}
                  history={history}
                  onClosePosition={closePosition}
                  onCancelOrder={cancelOrder}
                />
              </ItemContent>
            </GridItem>
          </ResponsiveGridLayout>
        </GridWrapper>

        {/* Status Bar */}
        <StatusBar>
          <StatusGroup>
            <StatusItem>
              <StatusDot $status={isStreaming ? 'online' : 'connecting'} />
              {isStreaming ? 'Connected' : 'Connecting...'}
            </StatusItem>
            <StatusItem>
              {selectedSymbol} | {timeframe}
            </StatusItem>
          </StatusGroup>
          <StatusGroup>
            <StatusItem>
              Server: NY4
            </StatusItem>
            <StatusItem>
              Ping: 12ms
            </StatusItem>
          </StatusGroup>
        </StatusBar>
      </WorkspaceContainer>
    </ThemeProvider>
  );
};

export default TradingWorkspace;

