import { useState, useMemo, useCallback } from 'react';
import { useTradingStore } from '@repo/bhcm-ui/store';
import { useAutomationStore } from '@repo/bhcm-ui/store';
import { useI18n } from '@repo/bhcm-ui/i18n';
import { Icons, IconsName } from '@repo/bhcm-ui/core';
import { useIsMobile } from '../hooks/useMediaQuery';
import { MobileOrdersPage } from './mobile';
import { TriggerList, ExecutionLogList } from '@repo/bhcm-ui/automation';
import type { PaperOrder, OrderStatus } from '../types/trading';
import {
  Container,
  Header,
  HeaderTop,
  TitleSection,
  PageTitle,
  SimulatedBadge,
  HeaderActions,
  ExportBtn,
  StatsGrid,
  StatCard,
  StatHeader,
  StatIcons,
  StatLabel,
  StatBody,
  StatValue,
  StatSubValue,
  Toolbar,
  Tabs,
  Tab,
  TabBadge,
  Filters,
  SearchWrapper,
  SearchIcons,
  SearchInput,
  FilterSelect,
  TimeFilters,
  TimeFilter,
  Content,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TimeCell,
  SymbolCell,
  SymbolWrapper,
  SymbolName,
  SymbolQuote,
  SideBadge,
  TypeBadge,
  AmountWrapper,
  AmountDivider,
  AmountTotal,
  FillProgress,
  FillProgressBar,
  StatusBadge,
  ActionsCell,
  CancelBtn,
  DetailsBtn,
  DrawerOverlay,
  Drawer,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerBody,
  DetailSection,
  DetailRow,
  DetailLabel,
  DetailValue,
  SectionTitleText,
  FillsList,
  FillItem,
  FillMain,
  FillAt,
  FillMeta,
  FillTime,
  FillFee,
  OrderIdText,
  Empty,
  AutomationLayout,
  AutomationMain,
  AutomationSidebar,
  AutomationSection,
  AutomationSectionHeader,
  AutomationSectionTitle,
  SectionCount,
  AnalyticsPanel,
  AnalyticsRow,
  AnalyticsStat,
  AnalyticsLabel,
  AnalyticsValue,
  AnalyticsGrid,
  AnalyticsCard,
  AnalyticsCardTitle,
  RatioBar,
  RatioBarBuy,
  RatioBarSell,
  RatioLabels,
  RatioLabelBuy,
  RatioLabelSell,
  RatioValues,
  SymbolList,
  SymbolItem,
  SymbolInfo,
  SymbolTrades,
  SymbolVolume,
  BarChart,
  BarWrapper,
  Bar,
  BarLabel,
  EmptyState,
  CompletionStats,
  CompletionItem,
  CompletionLabel,
  CompletionValue,
} from './OrdersPage.styles';

type TabType = 'open' | 'history' | 'trades' | 'automation' | 'analytics';
type TimeFilterType = 'all' | '1d' | '7d' | '30d';

