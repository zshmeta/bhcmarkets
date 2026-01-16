import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createChart, IChartApi, ColorType, UTCTimestamp, LineSeries, CandlestickSeries, HistogramSeries, CrosshairMode } from 'lightweight-charts';
import { handleApiError, logError } from '../../utils/errorHandler';
import { useWatchlistStore, selectSelectedSymbol } from '../../store/watchlistStore';
import { useAutomationStore } from '../../store/automationStore';
import { useTradingStore } from '../../store/tradingStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useI18n } from '../../i18n';
import { Icons } from '../Icons';
import {
  Container, Toolbar, ToolbarRight, ToolbarScrollArea, DemoIndicator,
  IndicatorGroup, IndicatorBtn, ChartTypeGroup, ChartTypeBtn,
  TimeRangeGroup, TimeRangeBtn, ToolBtn, OhlcBar, SymbolInfo, SymbolName,
  CurrentPrice, PriceChange, OhlcData, OhlcItem, Legend,
  MainChart, LoadingOverlay, Spinner, ErrorOverlay, RetryBtn,
} from './Chart.styles';

/**
 * PRICE CHART - TradingView-style candlestick/line chart with indicators
 */

export type ChartType = 'line' | 'candlestick';
export type TimeRange = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
export type Indicator = 'MA' | 'EMA' | 'BOLL' | 'VOL';

const CHART_COLORS = {
  accent: '#58A6FF', buy: '#3FB950', sell: '#F85149',
  text: '#9AA5B1', textSecondary: '#6E7681', border: '#30363D',
  bg: '#161B22', bgSecondary: '#0D1117',
  ma7: '#F0B90B', ma25: '#E377C2', ma99: '#9467BD',
  ema12: '#00D4AA', ema26: '#FF6B9D',
  bollUpper: '#FF6B6B', bollMiddle: '#4ECDC4', bollLower: '#45B7D1',
  volumeUp: 'rgba(63, 185, 80, 0.5)', volumeDown: 'rgba(248, 81, 73, 0.5)',
  grid: 'rgba(48, 54, 61, 0.5)',
};

interface KlineData { time: UTCTimestamp; open: number; high: number; low: number; close: number; volume: number; }
interface CrosshairData { time: string; open: number; high: number; low: number; close: number; volume: number; change: number; changePercent: number; }

const INTERVAL_MAP: Record<TimeRange, string> = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '1d': '1d' };

function calculateMA(data: KlineData[], period: number) {
  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) { const item = data[i - j]; if (item) sum += item.close; }
    const current = data[i];
    if (current) result.push({ time: current.time, value: sum / period });
  }
  return result;
}

function calculateEMA(data: KlineData[], period: number) {
  const result = [];
  const multiplier = 2 / (period + 1);
  let ema = data[0]?.close || 0;
  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    if (!current) continue;
    ema = i === 0 ? current.close : (current.close - ema) * multiplier + ema;
    if (i >= period - 1) result.push({ time: current.time, value: ema });
  }
  return result;
}

function calculateBOLL(data: KlineData[], period = 20, stdDev = 2) {
  const upper: { time: UTCTimestamp; value: number }[] = [], middle: { time: UTCTimestamp; value: number }[] = [], lower: { time: UTCTimestamp; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) { const item = data[i - j]; if (item) sum += item.close; }
    const ma = sum / period;
    let squaredDiffSum = 0;
    for (let j = 0; j < period; j++) { const item = data[i - j]; if (item) squaredDiffSum += Math.pow(item.close - ma, 2); }
    const std = Math.sqrt(squaredDiffSum / period);
    const current = data[i];
    if (current) { middle.push({ time: current.time, value: ma }); upper.push({ time: current.time, value: ma + stdDev * std }); lower.push({ time: current.time, value: ma - stdDev * std }); }
  }
  return { upper, middle, lower };
}

