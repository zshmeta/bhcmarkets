import { useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore, selectBalances, selectAccount } from '@repo/sdk';
import { useTradingStore } from '@repo/sdk';
import { useWatchlistStore } from '@repo/sdk';
import { useAutomationStore } from '@repo/sdk';
import { useI18n } from '@repo/bhcm-ui/i18n';
import { Icons } from '@repo/bhcm-ui/core';
import type { IconsName } from '@repo/bhcm-ui/core';
import { LineChart } from '@repo/bhcm-ui/market';
import Decimal from 'decimal.js';
import {
  Container,
  HeroSection,
  HeroMain,
  PortfolioHeader,
  PortfolioLabel,
  AccountBadge,
  SimulatedTag,
  PortfolioValue,
  Currency,
  Amount,
  PortfolioMeta,
  ChangeIndicator,
  ChangeLabel,
  PnLIndicator,
  PnLValue,
  PnLLabel,
  RoiIndicator,
  RoiValue,
  RoiLabel,
  MetricsGrid,
  MetricItem,
  MetricIcons,
  MetricContent,
  MetricValue,
  MetricLabel,
  HeroChart,
  ChartHeader,
  ChartTitle,
  TimeRangeSelector,
  TimeRangeBtn,
  ChartContainer,
  ChartStats,
  ChartStatItem,
  ChartStatLabel,
  ChartStatValue,
  HeroActions,
  PrimaryAction,
  SecondaryAction,
  TertiaryAction,
  MarketSection,
  SectionHeader,
  SectionTitle,
  ViewAllBtn,
  MarketCards,
  MarketCard,
  MarketCardHeader,
  MarketCardIcons,
  MarketCardInfo,
  MarketCardSymbol,
  MarketCardName,
  MarketCardBody,
  MarketCardPrice,
  MarketCardChange,
  MarketCardChart,
  StatsSection,
  StatsGrid,
  StatCard,
  StatCardIcons,
  StatCardContent,
  StatCardValue,
  StatCardLabel,
  StatCardSub,
  MainGrid,
  AssetsSection,
  TableControls,
  SearchBox,
  TableWrapper,
  AssetTable,
  SortableHeader,
  AssetCell,
  AssetIconsCircle,
  AssetInfo,
  AssetSymbolText,
  AssetAlloc,
  NumericCell,
  BalanceValue,
  ValueAmount,
  PriceValueText,
  PnLCell,
  PnLPercent,
  LineChartCell,
  TradeBtn,
  SidePanel,
  AllocationCard,
  CardTitle,
  AllocationList,
  AllocItem,
  AllocHeader,
  AllocBullet,
  AllocSymbol,
  AllocPercent,
  AllocBar,
  AllocBarFill,
  ActivityCard,
  ActivityHeader,
  ActivityList,
  ActivityItem,
  ActivityItemIcons,
  ActivityContent,
  ActivityItemHeader,
  ActivityItemTitle,
  ActivityTime,
  ActivityDesc,
  ActivityValue,
  EmptyActivity,
  PerformerCard,
  PerformerContent,
  PerformerIcons,
  PerformerInfo,
  PerformerSymbol,
  PerformerPnL,
  PerformerTradeBtn,
  PortfolioChart as PortfolioChartContainer,
  ChartSvg,
  ChartTooltip,
  TooltipValue,
  TooltipIndex,
} from './AssetDetailPage.styles';

type TimeRange = '1D' | '7D' | '30D' | 'ALL';
type SortField = 'value' | 'balance' | 'pnl' | 'pnlPercent';
type SortOrder = 'asc' | 'desc';

