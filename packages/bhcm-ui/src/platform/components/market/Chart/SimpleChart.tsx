import { useEffect, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useWatchlistStore, selectSelectedSymbol } from '@repo/sdk';
import { handleApiError, logError } from '../../../../../../sdk/utils/errorHandler';

/**
 * SIMPLE CHART - Lightweight SVG-based price chart
 * A minimal chart that reliably displays data without heavy dependencies.
 */

interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type TimeRange = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

const INTERVAL_MAP: Record<TimeRange, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '1d': '1d'
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary, #161B22);
  border-radius: 0.375rem;
  height: 100%;
  min-height: 300px;
  overflow: hidden;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--bg-tertiary, #1C2128);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  gap: 0.5rem;
  flex-shrink: 0;
`;

const SymbolInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SymbolName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

const Price = styled.span`
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

const PriceChange = styled.span<{ $up: boolean }>`
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  color: ${({ $up }) => $up ? 'var(--color-positive, #3FB950)' : 'var(--color-negative, #F85149)'};
  background: ${({ $up }) => $up ? 'rgba(63, 185, 80, 0.15)' : 'rgba(248, 81, 73, 0.15)'};
`;

const TimeButtons = styled.div`
  display: flex;
  gap: 2px;
`;

const TimeBtn = styled.button<{ $active: boolean }>`
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  background: ${({ $active }) => $active ? 'rgba(88, 166, 255, 0.1)' : 'transparent'};
  border: 1px solid ${({ $active }) => $active ? 'var(--accent, #58A6FF)' : 'transparent'};
  border-radius: 4px;
  color: ${({ $active }) => $active ? 'var(--accent, #58A6FF)' : 'var(--text-tertiary, #6E7681)'};
  cursor: pointer;
  transition: all 0.1s;
  
  &:hover {
    color: var(--text-secondary, #9AA5B1);
    background: var(--surface-hover, #262C36);
  }
`;

const ChartArea = styled.div`
  flex: 1;
  position: relative;
  padding: 1rem;
  min-height: 200px;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary, #161B22);
  color: var(--text-secondary, #9AA5B1);
  font-size: 14px;
`;

const ErrorOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--bg-secondary, #161B22);
  color: var(--text-secondary, #9AA5B1);
  font-size: 12px;
`;

const RetryBtn = styled.button`
  padding: 0.5rem 1rem;
  font-size: 12px;
  background: var(--accent, #58A6FF);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  
  &:hover { filter: brightness(1.1); }
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--bg-tertiary, #1C2128);
  border-top: 1px solid var(--border-subtle, #262C36);
  font-size: 11px;
  color: var(--text-tertiary, #6E7681);
`;

const Stat = styled.div`
  display: flex;
  gap: 4px;
  
  label { color: var(--text-tertiary, #6E7681); }
  span { color: var(--text-secondary, #9AA5B1); font-family: 'IBM Plex Mono', monospace; }
`;

export const SimpleChart = () => {
  const selectedSymbol = useWatchlistStore(selectSelectedSymbol);
  const [timeRange, setTimeRange] = useState<TimeRange>('15m');
  const [klines, setKlines] = useState<KlineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKlines = useCallback(async (symbol: string, interval: string) => {
    console.log('[SimpleChart] Fetching klines:', symbol, interval);
    setLoading(true);
    setError(null);

    try {
      const url = `/binance-api/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const formattedData: KlineData[] = data.map((k: (string | number)[]) => ({
        time: Math.floor(Number(k[0]) / 1000),
        open: parseFloat(k[1] as string),
        high: parseFloat(k[2] as string),
        low: parseFloat(k[3] as string),
        close: parseFloat(k[4] as string),
        volume: parseFloat(k[5] as string),
      }));

      console.log('[SimpleChart] Got', formattedData.length, 'candles');
      setKlines(formattedData);
      setLoading(false);
    } catch (err) {
      console.error('[SimpleChart] Fetch error:', err);
      const appError = handleApiError(err);
      logError(appError);
      setError(appError.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSymbol) {
      fetchKlines(selectedSymbol, INTERVAL_MAP[timeRange]);
    }
  }, [selectedSymbol, timeRange, fetchKlines]);

  // Price info from latest candle
  const priceInfo = useMemo(() => {
    if (klines.length === 0) return null;
    const last = klines[klines.length - 1];
    const first = klines[0];
    if (!last || !first) return null;

    const change = last.close - first.open;
    const changePercent = (change / first.open) * 100;
    const high = Math.max(...klines.map(k => k.high));
    const low = Math.min(...klines.map(k => k.low));
    const volume = klines.reduce((sum, k) => sum + k.volume, 0);

    return { current: last.close, change, changePercent, high, low, volume };
  }, [klines]);

  // SVG chart dimensions
  const svgWidth = 800;
  const svgHeight = 200;
  const padding = { top: 10, right: 50, bottom: 20, left: 10 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Calculate chart path
  const chartPath = useMemo(() => {
    if (klines.length < 2) return '';

    const prices = klines.map(k => k.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const points = klines.map((k, i) => {
      const x = padding.left + (i / (klines.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((k.close - minPrice) / priceRange) * chartHeight;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [klines, chartWidth, chartHeight]);

  // Area path for gradient fill
  const areaPath = useMemo(() => {
    if (!chartPath) return '';
    const startX = padding.left;
    const endX = padding.left + chartWidth;
    const bottomY = padding.top + chartHeight;
    return `${chartPath} L ${endX},${bottomY} L ${startX},${bottomY} Z`;
  }, [chartPath, chartWidth, chartHeight]);

  const isUp = priceInfo ? priceInfo.change >= 0 : true;
  const lineColor = isUp ? '#3FB950' : '#F85149';
  const gradientId = isUp ? 'greenGradient' : 'redGradient';

  return (
    <Container className="card">
      <Toolbar>
        <SymbolInfo>
          <SymbolName>{selectedSymbol}</SymbolName>
          {priceInfo && (
            <>
              <Price>{priceInfo.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Price>
              <PriceChange $up={isUp}>
                {isUp ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%
              </PriceChange>
            </>
          )}
        </SymbolInfo>

        <TimeButtons>
          {(['1m', '5m', '15m', '1h', '4h', '1d'] as TimeRange[]).map(range => (
            <TimeBtn
              key={range}
              $active={timeRange === range}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </TimeBtn>
          ))}
        </TimeButtons>
      </Toolbar>

      <ChartArea>
        {loading && <LoadingOverlay>Loading chart data...</LoadingOverlay>}
        {error && !loading && (
          <ErrorOverlay>
            <span>{error}</span>
            <RetryBtn onClick={() => fetchKlines(selectedSymbol, INTERVAL_MAP[timeRange])}>
              Retry
            </RetryBtn>
          </ErrorOverlay>
        )}
        {!loading && !error && klines.length > 0 && (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            style={{ display: 'block' }}
          >
            <defs>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3FB950" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3FB950" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F85149" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#F85149" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path d={areaPath} fill={`url(#${gradientId})`} />

            {/* Price line */}
            <path
              d={chartPath}
              fill="none"
              stroke={lineColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Current price line */}
            {priceInfo && (
              <>
                <line
                  x1={padding.left}
                  y1={padding.top + chartHeight * 0.1}
                  x2={svgWidth - padding.right}
                  y2={padding.top + chartHeight * 0.1}
                  stroke="var(--border-subtle, #30363D)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={svgWidth - padding.right + 5}
                  y={padding.top + chartHeight * 0.1 + 4}
                  fill="var(--text-secondary, #9AA5B1)"
                  fontSize="10"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {priceInfo.current.toFixed(2)}
                </text>
              </>
            )}
          </svg>
        )}
      </ChartArea>

      {priceInfo && (
        <StatsBar>
          <Stat><label>High:</label><span>{priceInfo.high.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></Stat>
          <Stat><label>Low:</label><span>{priceInfo.low.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></Stat>
          <Stat><label>Vol:</label><span>{(priceInfo.volume / 1000000).toFixed(2)}M</span></Stat>
        </StatsBar>
      )}
    </Container>
  );
};

export { SimpleChart as Chart };