function formatTime(timestamp: number, compact = false, locale = 'zh-CN'): string {
  if (compact) {
    return new Date(timestamp).toLocaleString(locale, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  return new Date(timestamp).toLocaleString(locale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatPrice(price: string | null): string {
  if (!price) return 'Market';
  const num = parseFloat(price);
  if (num >= 1000) return num.toFixed(2);
  if (num >= 1) return num.toFixed(4);
  return num.toFixed(8);
}

function formatQuantity(qty: string): string {
  const num = parseFloat(qty);
  if (num >= 100) return num.toFixed(2);
  if (num >= 1) return num.toFixed(4);
  return num.toFixed(6);
}

function formatUSD(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function getStatusConfig(status: OrderStatus): { text: string; Icons: IconsName; variant: 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected' } {
  const configs: Record<OrderStatus, { text: string; Icons: IconsName; variant: 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected' }> = {
    pending: { text: 'Pending', Icons: 'clock', variant: 'pending' },
    submitted: { text: 'Submitted', Icons: 'send', variant: 'pending' },
    open: { text: 'Open', Icons: 'radio', variant: 'open' },
    partial: { text: 'Partial', Icons: 'pie-chart', variant: 'open' },
    filled: { text: 'Filled', Icons: 'check-circle', variant: 'filled' },
    cancelled: { text: 'Cancelled', Icons: 'x-circle', variant: 'cancelled' },
    rejected: { text: 'Rejected', Icons: 'alert-circle', variant: 'rejected' },
    expired: { text: 'Expired', Icons: 'clock', variant: 'cancelled' },
    triggered: { text: 'Triggered', Icons: 'zap', variant: 'open' },
  };
  return configs[status] || { text: status, Icons: 'circle', variant: 'pending' };
}

// Order Row Component
function OrderRow({ order, onCancel, onView, locale }: { order: PaperOrder; onCancel?: (id: string) => void; onView?: (o: PaperOrder) => void; locale: string }) {
  const status = getStatusConfig(order.status);
  const canCancel = ['pending', 'open', 'partial'].includes(order.status);
  const isBuy = order.side === 'buy';
  const filledValue = order.fills.reduce((sum, fill) => sum + parseFloat(fill.price) * parseFloat(fill.quantity), 0);
  const fillPercent = parseFloat(order.quantity) > 0 ? (parseFloat(order.filledQty) / parseFloat(order.quantity)) * 100 : 0;

  return (
    <tr>
      <TimeCell>{formatTime(order.createdAt, true, locale)}</TimeCell>
      <SymbolCell><SymbolWrapper><SymbolName>{order.symbol.replace('USDT', '')}</SymbolName><SymbolQuote>/USDT</SymbolQuote></SymbolWrapper></SymbolCell>
      <td><SideBadge $side={isBuy ? 'buy' : 'sell'}>{isBuy ? 'BUY' : 'SELL'}</SideBadge></td>
      <td><TypeBadge>{order.type === 'limit' ? 'LIMIT' : 'MARKET'}</TypeBadge></td>
      <td className="tabular-nums">{formatPrice(order.price)}</td>
      <td>
        <AmountWrapper><span>{formatQuantity(order.filledQty)}</span><AmountDivider>/</AmountDivider><AmountTotal>{formatQuantity(order.quantity)}</AmountTotal></AmountWrapper>
        {order.status === 'partial' && <FillProgress><FillProgressBar $side={isBuy ? 'buy' : 'sell'} $width={fillPercent} /></FillProgress>}
      </td>
      <td className="tabular-nums">{order.avgPrice && parseFloat(order.avgPrice) > 0 ? formatPrice(order.avgPrice) : '—'}</td>
      <td className="tabular-nums">{filledValue > 0 ? formatUSD(filledValue) : '—'}</td>
      <td><StatusBadge $variant={status.variant}><Icons name={status.Icons} size="xs" /><span>{status.text}</span></StatusBadge></td>
      <ActionsCell>
        {canCancel && onCancel && <CancelBtn onClick={() => onCancel(order.clientOrderId)} title="Cancel Order"><Icons name="x" size="xs" /></CancelBtn>}
        {onView && <DetailsBtn onClick={() => onView(order)} title="View Details"><Icons name="eye" size="xs" /></DetailsBtn>}
      </ActionsCell>
    </tr>
  );
}

// Trade Row Component
function TradeRow({ fill, order, locale }: { fill: PaperOrder['fills'][0]; order: PaperOrder; locale: string }) {
  const isBuy = order.side === 'buy';
  const value = parseFloat(fill.price) * parseFloat(fill.quantity);
  return (
    <tr>
      <TimeCell>{formatTime(fill.time, true, locale)}</TimeCell>
      <SymbolCell><SymbolWrapper><SymbolName>{order.symbol.replace('USDT', '')}</SymbolName><SymbolQuote>/USDT</SymbolQuote></SymbolWrapper></SymbolCell>
      <td><SideBadge $side={isBuy ? 'buy' : 'sell'}>{isBuy ? 'BUY' : 'SELL'}</SideBadge></td>
      <td className="tabular-nums">{formatPrice(fill.price)}</td>
      <td className="tabular-nums">{formatQuantity(fill.quantity)}</td>
      <td className="tabular-nums">{formatUSD(value)}</td>
      <td className="tabular-nums">${parseFloat(fill.fee).toFixed(4)}</td>
    </tr>
  );
}

// Order Detail Drawer
function OrderDetailDrawerComponent({ order, onClose, locale }: { order: PaperOrder | null; onClose: () => void; locale: string }) {
  if (!order) return null;
  const status = getStatusConfig(order.status);
  const isBuy = order.side === 'buy';
  const filledValue = order.fills.reduce((sum, fill) => sum + parseFloat(fill.price) * parseFloat(fill.quantity), 0);
  const totalFee = order.fills.reduce((sum, fill) => sum + parseFloat(fill.fee), 0);

  return (
    <DrawerOverlay onClick={onClose}>
      <Drawer onClick={e => e.stopPropagation()}>
        <DrawerHeader><DrawerTitle>Order Details</DrawerTitle><DrawerClose onClick={onClose}><Icons name="x" size="sm" /></DrawerClose></DrawerHeader>
        <DrawerBody>
          <DetailSection>
            <DetailRow><DetailLabel>Symbol</DetailLabel><DetailValue>{order.symbol}</DetailValue></DetailRow>
            <DetailRow><DetailLabel>Side</DetailLabel><DetailValue className={isBuy ? 'price-up' : 'price-down'}>{isBuy ? 'BUY' : 'SELL'}</DetailValue></DetailRow>
            <DetailRow><DetailLabel>Type</DetailLabel><DetailValue>{order.type.toUpperCase()}</DetailValue></DetailRow>
            <DetailRow><DetailLabel>Status</DetailLabel><StatusBadge $variant={status.variant}><Icons name={status.Icons} size="xs" /><span>{status.text}</span></StatusBadge></DetailRow>
          </DetailSection>
          <DetailSection>
            <SectionTitleText>Price & Amount</SectionTitleText>
            <DetailRow><DetailLabel>Order Price</DetailLabel><DetailValue className="tabular-nums">{formatPrice(order.price)}</DetailValue></DetailRow>
            <DetailRow><DetailLabel>Order Amount</DetailLabel><DetailValue className="tabular-nums">{formatQuantity(order.quantity)}</DetailValue></DetailRow>
            <DetailRow><DetailLabel>Filled Amount</DetailLabel><DetailValue className="tabular-nums">{formatQuantity(order.filledQty)}</DetailValue></DetailRow>
            <DetailRow><DetailLabel>Avg Fill Price</DetailLabel><DetailValue className="tabular-nums">{order.avgPrice ? formatPrice(order.avgPrice) : '—'}</DetailValue></DetailRow>
            <DetailRow><DetailLabel>Total Value</DetailLabel><DetailValue className="tabular-nums">{filledValue > 0 ? formatUSD(filledValue) : '—'}</DetailValue></DetailRow>
            <DetailRow><DetailLabel>Total Fees</DetailLabel><DetailValue className="tabular-nums">${totalFee.toFixed(4)}</DetailValue></DetailRow>
          </DetailSection>
          <DetailSection>
            <SectionTitleText>Timeline</SectionTitleText>
            <DetailRow><DetailLabel>Created</DetailLabel><DetailValue className="tabular-nums">{formatTime(order.createdAt, false, locale)}</DetailValue></DetailRow>
            <DetailRow><DetailLabel>Updated</DetailLabel><DetailValue className="tabular-nums">{formatTime(order.updatedAt, false, locale)}</DetailValue></DetailRow>
          </DetailSection>
          {order.fills.length > 0 && (
            <DetailSection>
              <SectionTitleText>Fills ({order.fills.length})</SectionTitleText>
              <FillsList>
                {order.fills.map((fill, idx) => (
                  <FillItem key={idx}>
                    <FillMain><span className="tabular-nums">{formatQuantity(fill.quantity)}</span><FillAt>@</FillAt><span className="tabular-nums">{formatPrice(fill.price)}</span></FillMain>
                    <FillMeta><FillTime>{formatTime(fill.time, true, locale)}</FillTime><FillFee>Fee: ${parseFloat(fill.fee).toFixed(4)}</FillFee></FillMeta>
                  </FillItem>
                ))}
              </FillsList>
            </DetailSection>
          )}
          <DetailSection><DetailRow><DetailLabel>Order ID</DetailLabel><OrderIdText>{order.clientOrderId}</OrderIdText></DetailRow></DetailSection>
        </DrawerBody>
      </Drawer>
    </DrawerOverlay>
  );
}

// Analytics Panel Component
function AnalyticsPanelComponent({ orders, trades }: { orders: PaperOrder[]; trades: { fill: PaperOrder['fills'][0]; order: PaperOrder }[] }) {
  const filledOrders = orders.filter(o => o.status === 'filled');
  const bySymbol = useMemo(() => {
    const map = new Map<string, { volume: number; trades: number; fees: number }>();
    trades.forEach(({ fill, order }) => {
      const current = map.get(order.symbol) || { volume: 0, trades: 0, fees: 0 };
      current.volume += parseFloat(fill.price) * parseFloat(fill.quantity);
      current.trades += 1;
      current.fees += parseFloat(fill.fee);
      map.set(order.symbol, current);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].volume - a[1].volume);
  }, [trades]);

  const byDate = useMemo(() => {
    const map = new Map<string, { volume: number; trades: number }>();
    trades.forEach(({ fill }) => {
      const date = new Date(fill.time).toLocaleDateString('en-CA');
      const current = map.get(date) || { volume: 0, trades: 0 };
      current.volume += parseFloat(fill.price) * parseFloat(fill.quantity);
      current.trades += 1;
      map.set(date, current);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
  }, [trades]);

  const totalVolume = trades.reduce((sum, { fill }) => sum + parseFloat(fill.price) * parseFloat(fill.quantity), 0);
  const totalFees = trades.reduce((sum, { fill }) => sum + parseFloat(fill.fee), 0);
  const avgOrderSize = trades.length > 0 ? totalVolume / trades.length : 0;
  const buyVolume = trades.filter(({ order }) => order.side === 'buy').reduce((sum, { fill }) => sum + parseFloat(fill.price) * parseFloat(fill.quantity), 0);
  const sellVolume = totalVolume - buyVolume;
  const buyRatio = totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 50;

  return (
    <AnalyticsPanel>
      <AnalyticsRow>
        <AnalyticsStat><AnalyticsLabel>Total Volume</AnalyticsLabel><AnalyticsValue>{formatUSD(totalVolume)}</AnalyticsValue></AnalyticsStat>
        <AnalyticsStat><AnalyticsLabel>Total Trades</AnalyticsLabel><AnalyticsValue>{trades.length}</AnalyticsValue></AnalyticsStat>
        <AnalyticsStat><AnalyticsLabel>Avg Trade Size</AnalyticsLabel><AnalyticsValue>{formatUSD(avgOrderSize)}</AnalyticsValue></AnalyticsStat>
        <AnalyticsStat><AnalyticsLabel>Total Fees</AnalyticsLabel><AnalyticsValue>${totalFees.toFixed(2)}</AnalyticsValue></AnalyticsStat>
        <AnalyticsStat><AnalyticsLabel>Completed Orders</AnalyticsLabel><AnalyticsValue>{filledOrders.length}</AnalyticsValue></AnalyticsStat>
      </AnalyticsRow>
      <AnalyticsGrid>
        <AnalyticsCard>
          <AnalyticsCardTitle>Buy / Sell Ratio</AnalyticsCardTitle>
          <RatioBar><RatioBarBuy style={{ width: `${buyRatio}%` }} /><RatioBarSell style={{ width: `${100 - buyRatio}%` }} /></RatioBar>
          <RatioLabels><RatioLabelBuy>Buy {buyRatio.toFixed(1)}%</RatioLabelBuy><RatioLabelSell>Sell {(100 - buyRatio).toFixed(1)}%</RatioLabelSell></RatioLabels>
          <RatioValues><span>{formatUSD(buyVolume)}</span><span>{formatUSD(sellVolume)}</span></RatioValues>
        </AnalyticsCard>
        <AnalyticsCard>
          <AnalyticsCardTitle>Volume by Asset</AnalyticsCardTitle>
          <SymbolList>
            {bySymbol.slice(0, 5).map(([symbol, data]) => (
              <SymbolItem key={symbol}><SymbolInfo><SymbolName>{symbol.replace('USDT', '')}</SymbolName><SymbolTrades>{data.trades} trades</SymbolTrades></SymbolInfo><SymbolVolume>{formatUSD(data.volume)}</SymbolVolume></SymbolItem>
            ))}
            {bySymbol.length === 0 && <EmptyState>No trading data</EmptyState>}
          </SymbolList>
        </AnalyticsCard>
        <AnalyticsCard>
          <AnalyticsCardTitle>Daily Volume (Last 7 Days)</AnalyticsCardTitle>
          <BarChart>
            {byDate.map(([date, data]) => {
              const maxVol = Math.max(...byDate.map(d => d[1].volume));
              const height = maxVol > 0 ? (data.volume / maxVol) * 100 : 0;
              return (<BarWrapper key={date}><Bar $height={Math.max(height, 4)} title={`${date}: ${formatUSD(data.volume)}`} /><BarLabel>{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</BarLabel></BarWrapper>);
            })}
            {byDate.length === 0 && <EmptyState>No data for this period</EmptyState>}
          </BarChart>
        </AnalyticsCard>
        <AnalyticsCard>
          <AnalyticsCardTitle>Order Completion Rate</AnalyticsCardTitle>
          <CompletionStats>
            <CompletionItem><CompletionLabel>Filled</CompletionLabel><CompletionValue $variant="filled">{orders.filter(o => o.status === 'filled').length}</CompletionValue></CompletionItem>
            <CompletionItem><CompletionLabel>Cancelled</CompletionLabel><CompletionValue $variant="cancelled">{orders.filter(o => o.status === 'cancelled').length}</CompletionValue></CompletionItem>
            <CompletionItem><CompletionLabel>Rejected</CompletionLabel><CompletionValue $variant="rejected">{orders.filter(o => o.status === 'rejected').length}</CompletionValue></CompletionItem>
            <CompletionItem><CompletionLabel>Open</CompletionLabel><CompletionValue $variant="open">{orders.filter(o => ['pending', 'open', 'partial'].includes(o.status)).length}</CompletionValue></CompletionItem>
          </CompletionStats>
        </AnalyticsCard>
      </AnalyticsGrid>
    </AnalyticsPanel>
  );
}

export const OrdersPage = () => {
  const isMobile = useIsMobile();
  const { t: _t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('all');
  const [symbolFilter, setSymbolFilter] = useState<string>('all');
  const [sideFilter, setSideFilter] = useState<'all' | 'buy' | 'sell'>('all');

  if (isMobile) return <MobileOrdersPage />;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<PaperOrder | null>(null);

  const orders = useTradingStore((state) => state.orders);
  const cancelOrder = useTradingStore((state) => state.cancelOrder);
  const triggers = useAutomationStore((state) => state.triggers);

  const filterByTime = useCallback((timestamp: number) => {
    if (timeFilter === 'all') return true;
    const now = Date.now();
    const days = { '1d': 1, '7d': 7, '30d': 30 }[timeFilter] || 0;
    return timestamp > now - days * 24 * 60 * 60 * 1000;
  }, [timeFilter]);

  const CurrentOrders = useMemo(() =>
    orders.filter(o => ['pending', 'submitted', 'open', 'partial'].includes(o.status) && filterByTime(o.createdAt) && (symbolFilter === 'all' || o.symbol === symbolFilter) && (sideFilter === 'all' || o.side === sideFilter) && (searchQuery === '' || o.symbol.toLowerCase().includes(searchQuery.toLowerCase()))).sort((a, b) => b.createdAt - a.createdAt)
    , [orders, filterByTime, symbolFilter, sideFilter, searchQuery]);

  const historyOrders = useMemo(() =>
    orders.filter(o => ['filled', 'cancelled', 'rejected'].includes(o.status) && filterByTime(o.updatedAt) && (symbolFilter === 'all' || o.symbol === symbolFilter) && (sideFilter === 'all' || o.side === sideFilter) && (searchQuery === '' || o.symbol.toLowerCase().includes(searchQuery.toLowerCase()))).sort((a, b) => b.updatedAt - a.updatedAt)
    , [orders, filterByTime, symbolFilter, sideFilter, searchQuery]);

  const allTrades = useMemo(() =>
    orders.filter(o => o.fills.length > 0 && (symbolFilter === 'all' || o.symbol === symbolFilter) && (sideFilter === 'all' || o.side === sideFilter) && (searchQuery === '' || o.symbol.toLowerCase().includes(searchQuery.toLowerCase()))).flatMap(order => order.fills.filter(fill => filterByTime(fill.time)).map(fill => ({ fill, order }))).sort((a, b) => b.fill.time - a.fill.time)
    , [orders, filterByTime, symbolFilter, sideFilter, searchQuery]);

  const uniqueSymbols = useMemo(() => [...new Set(orders.map(o => o.symbol))].sort(), [orders]);

  const stats = useMemo(() => {
    const filled = orders.filter(o => o.status === 'filled').length;
    const totalTrades = allTrades.length;
    const totalVolume = allTrades.reduce((sum, { fill }) => sum + parseFloat(fill.price) * parseFloat(fill.quantity), 0);
    const totalFees = allTrades.reduce((sum, { fill }) => sum + parseFloat(fill.fee), 0);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentVolume = allTrades.filter(({ fill }) => fill.time > oneHourAgo).reduce((sum, { fill }) => sum + parseFloat(fill.price) * parseFloat(fill.quantity), 0);
    const dailyVolumes: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(); dayStart.setDate(dayStart.getDate() - i); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      dailyVolumes.push(allTrades.filter(({ fill }) => fill.time >= dayStart.getTime() && fill.time < dayEnd.getTime()).reduce((sum, { fill }) => sum + parseFloat(fill.price) * parseFloat(fill.quantity), 0));
    }
    return { openCount: CurrentOrders.length, filled, totalTrades, totalVolume, totalFees, recentVolume, dailyVolumes, triggerCount: triggers.filter(t => t.enabled).length };
  }, [orders, allTrades, CurrentOrders.length, triggers]);

  return (
    <Container>
      <Header>
        <HeaderTop>
          <TitleSection><PageTitle><Icons name="layers" size="lg" />Order Management</PageTitle><SimulatedBadge>Paper Trading</SimulatedBadge></TitleSection>
          <HeaderActions><ExportBtn><Icons name="download" size="sm" />Export</ExportBtn></HeaderActions>
        </HeaderTop>
        <StatsGrid>
          <StatCard $highlight={stats.openCount > 0}><StatHeader><StatIcons><Icons name="list" size="sm" /></StatIcons><StatLabel>Open Orders</StatLabel></StatHeader><StatBody><StatValue>{stats.openCount}</StatValue></StatBody></StatCard>
          <StatCard><StatHeader><StatIcons><Icons name="check-circle" size="sm" /></StatIcons><StatLabel>Filled Orders</StatLabel></StatHeader><StatBody><StatValue>{stats.filled}</StatValue></StatBody></StatCard>
          <StatCard><StatHeader><StatIcons><Icons name="activity" size="sm" /></StatIcons><StatLabel>Total Trades</StatLabel></StatHeader><StatBody><StatValue>{stats.totalTrades}</StatValue></StatBody></StatCard>
          <StatCard><StatHeader><StatIcons><Icons name="bar-chart-2" size="sm" /></StatIcons><StatLabel>Total Volume</StatLabel></StatHeader><StatBody><StatValue>{formatUSD(stats.totalVolume)}</StatValue></StatBody></StatCard>
          <StatCard><StatHeader><StatIcons><Icons name="clock" size="sm" /></StatIcons><StatLabel>1H Volume</StatLabel></StatHeader><StatBody><StatValue>{formatUSD(stats.recentVolume)}</StatValue></StatBody></StatCard>
          <StatCard><StatHeader><StatIcons><Icons name="percent" size="sm" /></StatIcons><StatLabel>Total Fees</StatLabel></StatHeader><StatBody><StatValue>${stats.totalFees.toFixed(2)}</StatValue></StatBody></StatCard>
          <StatCard $highlight={stats.triggerCount > 0}><StatHeader><StatIcons><Icons name="zap" size="sm" /></StatIcons><StatLabel>Active Triggers</StatLabel></StatHeader><StatBody><StatValue>{stats.triggerCount}</StatValue></StatBody></StatCard>
        </StatsGrid>
      </Header>

      <Toolbar>
        <Tabs>
          <Tab $active={activeTab === 'open'} onClick={() => setActiveTab('open')}><Icons name="list" size="xs" />Open Orders{stats.openCount > 0 && <TabBadge>{stats.openCount}</TabBadge>}</Tab>
          <Tab $active={activeTab === 'history'} onClick={() => setActiveTab('history')}><Icons name="history" size="xs" />Order History</Tab>
          <Tab $active={activeTab === 'trades'} onClick={() => setActiveTab('trades')}><Icons name="repeat" size="xs" />Trade History</Tab>
          <Tab $active={activeTab === 'automation'} onClick={() => setActiveTab('automation')}><Icons name="zap" size="xs" />Automation{stats.triggerCount > 0 && <TabBadge>{stats.triggerCount}</TabBadge>}</Tab>
          <Tab $active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}><Icons name="pie-chart" size="xs" />Analytics</Tab>
        </Tabs>

        {activeTab !== 'automation' && activeTab !== 'analytics' && (
          <Filters>
            <SearchWrapper><SearchIcons><Icons name="search" size="xs" /></SearchIcons><SearchInput type="text" placeholder="Search symbol..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></SearchWrapper>
            <FilterSelect value={symbolFilter} onChange={e => setSymbolFilter(e.target.value)}><option value="all">All Assets</option>{uniqueSymbols.map(s => <option key={s} value={s}>{s.replace('USDT', '')}/USDT</option>)}</FilterSelect>
            <FilterSelect value={sideFilter} onChange={e => setSideFilter(e.target.value as any)}><option value="all">All Sides</option><option value="buy">Buy Only</option><option value="sell">Sell Only</option></FilterSelect>
            <TimeFilters>{(['all', '1d', '7d', '30d'] as TimeFilterType[]).map(tf => <TimeFilter key={tf} $active={timeFilter === tf} onClick={() => setTimeFilter(tf)}>{tf === 'all' ? 'All' : tf.toUpperCase()}</TimeFilter>)}</TimeFilters>
          </Filters>
        )}
      </Toolbar>

      <Content>
        {activeTab === 'open' && (
          <TableContainer>
            {CurrentOrders.length === 0 ? (<Empty><Icons name="inbox" size="xl" /><h3>No Open Orders</h3><p>Your active orders will appear here</p></Empty>) : (
              <Table><TableHead><tr><th>Time</th><th>Symbol</th><th>Side</th><th>Type</th><th>Price</th><th>Filled / Amount</th><th>Avg Price</th><th>Value</th><th>Status</th><th>Actions</th></tr></TableHead><TableBody>{CurrentOrders.map(order => <OrderRow key={order.clientOrderId} order={order} onCancel={cancelOrder} onView={setSelectedOrder} locale={locale} />)}</TableBody></Table>
            )}
          </TableContainer>
        )}

        {activeTab === 'history' && (
          <TableContainer>
            {historyOrders.length === 0 ? (<Empty><Icons name="archive" size="xl" /><h3>No Order History</h3><p>Your completed orders will appear here</p></Empty>) : (
              <Table><TableHead><tr><th>Time</th><th>Symbol</th><th>Side</th><th>Type</th><th>Price</th><th>Filled / Amount</th><th>Avg Price</th><th>Value</th><th>Status</th><th>Actions</th></tr></TableHead><TableBody>{historyOrders.map(order => <OrderRow key={order.clientOrderId} order={order} onView={setSelectedOrder} locale={locale} />)}</TableBody></Table>
            )}
          </TableContainer>
        )}

        {activeTab === 'trades' && (
          <TableContainer>
            {allTrades.length === 0 ? (<Empty><Icons name="activity" size="xl" /><h3>No Trade History</h3><p>Your executed trades will appear here</p></Empty>) : (
              <Table><TableHead><tr><th>Time</th><th>Symbol</th><th>Side</th><th>Price</th><th>Amount</th><th>Value</th><th>Fee</th></tr></TableHead><TableBody>{allTrades.map(({ fill, order }, index) => <TradeRow key={`${order.clientOrderId}-${fill.time}-${index}`} fill={fill} order={order} locale={locale} />)}</TableBody></Table>
            )}
          </TableContainer>
        )}

        {activeTab === 'automation' && (
          <AutomationLayout>
            <AutomationMain><AutomationSection><AutomationSectionHeader><AutomationSectionTitle><Icons name="zap" size="sm" />Active Triggers</AutomationSectionTitle><SectionCount>{triggers.length}</SectionCount></AutomationSectionHeader><TriggerList /></AutomationSection></AutomationMain>
            <AutomationSidebar><AutomationSection><AutomationSectionHeader><AutomationSectionTitle><Icons name="scroll" size="sm" />Execution Log</AutomationSectionTitle></AutomationSectionHeader><ExecutionLogList /></AutomationSection></AutomationSidebar>
          </AutomationLayout>
        )}

        {activeTab === 'analytics' && <AnalyticsPanelComponent orders={orders} trades={allTrades} />}
      </Content>

      <OrderDetailDrawerComponent order={selectedOrder} onClose={() => setSelectedOrder(null)} locale={locale} />
    </Container>
  );
}
