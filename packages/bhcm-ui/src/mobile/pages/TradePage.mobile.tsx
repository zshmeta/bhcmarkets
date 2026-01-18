import { useEffect, useState, useMemo } from 'react';
import { useMarketStore, selectMetrics } from '@repo/sdk';
import { useWalletStore, selectBalances } from '@repo/sdk';
import { useWatchlistStore, selectSelectedSymbol } from '@repo/sdk';
import styled, { css, keyframes } from 'styled-components';

/**
 * MOBILE TRADE PAGE
 * Simplified version with mock orderbook - no platform component dependencies
 */

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0D1117;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 0.75rem 1rem;
  background: #161B22;
  border-bottom: 1px solid #30363D;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SymbolName = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: #E6EDF3;
`;

const priceFlash = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
`;

const PriceBox = styled.div<{ $flash?: boolean }>`
  text-align: right;
  ${({ $flash }) => $flash && css`animation: ${priceFlash} 0.2s ease-out;`}
`;

const Price = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Consolas', monospace;
  color: #E6EDF3;
`;

const PriceChange = styled.span<{ $up?: boolean }>`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  ${({ $up }) => $up 
    ? css`background: rgba(63,185,80,0.15); color: #3FB950;`
    : css`background: rgba(248,81,73,0.15); color: #F85149;`
  }
`;

const TabsRow = styled.div`
  display: flex;
  background: #161B22;
  border-bottom: 1px solid #30363D;
`;

const Tab = styled.button<{ $active?: boolean }>`
  flex: 1;
  padding: 0.75rem;
  background: transparent;
  border: none;
  color: ${({ $active }) => $active ? '#3B82F6' : '#6E7681'};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid ${({ $active }) => $active ? '#3B82F6' : 'transparent'};
  transition: all 0.2s;
`;

const Content = styled.div`
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
`;

// Simple chart placeholder
const ChartArea = styled.div`
  height: 200px;
  background: linear-gradient(180deg, #1C2128 0%, #0D1117 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #30363D;
  position: relative;
  overflow: hidden;
`;

const ChartPlaceholder = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  height: 100px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 1rem;
`;

const ChartBar = styled.div<{ $height: number; $up?: boolean }>`
  width: 8px;
  height: ${({ $height }) => $height}%;
  background: ${({ $up }) => $up ? '#3FB950' : '#F85149'};
  border-radius: 2px;
  opacity: 0.7;
`;

// Order book styles
const OrderBookContainer = styled.div`
  padding: 0.5rem;
`;

const OrderBookHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 0.5rem;
  font-size: 10px;
  color: #6E7681;
  text-transform: uppercase;
  font-weight: 600;
`;

const OrderRow = styled.div<{ $side: 'ask' | 'bid' }>`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  font-family: 'SF Mono', monospace;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    ${({ $side }) => $side === 'bid' ? 'left: 0;' : 'right: 0;'}
    width: var(--depth, 0%);
    background: ${({ $side }) => $side === 'bid' 
      ? 'rgba(63, 185, 80, 0.1)' 
      : 'rgba(248, 81, 73, 0.1)'};
  }
`;

const OrderPrice = styled.span<{ $side: 'ask' | 'bid' }>`
  color: ${({ $side }) => $side === 'bid' ? '#3FB950' : '#F85149'};
  font-weight: 600;
  position: relative;
`;

const OrderSize = styled.span`
  color: #9AA5B1;
  text-align: center;
  position: relative;
`;

const OrderTotal = styled.span`
  color: #6E7681;
  text-align: right;
  position: relative;
`;

const Spread = styled.div`
  padding: 0.5rem;
  text-align: center;
  font-size: 0.75rem;
  color: #6E7681;
  background: #1C2128;
  margin: 0.25rem 0;
  border-radius: 4px;
`;

const InfoBar = styled.div`
  padding: 0.5rem 1rem;
  background: #161B22;
  border-top: 1px solid #30363D;
  display: flex;
  justify-content: space-between;
`;

const InfoItem = styled.div`
  text-align: center;
`;

const InfoLabel = styled.div`
  font-size: 9px;
  color: #6E7681;
  text-transform: uppercase;
  margin-bottom: 2px;
`;

const InfoValue = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #E6EDF3;
  font-family: 'SF Mono', monospace;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #161B22;
  border-top: 1px solid #30363D;
`;

const ActionBtn = styled.button<{ $variant: 'buy' | 'sell' }>`
  flex: 1;
  height: 48px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: transform 0.1s, opacity 0.1s;
  
  ${({ $variant }) => $variant === 'buy' 
    ? css`background: #3FB950; color: white;`
    : css`background: #F85149; color: white;`
  }
  
  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