const Chart = () => {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const mainChartRef = useRef<HTMLDivElement>(null);
  const mainChartApiRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const indicatorSeriesRef = useRef<Map<string, any>>(new Map());

  const selectedSymbol = useWatchlistStore(selectSelectedSymbol);
  const triggers = useAutomationStore((state) => state.triggers);
  const orders = useTradingStore((state) => state.orders);
  const CurrentOrders = useMemo(() => orders.filter(o => o.status === 'open'), [orders]);

  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [timeRange, setTimeRange] = useState<TimeRange>('15m');
  const [klines, setKlines] = useState<KlineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndicators, setActiveIndicators] = useState<Set<Indicator>>(new Set(['MA', 'VOL']));
  const [crosshairData, setCrosshairData] = useState<CrosshairData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  const toggleIndicator = useCallback((indicator: Indicator) => setActiveIndicators(prev => { const s = new Set(prev); s.has(indicator) ? s.delete(indicator) : s.add(indicator); return s; }), []);
  const klinesCacheRef = useRef<Map<string, { data: KlineData[]; timestamp: number }>>(new Map());
  const CACHE_TTL = 60000;

  const fetchKlines = useCallback(async (symbol: string, interval: string, retryCount = 0) => {
    console.log('[Chart] fetchKlines called with', symbol, interval, retryCount);
    const cacheKey = `${symbol}-${interval}`;
    const cached = klinesCacheRef.current.get(cacheKey);
    const now = Date.now();
    
    // Use cached data if fresh
    if (cached && now - cached.timestamp < CACHE_TTL) { 
      setKlines(cached.data); 
      setLoading(false); 
      setError(null); 
      return; 
    }
    
    // Only set loading if we don't have cached data (avoids flashing on refresh)
    if (!cached) setLoading(true);
    
    try {
      const url = `/binance-api/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`;
      const response = await fetch(url);
      if (!response.ok) throw response;
      const data = await response.json();
      const formattedData: KlineData[] = data.map((k: (string | number)[]) => ({ time: Math.floor(Number(k[0]) / 1000) as UTCTimestamp, open: parseFloat(k[1] as string), high: parseFloat(k[2] as string), low: parseFloat(k[3] as string), close: parseFloat(k[4] as string), volume: parseFloat(k[5] as string) }));
      klinesCacheRef.current.set(cacheKey, { data: formattedData, timestamp: now });
      setKlines(formattedData); setError(null); setLoading(false);
    } catch (err) {
      const appError = handleApiError(err); logError(appError);
      if (cached) { setKlines(cached.data); setError(null); setLoading(false); return; }
      if (retryCount < 3) { setTimeout(() => fetchKlines(symbol, interval, retryCount + 1), 2000 * (retryCount + 1)); return; }
      setError(appError.message); setLoading(false);
    }
  }, []);

  useEffect(() => { if (selectedSymbol) { console.log('[Chart] Fetching klines for', selectedSymbol, INTERVAL_MAP[timeRange]); fetchKlines(selectedSymbol, INTERVAL_MAP[timeRange]); } else { console.log('[Chart] No selectedSymbol, skipping fetch'); } }, [selectedSymbol, timeRange, fetchKlines]);
  useEffect(() => { if (!selectedSymbol) return; const i = setInterval(() => fetchKlines(selectedSymbol, INTERVAL_MAP[timeRange]), 60000); return () => clearInterval(i); }, [selectedSymbol, timeRange, fetchKlines]);

  const formatTime = useCallback((timestamp: number) => new Date(timestamp * 1000).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }), []);

  useEffect(() => {
    if (!mainChartRef.current) return;
    const initChart = () => {
      if (!mainChartRef.current) return null;
      const containerWidth = mainChartRef.current.clientWidth || mainChartRef.current.offsetWidth;
      const containerHeight = mainChartRef.current.clientHeight || mainChartRef.current.offsetHeight || 350;
      return createChart(mainChartRef.current, {
        layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: CHART_COLORS.text, attributionLogo: false },
        width: containerWidth, height: containerHeight,
        grid: { vertLines: { color: CHART_COLORS.grid, style: 1 }, horzLines: { color: CHART_COLORS.grid, style: 1 } },
        timeScale: { timeVisible: true, secondsVisible: false, borderColor: CHART_COLORS.border, rightOffset: 5, barSpacing: 8, minBarSpacing: 2 },
        rightPriceScale: { borderColor: CHART_COLORS.border, scaleMargins: { top: 0.05, bottom: 0.05 }, autoScale: true },
        crosshair: { mode: CrosshairMode.Normal, vertLine: { color: CHART_COLORS.accent, width: 1, style: 2, labelBackgroundColor: CHART_COLORS.bg }, horzLine: { color: CHART_COLORS.accent, width: 1, style: 2, labelBackgroundColor: CHART_COLORS.bg } },
        handleScroll: { vertTouchDrag: false },
      });
    };
    const rafId = requestAnimationFrame(() => {
      const chart = initChart(); if (!chart) return;
      mainChartApiRef.current = chart;
      const candlestickSeries = chart.addSeries(CandlestickSeries, { upColor: CHART_COLORS.buy, downColor: CHART_COLORS.sell, borderVisible: false, wickUpColor: CHART_COLORS.buy, wickDownColor: CHART_COLORS.sell, priceLineVisible: true, lastValueVisible: true });
      mainSeriesRef.current = candlestickSeries;
      chart.subscribeCrosshairMove((param) => {
        if (!param.time || !param.seriesData || !mainSeriesRef.current) { setCrosshairData(null); return; }
        const data = param.seriesData.get(mainSeriesRef.current);
        if (data && 'open' in data) {
          const kline = data as { open: number; high: number; low: number; close: number };
          const matchingKline = klines.find(k => k.time === param.time);
          setCrosshairData({ time: formatTime(param.time as number), open: kline.open, high: kline.high, low: kline.low, close: kline.close, volume: matchingKline?.volume || 0, change: kline.close - kline.open, changePercent: ((kline.close - kline.open) / kline.open) * 100 });
        }
      });
      setChartReady(true);
    });
    const resizeObserver = new ResizeObserver((entries) => { for (const entry of entries) { if (mainChartApiRef.current && entry.target === mainChartRef.current) { const { width, height } = entry.contentRect; if (width > 0 && height > 0) mainChartApiRef.current.applyOptions({ width: Math.floor(width), height: Math.floor(height) }); } } });
    if (mainChartRef.current) resizeObserver.observe(mainChartRef.current);
    const handleResize = () => { if (mainChartRef.current && mainChartApiRef.current) mainChartApiRef.current.applyOptions({ width: mainChartRef.current.clientWidth, height: mainChartRef.current.clientHeight || 350 }); };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(rafId); resizeObserver.disconnect(); window.removeEventListener('resize', handleResize); mainSeriesRef.current = null; indicatorSeriesRef.current.clear(); if (mainChartApiRef.current) { mainChartApiRef.current.remove(); mainChartApiRef.current = null; } setChartReady(false); };
  }, [formatTime]);

  useEffect(() => {
    const chart = mainChartApiRef.current; if (!chart || !chartReady) return;
    if (mainSeriesRef.current) { try { chart.removeSeries(mainSeriesRef.current); } catch { } mainSeriesRef.current = null; }
    try {
      if (chartType === 'line') { mainSeriesRef.current = chart.addSeries(LineSeries, { color: CHART_COLORS.accent, lineWidth: 2, priceLineVisible: true, lastValueVisible: true, crosshairMarkerVisible: true, crosshairMarkerRadius: 4 }); }
      else { mainSeriesRef.current = chart.addSeries(CandlestickSeries, { upColor: CHART_COLORS.buy, downColor: CHART_COLORS.sell, borderVisible: false, wickUpColor: CHART_COLORS.buy, wickDownColor: CHART_COLORS.sell, priceLineVisible: true, lastValueVisible: true }); }
      if (klines.length > 0) { chartType === 'line' ? mainSeriesRef.current.setData(klines.map(k => ({ time: k.time, value: k.close }))) : mainSeriesRef.current.setData(klines); chart.timeScale().fitContent(); }
    } catch (err) { console.error('Failed to create series:', err); }
  }, [chartType, chartReady, klines]);

  useEffect(() => { if (!mainSeriesRef.current || !chartReady || klines.length === 0) return; try { chartType === 'line' ? mainSeriesRef.current.setData(klines.map(k => ({ time: k.time, value: k.close }))) : mainSeriesRef.current.setData(klines); mainChartApiRef.current?.timeScale().fitContent(); } catch (err) { console.error('Failed to update chart data:', err); } }, [klines, chartReady, chartType]);

  useEffect(() => {
    const chart = mainChartApiRef.current; if (!chart || !chartReady || !activeIndicators.has('VOL')) { if (volumeSeriesRef.current) { try { chart?.removeSeries(volumeSeriesRef.current); } catch { } volumeSeriesRef.current = null; } return; }
    try { const volumeSeries = chart.addSeries(HistogramSeries, { color: CHART_COLORS.volumeUp, priceFormat: { type: 'volume' }, priceScaleId: '' }); volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } }); volumeSeriesRef.current = volumeSeries; if (klines.length > 0) { const volumeData = klines.map(k => ({ time: k.time, value: k.volume, color: k.close >= k.open ? CHART_COLORS.volumeUp : CHART_COLORS.volumeDown })); volumeSeries.setData(volumeData); } } catch (err) { console.error('Failed to init volume series:', err); }
    return () => { if (volumeSeriesRef.current) { try { chart.removeSeries(volumeSeriesRef.current); } catch { } volumeSeriesRef.current = null; } };
  }, [activeIndicators, chartReady, klines.length]);

  useEffect(() => { if (!volumeSeriesRef.current || klines.length === 0 || !activeIndicators.has('VOL')) return; try { const volumeData = klines.map(k => ({ time: k.time, value: k.volume, color: k.close >= k.open ? CHART_COLORS.volumeUp : CHART_COLORS.volumeDown })); volumeSeriesRef.current.setData(volumeData); } catch { } }, [klines, activeIndicators]);

  useEffect(() => {
    const chart = mainChartApiRef.current; if (!chart || !chartReady || klines.length === 0) return;
    indicatorSeriesRef.current.forEach(series => { try { chart.removeSeries(series); } catch { } }); indicatorSeriesRef.current.clear();
    if (activeIndicators.has('MA')) { try { const periods = [7, 25, 99], colors = [CHART_COLORS.ma7, CHART_COLORS.ma25, CHART_COLORS.ma99]; periods.forEach((period, i) => { const data = calculateMA(klines, period); const series = chart.addSeries(LineSeries, { color: colors[i], lineWidth: 1, priceLineVisible: false, lastValueVisible: false }); series.setData(data); indicatorSeriesRef.current.set(`ma${period}`, series); }); } catch { } }
    if (activeIndicators.has('EMA')) { try { const periods = [12, 26], colors = [CHART_COLORS.ema12, CHART_COLORS.ema26]; periods.forEach((period, i) => { const data = calculateEMA(klines, period); const series = chart.addSeries(LineSeries, { color: colors[i], lineWidth: 1, priceLineVisible: false, lastValueVisible: false }); series.setData(data); indicatorSeriesRef.current.set(`ema${period}`, series); }); } catch { } }
    if (activeIndicators.has('BOLL')) { try { const boll = calculateBOLL(klines);[{ data: boll.upper, color: CHART_COLORS.bollUpper, key: 'bollUpper', style: 2 }, { data: boll.middle, color: CHART_COLORS.bollMiddle, key: 'bollMiddle', style: 0 }, { data: boll.lower, color: CHART_COLORS.bollLower, key: 'bollLower', style: 2 }].forEach(({ data, color, key, style }) => { const series = chart.addSeries(LineSeries, { color, lineWidth: 1, lineStyle: style, priceLineVisible: false, lastValueVisible: false }); series.setData(data); indicatorSeriesRef.current.set(key, series); }); } catch { } }
  }, [klines, activeIndicators, chartReady]);

  useEffect(() => {
    if (!mainSeriesRef.current || !chartReady) return;
    try { const series = mainSeriesRef.current; triggers.filter(t => t.enabled && t.symbol === selectedSymbol).forEach(trigger => { const triggerPrice = trigger.triggerPrice || trigger.condition.threshold; const side = trigger.action.side; const type = trigger.action.type; series.createPriceLine({ price: parseFloat(triggerPrice), color: side === 'buy' ? CHART_COLORS.buy : CHART_COLORS.sell, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: `T: ${type.toUpperCase()}${side ? ` ${side.toUpperCase()}` : ''}` }); }); CurrentOrders.filter(o => o.symbol === selectedSymbol && o.price).forEach(order => { series.createPriceLine({ price: parseFloat(order.price!), color: order.side === 'buy' ? CHART_COLORS.buy : CHART_COLORS.sell, lineWidth: 1, lineStyle: 1, axisLabelVisible: true, title: `${order.side.toUpperCase()} @ ${order.price}` }); }); } catch { }
  }, [triggers, CurrentOrders, selectedSymbol, chartReady]);

  const priceInfo = useMemo(() => { if (klines.length === 0) return null; const lastKline = klines[klines.length - 1]; const firstKline = klines[0]; if (!lastKline || !firstKline) return null; const current = lastKline.close; const first = firstKline.open; const high24h = Math.max(...klines.map(k => k.high)); const low24h = Math.min(...klines.map(k => k.low)); const totalVolume = klines.reduce((sum, k) => sum + k.volume, 0); return { current, high24h, low24h, change: current - first, changePercent: ((current - first) / first) * 100, volume: totalVolume, amplitude: ((high24h - low24h) / low24h) * 100 }; }, [klines]);

  const handleReset = useCallback(() => mainChartApiRef.current?.timeScale().fitContent(), []);
  const toggleFullscreen = useCallback(() => setIsFullscreen(prev => !prev), []);
  const indicators: Indicator[] = ['MA', 'EMA', 'BOLL', 'VOL'];

  return (
    <Container $fullscreen={isFullscreen} className="card">
      <Toolbar>
        <ToolbarScrollArea>
          <IndicatorGroup>{indicators.map(indicator => <IndicatorBtn key={indicator} $active={activeIndicators.has(indicator)} onClick={() => toggleIndicator(indicator)}>{indicator}</IndicatorBtn>)}</IndicatorGroup>
          <ChartTypeGroup>
            <ChartTypeBtn $active={chartType === 'line'} onClick={() => setChartType('line')} title={t.chart?.lineChart || 'Line'}><Icons name="activity" size="sm" /></ChartTypeBtn>
            <ChartTypeBtn $active={chartType === 'candlestick'} onClick={() => setChartType('candlestick')} title={t.chart?.candlestickChart || 'Candle'}><Icons name="bar-chart-2" size="sm" /></ChartTypeBtn>
          </ChartTypeGroup>
          <TimeRangeGroup>{(['1m', '5m', '15m', '1h', '4h', '1d'] as TimeRange[]).map(range => <TimeRangeBtn key={range} $active={timeRange === range} onClick={() => setTimeRange(range)}>{range}</TimeRangeBtn>)}</TimeRangeGroup>
        </ToolbarScrollArea>
        <ToolbarRight>
          <ToolBtn onClick={handleReset} title="Reset"><Icons name="refresh-cw" size="sm" /></ToolBtn>
          <ToolBtn onClick={toggleFullscreen} title="Fullscreen"><Icons name={isFullscreen ? 'minimize-2' : 'maximize-2'} size="sm" /></ToolBtn>
        </ToolbarRight>
      </Toolbar>

      {(!isMobile || crosshairData) && (
        <OhlcBar>
          <SymbolInfo>
            {!isMobile && <SymbolName>{selectedSymbol}</SymbolName>}
            {priceInfo && (<><CurrentPrice>{priceInfo.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</CurrentPrice><PriceChange $up={priceInfo.change >= 0}>{priceInfo.change >= 0 ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%</PriceChange></>)}
          </SymbolInfo>
          <OhlcData>
            {crosshairData ? (<><OhlcItem><label>O</label>{crosshairData.open.toFixed(2)}</OhlcItem><OhlcItem><label>H</label>{crosshairData.high.toFixed(2)}</OhlcItem><OhlcItem><label>L</label>{crosshairData.low.toFixed(2)}</OhlcItem><OhlcItem $trend={crosshairData.change >= 0 ? 'up' : 'down'}><label>C</label>{crosshairData.close.toFixed(2)}</OhlcItem><OhlcItem><label>V</label>{(crosshairData.volume / 1000).toFixed(2)}K</OhlcItem></>) : priceInfo && (<><OhlcItem><label>{isMobile ? 'H' : '24H High'}</label>{priceInfo.high24h.toFixed(2)}</OhlcItem><OhlcItem><label>{isMobile ? 'L' : '24H Low'}</label>{priceInfo.low24h.toFixed(2)}</OhlcItem>{!isMobile && (<><OhlcItem><label>24H Vol</label>{(priceInfo.volume / 1000000).toFixed(2)}M</OhlcItem><OhlcItem><label>Amp</label>{priceInfo.amplitude.toFixed(2)}%</OhlcItem></>)}</>)}
          </OhlcData>
        </OhlcBar>
      )}

      {(activeIndicators.has('MA') || activeIndicators.has('EMA') || activeIndicators.has('BOLL')) && (
        <Legend>
          {activeIndicators.has('MA') && (<><span style={{ color: CHART_COLORS.ma7 }}>●MA(7)</span><span style={{ color: CHART_COLORS.ma25 }}>●MA(25)</span><span style={{ color: CHART_COLORS.ma99 }}>●MA(99)</span></>)}
          {activeIndicators.has('EMA') && (<><span style={{ color: CHART_COLORS.ema12 }}>●EMA(12)</span><span style={{ color: CHART_COLORS.ema26 }}>●EMA(26)</span></>)}
          {activeIndicators.has('BOLL') && <span style={{ color: CHART_COLORS.bollMiddle }}>●BOLL(20,2)</span>}
        </Legend>
      )}

      <MainChart ref={mainChartRef} $fullscreen={isFullscreen}>
        {loading && <LoadingOverlay><Spinner /><span>Loading...</span></LoadingOverlay>}
        {error && !loading && <ErrorOverlay><Icons name="alert-circle" size="lg" /><span>{error}</span><RetryBtn onClick={() => fetchKlines(selectedSymbol, INTERVAL_MAP[timeRange])}>Retry</RetryBtn></ErrorOverlay>}
      </MainChart>
    </Container>
  );
}

export { Chart };