// Format utilities
function formatNumber(value: number, decimals = 2): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${value.toFixed(decimals)}`;
}

function formatPercent(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

// Portfolio Chart Component
function PortfolioChartComponent({
  data,
  color,
  height = 100,
  timeRange
}: {
  data: number[];
  color: string;
  height?: number;
  timeRange: TimeRange;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = { top: 8, right: 60, bottom: 24, left: 8 };
  const chartWidth = 560;
  const chartHeight = height;
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const points = data.map((v, i) => {
    const x = padding.left + (i / (data.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((v - min) / range) * graphHeight;
    return { x, y, value: v };
  });

  const pathPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${padding.left},${padding.top + graphHeight} ${pathPoints} ${padding.left + graphWidth},${padding.top + graphHeight}`;

  const yTicks = [min, (min + max) / 2, max];

  const getTimeLabels = () => {
    const now = new Date();
    switch (timeRange) {
      case '1D': return ['00:00', '06:00', '12:00', '18:00', 'Now'];
      case '7D': return Array.from({ length: 5 }, (_, i) => {
        const d = new Date(now.getTime() - (4 - i) * 24 * 60 * 60 * 1000 * 1.75);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
      });
      case '30D': return Array.from({ length: 5 }, (_, i) => {
        const d = new Date(now.getTime() - (4 - i) * 24 * 60 * 60 * 1000 * 7.5);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      case 'ALL': return ['Start', '', '', '', 'Now'];
      default: return [];
    }
  };

  const timeLabels = getTimeLabels();
  const startValue = data.length > 0 ? (data[0] || 0) : 0;
  const endValue = data.length > 0 ? (data[data.length - 1] || 0) : 0;
  const changeValue = endValue - startValue;
  const changePercent = startValue !== 0 ? ((changeValue / startValue) * 100).toFixed(2) : '0.00';

  const formatValue = (v: number) => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  };

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <PortfolioChartContainer>
      <ChartSvg
        ref={svgRef}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="portfolio-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="50%" stopColor={color} stopOpacity="0.1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + graphHeight * ratio}
            x2={padding.left + graphWidth}
            y2={padding.top + graphHeight * ratio}
            stroke="var(--border-light)"
            strokeWidth="1"
            strokeDasharray={i === 2 ? "none" : "3,3"}
            opacity={i === 2 ? 0.5 : 0.3}
          />
        ))}

        {/* Area */}
        <polygon points={areaPoints} fill="url(#portfolio-gradient)" />

        {/* Line */}
        <polyline
          points={pathPoints}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Y Axis */}
        {yTicks.map((tick, i) => {
          const y = padding.top + graphHeight - ((tick - min) / range) * graphHeight;
          return (
            <text
              key={i}
              x={chartWidth - 4}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fill="var(--text-tertiary)"
              fontSize="10"
            >
              {formatValue(tick)}
            </text>
          );
        })}

        {/* X Axis */}
        {timeLabels.map((label, i) => {
          const x = padding.left + (i / (timeLabels.length - 1)) * graphWidth;
          return (
            <text key={i} x={x} y={chartHeight - 4} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
              {label}
            </text>
          );
        })}

        {/* Interaction */}
        {points.map((point, i) => (
          <rect
            key={i}
            x={point.x - graphWidth / (data.length * 2)}
            y={padding.top}
            width={graphWidth / data.length}
            height={graphHeight}
            fill="transparent"
            onMouseEnter={() => setHoveredIndex(i)}
          />
        ))}

        {/* Hover indicator */}
        {hoveredPoint && (
          <g>
            <line
              x1={hoveredPoint.x}
              y1={padding.top}
              x2={hoveredPoint.x}
              y2={padding.top + graphHeight}
              stroke={color}
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.6"
            />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill={color} stroke="var(--bg-secondary)" strokeWidth="2" />
          </g>
        )}

        {/* End points */}
        {points.length > 0 && points[0] && points[points.length - 1] && (
          <>
            <circle cx={points[0].x} cy={points[0].y} r="3" fill="var(--text-tertiary)" />
            <circle cx={points[points.length - 1]!.x} cy={points[points.length - 1]!.y} r="4" fill={color} stroke="var(--bg-secondary)" strokeWidth="2" />
          </>
        )}
      </ChartSvg>

      {hoveredPoint && hoveredIndex !== null && (
        <ChartTooltip style={{ left: `${(hoveredPoint.x / chartWidth) * 100}%`, top: `${((hoveredPoint.y - 30) / chartHeight) * 100}%` }}>
          <TooltipValue>{formatValue(hoveredPoint.value)}</TooltipValue>
          <TooltipIndex>
            {timeRange === '1D' ? `${Math.floor((hoveredIndex / data.length) * 24)}:00` :
              timeRange === '7D' ? `Day ${Math.floor((hoveredIndex / data.length) * 7) + 1}` :
                `${Math.floor((hoveredIndex / data.length) * 30) + 1}d`}
          </TooltipIndex>
        </ChartTooltip>
      )}

      <ChartStats>
        <ChartStatItem>
          <ChartStatLabel>Start</ChartStatLabel>
          <ChartStatValue>{formatValue(startValue)}</ChartStatValue>
        </ChartStatItem>
        <ChartStatItem>
          <ChartStatLabel>Change</ChartStatLabel>
          <ChartStatValue $positive={changeValue >= 0} $negative={changeValue < 0}>
            {changeValue >= 0 ? '+' : ''}{formatValue(changeValue)} ({changeValue >= 0 ? '+' : ''}{changePercent}%)
          </ChartStatValue>
        </ChartStatItem>
        <ChartStatItem>
          <ChartStatLabel>Current</ChartStatLabel>
          <ChartStatValue>{formatValue(endValue)}</ChartStatValue>
        </ChartStatItem>
      </ChartStats>
    </PortfolioChartContainer>
  );
}