`;

// ============================================================================
// MOCK DATA
// ============================================================================

const generateMockOrderBook = (midPrice: number) => {
  const asks = [];
  const bids = [];
  
  for (let i = 0; i < 8; i++) {
    const askPrice = midPrice * (1 + 0.0001 * (i + 1));
    const bidPrice = midPrice * (1 - 0.0001 * (i + 1));
    const size = Math.random() * 2 + 0.1;
    
    asks.push({ price: askPrice, size, total: size * askPrice });
    bids.push({ price: bidPrice, size, total: size * bidPrice });
  }
  
  return { asks: asks.reverse(), bids };
};

const generateChartBars = () => {
  return Array.from({ length: 30 }, () => ({
    height: Math.random() * 80 + 20,
    up: Math.random() > 0.5
  }));
};

// ============================================================================
// COMPONENT
// ============================================================================

type TabId = 'trade' | 'chart' | 'book';

export function MobileTradePage() {
  const metrics = useMarketStore(selectMetrics);
  const subscribe = useMarketStore((state) => state.subscribe);
  const unsubscribe = useMarketStore((state) => state.unsubscribe);
  const balances = useWalletStore(selectBalances);
  const selectedSymbol = useWatchlistStore(selectSelectedSymbol);

  const [activeTab, setActiveTab] = useState<TabId>('trade');
  const [prevPrice, setPrevPrice] = useState<string | null>(null);
  const [priceFlashActive, setPriceFlashActive] = useState(false);
  const [chartBars] = useState(generateChartBars);

  const baseAsset = selectedSymbol?.replace('USDT', '') || 'BTC';
  const currentPrice = metrics?.mid ? parseFloat(metrics.mid) : 65432.10;
  const priceChangePercent = metrics?.priceChangePercent ? parseFloat(metrics.priceChangePercent) : 2.34;

  // Price flash effect
  useEffect(() => {
    if (metrics?.mid && metrics.mid !== prevPrice) {
      setPrevPrice(metrics.mid);
      setPriceFlashActive(true);
      const timer = setTimeout(() => setPriceFlashActive(false), 200);
      return () => clearTimeout(timer);
    }
  }, [metrics?.mid, prevPrice]);

  // Subscribe to market data
  useEffect(() => {
    if (selectedSymbol) {
      subscribe(selectedSymbol);
      return () => unsubscribe();
    }
  }, [selectedSymbol, subscribe, unsubscribe]);

  // Mock orderbook based on current price
  const orderBook = useMemo(() => generateMockOrderBook(currentPrice), [currentPrice]);

  // Account info
  const accountInfo = useMemo(() => {
    const usdtBal = balances.find(b => b.asset === 'USDT');
    const baseBal = balances.find(b => b.asset === baseAsset);
    return {
      usdt: usdtBal ? parseFloat(usdtBal.available) : 10000,
      base: baseBal ? parseFloat(baseBal.total) : 0.15,
    };
  }, [balances, baseAsset]);

  const formatPrice = (p: number) => p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatSize = (s: number) => s.toFixed(4);

  const spread = orderBook.asks[orderBook.asks.length - 1].price - orderBook.bids[0].price;
  const spreadPercent = (spread / currentPrice) * 100;

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderRow>
          <SymbolName>{baseAsset}/USDT</SymbolName>
          <PriceBox $flash={priceFlashActive}>
            <Price className="tabular-nums">${formatPrice(currentPrice)}</Price>
            <PriceChange $up={priceChangePercent >= 0}>
              {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </PriceChange>
          </PriceBox>
        </HeaderRow>
      </Header>

      {/* Tabs */}
      <TabsRow>
        <Tab $active={activeTab === 'trade'} onClick={() => setActiveTab('trade')}>Trade</Tab>
        <Tab $active={activeTab === 'chart'} onClick={() => setActiveTab('chart')}>Chart</Tab>
        <Tab $active={activeTab === 'book'} onClick={() => setActiveTab('book')}>Book</Tab>
      </TabsRow>

      {/* Content */}
      <Content>
        {(activeTab === 'trade' || activeTab === 'chart') && (
          <ChartArea>
            <ChartPlaceholder>
              {chartBars.map((bar, i) => (
                <ChartBar key={i} $height={bar.height} $up={bar.up} />
              ))}
            </ChartPlaceholder>
          </ChartArea>
        )}

        {(activeTab === 'trade' || activeTab === 'book') && (
          <OrderBookContainer>
            <OrderBookHeader>
              <span>Price (USDT)</span>
              <span style={{ textAlign: 'center' }}>Size ({baseAsset})</span>
              <span style={{ textAlign: 'right' }}>Total</span>
            </OrderBookHeader>

            {/* Asks (sells) */}
            {orderBook.asks.map((ask, i) => (
              <OrderRow key={`ask-${i}`} $side="ask" style={{ '--depth': `${(8-i) * 12}%` } as React.CSSProperties}>
                <OrderPrice $side="ask">{formatPrice(ask.price)}</OrderPrice>
                <OrderSize>{formatSize(ask.size)}</OrderSize>
                <OrderTotal>${formatPrice(ask.total)}</OrderTotal>
              </OrderRow>
            ))}

            <Spread>
              Spread: ${spread.toFixed(2)} ({spreadPercent.toFixed(3)}%)
            </Spread>

            {/* Bids (buys) */}
            {orderBook.bids.map((bid, i) => (
              <OrderRow key={`bid-${i}`} $side="bid" style={{ '--depth': `${(8-i) * 12}%` } as React.CSSProperties}>
                <OrderPrice $side="bid">{formatPrice(bid.price)}</OrderPrice>
                <OrderSize>{formatSize(bid.size)}</OrderSize>
                <OrderTotal>${formatPrice(bid.total)}</OrderTotal>
              </OrderRow>
            ))}
          </OrderBookContainer>
        )}
      </Content>

      {/* Account Info */}
      <InfoBar>
        <InfoItem>
          <InfoLabel>Available USDT</InfoLabel>
          <InfoValue>${accountInfo.usdt.toLocaleString()}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>{baseAsset} Balance</InfoLabel>
          <InfoValue>{accountInfo.base.toFixed(4)}</InfoValue>
        </InfoItem>
        <InfoItem>
          <InfoLabel>Est. Value</InfoLabel>
          <InfoValue>${(accountInfo.base * currentPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}</InfoValue>
        </InfoItem>
      </InfoBar>

      {/* Action Buttons */}
      <ActionButtons>
        <ActionBtn $variant="buy">Buy {baseAsset}</ActionBtn>
        <ActionBtn $variant="sell">Sell {baseAsset}</ActionBtn>
      </ActionButtons>
    </Container>
  );
}
