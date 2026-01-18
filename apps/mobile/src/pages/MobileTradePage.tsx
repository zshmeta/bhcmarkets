import { useEffect, useState, useMemo } from 'react';
import { Chart } from '@repo/bhcm-ui/market';
import { OrderForm } from '@repo/bhcm-ui/trading';
import { useMarketStore, selectMetrics } from '@repo/sdk';
import { useWalletStore, selectBalances } from '@repo/sdk';
import { useWatchlistStore, selectSelectedSymbol } from '@repo/sdk';
import styled, { css, keyframes } from 'styled-components';

/**
 * MOBILE TRADE PAGE
 * Simple layout: Chart on top, Order entry on bottom
 */

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary, #0D1117);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--bg-secondary, #161B22);
  border-bottom: 1px solid var(--border-subtle, #30363D);
  flex-shrink: 0;
`;

const SymbolSection = styled.div`
  display: flex;
  align-items: baseline;
  gap: 2px;
`;

const SymbolName = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
`;

const SymbolQuote = styled.span`
  font-size: 0.75rem;
  color: var(--text-tertiary, #6E7681);
`;

const priceFlashAnim = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
`;

const PriceSection = styled.div`
  text-align: right;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CurrentPrice = styled.span<{ $flash?: boolean }>`
  font-size: 1.125rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);
  ${({ $flash }) => $flash && css`animation: ${priceFlashAnim} 0.2s ease-out;`}
`;

const PriceChange = styled.span<{ $positive?: boolean; $negative?: boolean }>`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  ${({ $positive }) => $positive && css`
    background: rgba(63, 185, 80, 0.15);
    color: #3FB950;
  `}
  ${({ $negative }) => $negative && css`
    background: rgba(248, 81, 73, 0.15);
    color: #F85149;
  `}
`;

// Chart section takes remaining space
const ChartSection = styled.div`
  flex: 1;
  min-height: 200px;
  position: relative;
  overflow: hidden;
`;

// Order form container
const OrderSection = styled.div`
  flex-shrink: 0;
  background: var(--bg-secondary, #161B22);
  border-top: 1px solid var(--border-subtle, #30363D);
  max-height: 50%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileTradePage() {
  // Store connections
  const metrics = useMarketStore(selectMetrics);
  const subscribe = useMarketStore((state) => state.subscribe);
  const unsubscribe = useMarketStore((state) => state.unsubscribe);
  const balances = useWalletStore(selectBalances);
  const selectedSymbol = useWatchlistStore(selectSelectedSymbol);

  // Local state
  const [prevPrice, setPrevPrice] = useState<string | null>(null);
  const [priceFlashActive, setPriceFlashActive] = useState(false);

  // Symbol info
  const baseAsset = selectedSymbol?.replace('USDT', '') || 'BTC';
  const currentPrice = metrics?.mid ? parseFloat(metrics.mid) : 0;
  
  // Try to get price change from metrics (fallback to 0)
  const priceChangePercent = useMemo(() => {
    if (metrics && 'priceChangePercent' in metrics) {
      return parseFloat((metrics as { priceChangePercent?: string }).priceChangePercent || '0');
    }
    return 0;
  }, [metrics]);

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

  // Format price helper
  const formatPrice = (p: number) => {
    if (p === 0) return '—';
    return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Container>
      {/* Header: Symbol + Price */}
      <Header>
        <SymbolSection>
          <SymbolName>{baseAsset}</SymbolName>
          <SymbolQuote>/USDT</SymbolQuote>
        </SymbolSection>

        <PriceSection>
          <CurrentPrice $flash={priceFlashActive} className="tabular-nums">
            ${formatPrice(currentPrice)}
          </CurrentPrice>
          <PriceChange $positive={priceChangePercent >= 0} $negative={priceChangePercent < 0}>
            {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
          </PriceChange>
        </PriceSection>
      </Header>

      {/* Chart - takes remaining space */}
      <ChartSection>
        <Chart />
      </ChartSection>

      {/* Order Entry - at bottom */}
      <OrderSection>
        <OrderForm />
      </OrderSection>
    </Container>
  );
}

// Default export
export default MobileTradePage;