export const AssetDetailPage = () => {
  const { t: _t } = useI18n();
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const balances = useWalletStore(selectBalances);
  const account = useWalletStore(selectAccount);
  const performanceMetricsStore = useWalletStore((state) => state.performanceMetrics);
  const performanceMetrics = performanceMetricsStore ?? {
    winRate: 0,
    profitFactor: 0,
    maxDrawdown: 0,
    totalRealizedPnl: '0',
  };

  const ledger = useWalletStore((state) => state.ledger) ?? [];
  const positions = useTradingStore((state) => state.positions);
  const orders = useTradingStore((state) => state.orders) ?? [];
  const triggers = useAutomationStore((state) => state.triggers) ?? [];
  const executionLogs = useAutomationStore((state) => state.executionLogs) ?? [];
  const symbols = useWatchlistStore((state) => state.symbols) ?? [];
  const setSelectedSymbol = useWatchlistStore((state) => state.setSelectedSymbol);

  const getPosition = useCallback((symbol: string) => {
    if (!positions) return undefined;
    if (positions instanceof Map) return positions.get(symbol);
    if (typeof positions === 'object') return (positions as any)[symbol];
    return undefined;
  }, [positions]);

  const assetList = useMemo(() => {
    if (!balances) return [];
    return balances.filter(b => new Decimal(b.total || 0).gt(0) || b.asset === 'USDT').map(balance => {
      const symbol = `${balance.asset}USDT`;
      const position = getPosition(symbol);
      const marketInfo = symbols?.find(s => s.symbol === symbol);

      const currentPrice = marketInfo?.price || '0';
      const avgPrice = position?.avgEntryPrice || '0';
      const priceChange24h = marketInfo?.change24h || 0;

      let unrealizedPnl = new Decimal(0);
      let unrealizedPnlPercent = new Decimal(0);

      if (new Decimal(avgPrice).gt(0) && new Decimal(currentPrice).gt(0)) {
        const qty = new Decimal(balance.total || 0);
        unrealizedPnl = qty.times(new Decimal(currentPrice).minus(avgPrice));
        unrealizedPnlPercent = new Decimal(currentPrice).minus(avgPrice).div(avgPrice).times(100);
      }

      const value = new Decimal(balance.total || 0).times(balance.asset === 'USDT' ? 1 : currentPrice);

      const LineChartData = Array.from({ length: 24 }, (_, i) => {
        const base = parseFloat(currentPrice) || 100;
        const trend = parseFloat(String(priceChange24h)) > 0 ? 1 : -1;
        return base * (1 - (trend * 0.02 * (24 - i) / 24) + (Math.random() - 0.5) * 0.01);
      });

      return {
        ...balance,
        symbol,
        currentPrice,
        avgPrice,
        priceChange24h,
        unrealizedPnl: unrealizedPnl.toNumber(),
        unrealizedPnlPercent: unrealizedPnlPercent.toNumber(),
        value: value.toNumber(),
        LineChartData,
      };
    });
  }, [balances, getPosition, symbols]);

  const filteredAssets = useMemo(() => {
    let filtered = assetList.filter(a => a.asset.toLowerCase().includes(searchQuery.toLowerCase()));
    return filtered.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortField) {
        case 'value': aVal = a.value; bVal = b.value; break;
        case 'balance': aVal = parseFloat(a.total); bVal = parseFloat(b.total); break;
        case 'pnl': aVal = a.unrealizedPnl; bVal = b.unrealizedPnl; break;
        case 'pnlPercent': aVal = a.unrealizedPnlPercent; bVal = b.unrealizedPnlPercent; break;
        default: aVal = a.value; bVal = b.value;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [assetList, searchQuery, sortField, sortOrder]);

  const totals = useMemo(() => {
    const totalValue = assetList.reduce((acc, asset) => acc + asset.value, 0);
    const totalUnrealizedPnl = assetList.reduce((acc, asset) => acc + asset.unrealizedPnl, 0);

    let totalRealizedPnl = 0;
    if (positions instanceof Map) {
      positions.forEach((pos) => { if (pos?.realizedPnl) totalRealizedPnl += parseFloat(pos.realizedPnl); });
    } else if (typeof positions === 'object' && positions !== null) {
      Object.values(positions).forEach((pos: any) => { if (pos?.realizedPnl) totalRealizedPnl += parseFloat(pos.realizedPnl); });
    }

    const totalPnl = totalRealizedPnl + totalUnrealizedPnl;
    const usdtBalance = balances?.find(b => b.asset === 'USDT');
    const availableBalance = parseFloat(usdtBalance?.available || '0');
    const usdtValue = parseFloat(usdtBalance?.total || '0');
    const positionValue = totalValue - usdtValue;

    const initialCapital = ledger.filter(entry => entry.type === 'DEPOSIT' && entry.asset === 'USDT').reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
    const baseCapital = initialCapital > 0 ? initialCapital : 400000;
    const roi = baseCapital > 0 ? ((totalValue - baseCapital) / baseCapital) * 100 : 0;
    const pnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;
    const totalChange24h = assetList.reduce((acc, asset) => acc + (parseFloat(String(asset.priceChange24h)) * (asset.value / (totalValue || 1))), 0);

    return { totalValue, totalUnrealizedPnl, totalRealizedPnl, totalPnl, pnlPercent, totalChange24h, availableBalance, positionValue, roi };
  }, [assetList, positions, balances, ledger]);

  const portfolioHistoryData = useMemo(() => {
    const base = totals.totalValue;
    const points = timeRange === '1D' ? 24 : timeRange === '7D' ? 168 : timeRange === '30D' ? 30 : 90;
    const history: number[] = [];
    let current = base * 0.85;
    for (let i = 0; i < points; i++) {
      current += (Math.random() - 0.45) * (base * 0.02);
      history.push(current);
    }
    history[points - 1] = base;
    return history;
  }, [totals.totalValue, timeRange]);

  const tradingStats = useMemo(() => {
    const filledOrders = orders.filter(o => o.status === 'filled');
    const CurrentOrders = orders.filter(o => ['pending', 'open', 'partial'].includes(o.status));
    const activeTriggers = triggers.filter(t => t.enabled && t.status === 'armed');

    let positionCount = 0;
    if (positions instanceof Map) {
      positions.forEach((pos) => { if (pos && parseFloat(pos.quantity) > 0) positionCount++; });
    }

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const RecentPositions = orders.filter(o => o.fills.length > 0).flatMap(o => o.fills).filter(f => f.time > oneDayAgo);
    const volume24h = RecentPositions.reduce((sum, f) => sum + parseFloat(f.price) * parseFloat(f.quantity), 0);

    const bestAsset = assetList.filter(a => a.unrealizedPnlPercent !== 0).sort((a, b) => b.unrealizedPnlPercent - a.unrealizedPnlPercent)[0];

    return {
      positionCount,
      openOrderCount: CurrentOrders.length,
      activeTriggerCount: activeTriggers.length,
      totalTrades: filledOrders.length,
      volume24h,
      winRate: 50,
      bestAsset,
    };
  }, [orders, triggers, positions, assetList]);

  const recentActivity = useMemo(() => {
    const activities: Array<{ type: 'trade' | 'order' | 'trigger'; title: string; description: string; time: number; value?: string; isPositive?: boolean; }> = [];
    orders.filter(o => o.status === 'filled').slice(0, 5).forEach(o => {
      const value = o.fills.reduce((sum, f) => sum + parseFloat(f.price) * parseFloat(f.quantity), 0);
      activities.push({
        type: 'trade',
        title: `${o.side.toUpperCase()} ${o.symbol.replace('USDT', '')}`,
        description: `${parseFloat(o.filledQty).toFixed(6)} @ ${formatNumber(parseFloat(o.avgPrice || '0'))}`,
        time: o.updatedAt,
        value: formatNumber(value),
        isPositive: o.side === 'sell',
      });
    });
    executionLogs.slice(0, 3).forEach(log => {
      activities.push({ type: 'trigger', title: `Trigger ${log.result === 'success' ? 'Executed' : 'Failed'}`, description: log.reason || 'Automation completed', time: log.timestamp || Date.now() });
    });
    return activities.sort((a, b) => b.time - a.time).slice(0, 6);
  }, [orders, executionLogs]);

  const marketData = useMemo(() => {
    const btc = symbols?.find(s => s.symbol === 'BTCUSDT');
    const eth = symbols?.find(s => s.symbol === 'ETHUSDT');
    return {
      btc: { price: btc?.price || '0', change: btc?.change24h || 0, LineChart: Array.from({ length: 24 }, () => parseFloat(btc?.price || '95000') * (1 + (Math.random() - 0.5) * 0.02)) },
      eth: { price: eth?.price || '0', change: eth?.change24h || 0, LineChart: Array.from({ length: 24 }, () => parseFloat(eth?.price || '3400') * (1 + (Math.random() - 0.5) * 0.02)) },
    };
  }, [symbols]);

  const handleTrade = (asset: string) => { setSelectedSymbol(`${asset}USDT`); navigate('/trade'); };
  const handleSort = (field: SortField) => { if (sortField === field) setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); else { setSortField(field); setSortOrder('desc'); } };
  const formatTimeAgo = (timestamp: number) => { const diff = Date.now() - timestamp; const m = Math.floor(diff / 60000); const h = Math.floor(diff / 3600000); const d = Math.floor(diff / 86400000); if (d > 0) return `${d}d ago`; if (h > 0) return `${h}h ago`; if (m > 0) return `${m}m ago`; return 'Just now'; };

  const activityColors: Record<string, string> = { trade: 'var(--color-info)', order: 'var(--color-success)', trigger: '#8b5cf6', deposit: 'var(--color-warning)' };

  return (
    <Container>
      {/* Hero Section */}
      <HeroSection>
        <HeroMain>
          <PortfolioHeader>
            <PortfolioLabel><Icons name="briefcase" size="sm" /><span>Portfolio Value</span></PortfolioLabel>
            <AccountBadge><span>ID: {account?.accountId || 'PTT-DEMO'}</span><SimulatedTag>Paper Trading</SimulatedTag></AccountBadge>
          </PortfolioHeader>

          <PortfolioValue>
            <Currency>$</Currency>
            <Amount>{totals.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Amount>
          </PortfolioValue>

          <PortfolioMeta>
            <ChangeIndicator $positive={totals.totalChange24h >= 0} $negative={totals.totalChange24h < 0}>
              <Icons name={totals.totalChange24h >= 0 ? 'trending-up' : 'trending-down'} size="xs" />
              <span>{formatPercent(totals.totalChange24h)}</span>
              <ChangeLabel>24h</ChangeLabel>
            </ChangeIndicator>
            <PnLIndicator>
              <PnLValue $positive={totals.totalPnl >= 0} $negative={totals.totalPnl < 0}>{totals.totalPnl >= 0 ? '+' : ''}${totals.totalPnl.toFixed(2)}</PnLValue>
              <PnLLabel>Total P&L</PnLLabel>
            </PnLIndicator>
            <RoiIndicator><RoiValue $positive={totals.roi >= 0} $negative={totals.roi < 0}>{totals.roi >= 0 ? '+' : ''}{totals.roi.toFixed(2)}%</RoiValue><RoiLabel>ROI</RoiLabel></RoiIndicator>
          </PortfolioMeta>

          <MetricsGrid>
            <MetricItem><MetricIcons><Icons name="wallet" size="xs" /></MetricIcons><MetricContent><MetricValue>${totals.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</MetricValue><MetricLabel>Available Balance</MetricLabel></MetricContent></MetricItem>
            <MetricItem><MetricIcons><Icons name="layers" size="xs" /></MetricIcons><MetricContent><MetricValue>${totals.positionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</MetricValue><MetricLabel>Position Value</MetricLabel></MetricContent></MetricItem>
            <MetricItem><MetricIcons><Icons name="check-circle" size="xs" /></MetricIcons><MetricContent><MetricValue $positive={totals.totalRealizedPnl >= 0} $negative={totals.totalRealizedPnl < 0}>{totals.totalRealizedPnl >= 0 ? '+' : ''}${totals.totalRealizedPnl.toFixed(2)}</MetricValue><MetricLabel>Realized P&L</MetricLabel></MetricContent></MetricItem>
            <MetricItem><MetricIcons><Icons name="activity" size="xs" /></MetricIcons><MetricContent><MetricValue $positive={totals.totalUnrealizedPnl >= 0} $negative={totals.totalUnrealizedPnl < 0}>{totals.totalUnrealizedPnl >= 0 ? '+' : ''}${totals.totalUnrealizedPnl.toFixed(2)}</MetricValue><MetricLabel>Unrealized P&L</MetricLabel></MetricContent></MetricItem>
            <MetricItem><MetricIcons><Icons name="target" size="xs" /></MetricIcons><MetricContent><MetricValue>{tradingStats.winRate.toFixed(1)}%</MetricValue><MetricLabel>Win Rate</MetricLabel></MetricContent></MetricItem>
            <MetricItem><MetricIcons><Icons name="bar-chart-2" size="xs" /></MetricIcons><MetricContent><MetricValue>{(performanceMetrics?.profitFactor ?? 0).toFixed(2)}</MetricValue><MetricLabel>Profit Factor</MetricLabel></MetricContent></MetricItem>
            <MetricItem><MetricIcons><Icons name="trending-down" size="xs" /></MetricIcons><MetricContent><MetricValue $negative={(performanceMetrics?.maxDrawdown ?? 0) > 0}>{(performanceMetrics?.maxDrawdown ?? 0).toFixed(2)}%</MetricValue><MetricLabel>Max Drawdown</MetricLabel></MetricContent></MetricItem>
            <MetricItem><MetricIcons><Icons name="repeat" size="xs" /></MetricIcons><MetricContent><MetricValue>{tradingStats.totalTrades}</MetricValue><MetricLabel>Total Trades</MetricLabel></MetricContent></MetricItem>
          </MetricsGrid>
        </HeroMain>

        <HeroChart>
          <ChartHeader>
            <ChartTitle>Portfolio Growth</ChartTitle>
            <TimeRangeSelector>
              {(['1D', '7D', '30D', 'ALL'] as TimeRange[]).map(range => (
                <TimeRangeBtn key={range} $active={timeRange === range} onClick={() => setTimeRange(range)}>{range}</TimeRangeBtn>
              ))}
            </TimeRangeSelector>
          </ChartHeader>
          <ChartContainer>
            <PortfolioChartComponent data={portfolioHistoryData} color={totals.totalPnl >= 0 ? 'var(--color-success)' : 'var(--color-error)'} height={120} timeRange={timeRange} />
          </ChartContainer>
        </HeroChart>

        <HeroActions>
          <PrimaryAction onClick={() => navigate('/wallet')}><Icons name="download" size="sm" /><span>Deposit</span></PrimaryAction>
          <SecondaryAction onClick={() => navigate('/trade')}><Icons name="activity" size="sm" /><span>Trade</span></SecondaryAction>
          <TertiaryAction onClick={() => navigate('/orders')}><Icons name="layers" size="sm" /><span>Orders</span></TertiaryAction>
        </HeroActions>
      </HeroSection>

      {/* Market Section */}
      <MarketSection>
        <SectionHeader>
          <SectionTitle>Market Overview</SectionTitle>
          <ViewAllBtn onClick={() => navigate('/markets')}>View All Markets<Icons name="chevron-right" size="xs" /></ViewAllBtn>
        </SectionHeader>
        <MarketCards>
          <MarketCard onClick={() => handleTrade('BTC')}>
            <MarketCardHeader><MarketCardIcons>B</MarketCardIcons><MarketCardInfo><MarketCardSymbol>BTC</MarketCardSymbol><MarketCardName>Bitcoin</MarketCardName></MarketCardInfo></MarketCardHeader>
            <MarketCardBody><MarketCardPrice>${parseFloat(marketData.btc.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</MarketCardPrice><MarketCardChange $positive={parseFloat(String(marketData.btc.change)) >= 0} $negative={parseFloat(String(marketData.btc.change)) < 0}><Icons name={parseFloat(String(marketData.btc.change)) >= 0 ? 'trending-up' : 'trending-down'} size="xs" />{formatPercent(parseFloat(String(marketData.btc.change)))}</MarketCardChange></MarketCardBody>
            <MarketCardChart><LineChart data={marketData.btc.LineChart} width={100} height={32} lineWidth={1.5} /></MarketCardChart>
          </MarketCard>
          <MarketCard onClick={() => handleTrade('ETH')}>
            <MarketCardHeader><MarketCardIcons>E</MarketCardIcons><MarketCardInfo><MarketCardSymbol>ETH</MarketCardSymbol><MarketCardName>Ethereum</MarketCardName></MarketCardInfo></MarketCardHeader>
            <MarketCardBody><MarketCardPrice>${parseFloat(marketData.eth.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</MarketCardPrice><MarketCardChange $positive={parseFloat(String(marketData.eth.change)) >= 0} $negative={parseFloat(String(marketData.eth.change)) < 0}><Icons name={parseFloat(String(marketData.eth.change)) >= 0 ? 'trending-up' : 'trending-down'} size="xs" />{formatPercent(parseFloat(String(marketData.eth.change)))}</MarketCardChange></MarketCardBody>
            <MarketCardChart><LineChart data={marketData.eth.LineChart} width={100} height={32} lineWidth={1.5} /></MarketCardChart>
          </MarketCard>
        </MarketCards>
      </MarketSection>

      {/* Stats Section */}
      <StatsSection>
        <StatsGrid>
          <StatCard onClick={() => navigate('/trade')}><StatCardIcons style={{ background: 'rgba(59, 130, 246, 0.15)' }}><Icons name="briefcase" size="sm" /></StatCardIcons><StatCardContent><StatCardValue>{tradingStats.positionCount}</StatCardValue><StatCardLabel>Open Positions</StatCardLabel></StatCardContent></StatCard>
          <StatCard onClick={() => navigate('/orders')}><StatCardIcons style={{ background: 'rgba(245, 158, 11, 0.15)' }}><Icons name="list" size="sm" /></StatCardIcons><StatCardContent><StatCardValue>{tradingStats.openOrderCount}</StatCardValue><StatCardLabel>Open Orders</StatCardLabel></StatCardContent></StatCard>
          <StatCard onClick={() => navigate('/orders')}><StatCardIcons style={{ background: 'rgba(139, 92, 246, 0.15)' }}><Icons name="zap" size="sm" /></StatCardIcons><StatCardContent><StatCardValue>{tradingStats.activeTriggerCount}</StatCardValue><StatCardLabel>Active Triggers</StatCardLabel></StatCardContent></StatCard>
          <StatCard><StatCardIcons style={{ background: 'rgba(34, 197, 94, 0.15)' }}><Icons name="bar-chart-2" size="sm" /></StatCardIcons><StatCardContent><StatCardValue>{formatNumber(tradingStats.volume24h)}</StatCardValue><StatCardLabel>24h Volume</StatCardLabel></StatCardContent></StatCard>
          <StatCard><StatCardIcons style={{ background: 'rgba(59, 130, 246, 0.15)' }}><Icons name="repeat" size="sm" /></StatCardIcons><StatCardContent><StatCardValue>{tradingStats.totalTrades}</StatCardValue><StatCardLabel>Total Trades</StatCardLabel></StatCardContent></StatCard>
          <StatCard><StatCardIcons style={{ background: tradingStats.winRate >= 50 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}><Icons name="target" size="sm" /></StatCardIcons><StatCardContent><StatCardValue>{tradingStats.winRate.toFixed(0)}%</StatCardValue><StatCardLabel>Win Rate</StatCardLabel><StatCardSub>{tradingStats.winRate >= 50 ? 'Above average' : 'Below average'}</StatCardSub></StatCardContent></StatCard>
        </StatsGrid>
      </StatsSection>

      {/* Main Grid */}
      <MainGrid>
        <AssetsSection>
          <SectionHeader>
            <SectionTitle><Icons name="wallet" size="sm" />Asset Holdings</SectionTitle>
            <TableControls>
              <SearchBox><Icons name="search" size="xs" /><input type="text" placeholder="Search assets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></SearchBox>
            </TableControls>
          </SectionHeader>

          <TableWrapper>
            <AssetTable>
              <thead>
                <tr>
                  <th>Asset</th>
                  <SortableHeader onClick={() => handleSort('balance')}>Balance{sortField === 'balance' && <Icons name={sortOrder === 'desc' ? 'chevron-down' : 'chevron-up'} size="xs" />}</SortableHeader>
                  <SortableHeader onClick={() => handleSort('value')}>Value{sortField === 'value' && <Icons name={sortOrder === 'desc' ? 'chevron-down' : 'chevron-up'} size="xs" />}</SortableHeader>
                  <th>Price</th>
                  <SortableHeader onClick={() => handleSort('pnl')}>P&L{sortField === 'pnl' && <Icons name={sortOrder === 'desc' ? 'chevron-down' : 'chevron-up'} size="xs" />}</SortableHeader>
                  <th>24h</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => {
                  const allocation = totals.totalValue > 0 ? (asset.value / totals.totalValue) * 100 : 0;
                  return (
                    <tr key={asset.asset}>
                      <td><AssetCell><AssetIconsCircle>{asset.asset[0]}</AssetIconsCircle><AssetInfo><AssetSymbolText>{asset.asset}</AssetSymbolText><AssetAlloc>{allocation.toFixed(1)}% of portfolio</AssetAlloc></AssetInfo></AssetCell></td>
                      <NumericCell><BalanceValue>{parseFloat(asset.total).toFixed(asset.asset === 'USDT' ? 2 : 6)}</BalanceValue></NumericCell>
                      <NumericCell><ValueAmount>${asset.value.toFixed(2)}</ValueAmount></NumericCell>
                      <NumericCell>{asset.asset !== 'USDT' ? <PriceValueText>${parseFloat(asset.currentPrice).toFixed(2)}</PriceValueText> : '—'}</NumericCell>
                      <NumericCell>{asset.unrealizedPnl !== 0 ? <PnLCell $positive={asset.unrealizedPnl >= 0} $negative={asset.unrealizedPnl < 0}><span>{asset.unrealizedPnl >= 0 ? '+' : ''}${asset.unrealizedPnl.toFixed(2)}</span><PnLPercent>{formatPercent(asset.unrealizedPnlPercent)}</PnLPercent></PnLCell> : '—'}</NumericCell>
                      <td>{asset.asset !== 'USDT' && <LineChartCell><LineChart data={asset.LineChartData} width={60} height={24} lineWidth={1} /></LineChartCell>}</td>
                      <td>{asset.asset !== 'USDT' && <TradeBtn onClick={() => handleTrade(asset.asset)}>Trade</TradeBtn>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </AssetTable>
          </TableWrapper>
        </AssetsSection>

        <SidePanel>
          <AllocationCard>
            <CardTitle>Portfolio Allocation</CardTitle>
            <AllocationList>
              {filteredAssets.slice(0, 5).map((asset, i) => {
                const ratio = totals.totalValue > 0 ? (asset.value / totals.totalValue) * 100 : 0;
                const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'];
                return (
                  <AllocItem key={asset.asset}>
                    <AllocHeader><AllocBullet style={{ backgroundColor: colors[i % colors.length] }} /><AllocSymbol>{asset.asset}</AllocSymbol><AllocPercent>{ratio.toFixed(1)}%</AllocPercent></AllocHeader>
                    <AllocBar><AllocBarFill style={{ width: `${ratio}%`, backgroundColor: colors[i % colors.length] }} /></AllocBar>
                  </AllocItem>
                );
              })}
            </AllocationList>
          </AllocationCard>

          <ActivityCard>
            <ActivityHeader><CardTitle>Recent Activity</CardTitle><ViewAllBtn onClick={() => navigate('/orders')}>View All<Icons name="chevron-right" size="xs" /></ViewAllBtn></ActivityHeader>
            <ActivityList>
              {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
                <ActivityItem key={i}>
                  <ActivityItemIcons style={{ background: activityColors[activity.type] }}><Icons name={activity.type === 'trade' ? 'repeat' : activity.type === 'trigger' ? 'zap' : 'check-circle'} size="xs" /></ActivityItemIcons>
                  <ActivityContent>
                    <ActivityItemHeader><ActivityItemTitle>{activity.title}</ActivityItemTitle><ActivityTime>{formatTimeAgo(activity.time)}</ActivityTime></ActivityItemHeader>
                    <ActivityDesc>{activity.description}</ActivityDesc>
                  </ActivityContent>
                  {activity.value && <ActivityValue $positive={activity.isPositive === true} $negative={activity.isPositive === false}>{activity.value}</ActivityValue>}
                </ActivityItem>
              )) : (
                <EmptyActivity><Icons name="clock" size="lg" /><p>No recent activity</p><button onClick={() => navigate('/trade')}>Start Trading</button></EmptyActivity>
              )}
            </ActivityList>
          </ActivityCard>

          {tradingStats.bestAsset && (
            <PerformerCard>
              <CardTitle>Top Performer</CardTitle>
              <PerformerContent>
                <PerformerIcons>{tradingStats.bestAsset.asset[0]}</PerformerIcons>
                <PerformerInfo><PerformerSymbol>{tradingStats.bestAsset.asset}</PerformerSymbol><PerformerPnL $positive={tradingStats.bestAsset.unrealizedPnlPercent >= 0} $negative={tradingStats.bestAsset.unrealizedPnlPercent < 0}>{formatPercent(tradingStats.bestAsset.unrealizedPnlPercent)}</PerformerPnL></PerformerInfo>
                <PerformerTradeBtn onClick={() => handleTrade(tradingStats.bestAsset!.asset)}>Trade</PerformerTradeBtn>
              </PerformerContent>
            </PerformerCard>
          )}
        </SidePanel>
      </MainGrid>
    </Container>
  );
}
