import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@repo/bhcm-ui/i18n';
import { LineChart } from '@repo/bhcm-ui/market';
import { Icons, IconsName } from '@repo/bhcm-ui/core';
import { useWatchlistStore } from '@repo/sdk';
import { useIsMobile } from '../hooks/useMediaQuery';
import { MobileMarketsPage } from '../../../mobile/src/pages';
import {
    fetchAllTickers,
    fetchLineChart,
    calculateIndicators,
    formatVolume,
    formatPrice,
    parseSymbol,
    type MarketTicker,
    type MarketLineChart,
    type MarketIndicators,
} from '../services/marketDataService';
import {
    Container,
    Dashboard,
    StatCard,
    StatHeader,
    StatLabel,
    SentimentBadge,
    PairCount,
    Timeframe,
    StatValue,
    VolumeSubtext,
    BreadthBar,
    BreadthUp,
    BreadthLegend,
    LegendItem,
    LegendDot,
    LegendValue,
    LegendLabel,
    AssetHighlight,
    AssetMain,
    AssetSymbol,
    AssetQuote,
    AssetMetrics,
    ChangeValue,
    VolumeValue,
    PriceValue,
    MainCard,
    Toolbar,
    Tabs,
    Tab,
    TabCount,
    SearchWrapper,
    SearchIcons,
    Search,
    ViewToggle,
    ToggleBtn,
    TableArea,
    Table,
    TableHead,
    Sortable,
    TableBody,
    AssetCell,
    Base,
    Quote,
    FavBtn,
    IndicatorCell,
    Badge,
    TradeBtn,
    Grid,
    Card,
    CardChart,
    CardTop,
    CardSymbol,
    CardChange,
    CardPrice,
    CardFooter,
    MiniTradeBtn,
    SkeletonSmall,
    SkeletonWide,
    SkeletonLarge,
} from './MarketsPage.styles';

interface MarketData {
    symbol: string;
    ticker: MarketTicker | null;
    LineChart: MarketLineChart | null;
    indicators: MarketIndicators | null;
}

export const MarketsPage = () => {
    const isMobile = useIsMobile();

    // Render mobile layout
    if (isMobile) {
        return <MobileMarketsPage />;
    }

    const { t: _t } = useI18n();
    const navigate = useNavigate();
    const [markets, setMarkets] = useState<MarketData[]>([]);
    const [_loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('All');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [sortField, setSortField] = useState<keyof MarketTicker>('quoteVolume24h');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const { favorites, toggleFavorite, addSymbol, setSelectedSymbol } = useWatchlistStore();

    // Track if we've already loaded LineCharts to avoid re-fetching
    const [LineChartsLoaded, setLineChartsLoaded] = useState(false);

    const loadData = useCallback(async (isInitial = false) => {
        try {
            const tickers = await fetchAllTickers();
            const initialMarkets: MarketData[] = tickers.map(t => ({
                symbol: t.symbol,
                ticker: t,
                LineChart: null,
                indicators: null,
            }));

            // Preserve existing LineCharts and indicators when refreshing
            setMarkets(prev => {
                if (prev.length === 0) return initialMarkets;
                return initialMarkets.map(m => {
                    const existing = prev.find(p => p.symbol === m.symbol);
                    return {
                        ...m,
                        LineChart: existing?.LineChart ?? null,
                        indicators: existing?.indicators ?? null,
                    };
                });
            });
            setLoading(false);

            // Only fetch LineCharts and indicators on initial load to avoid rate limiting
            if (isInitial && !LineChartsLoaded) {
                setLineChartsLoaded(true);
                const topSymbols = tickers.slice(0, 30);
                for (let i = 0; i < topSymbols.length; i++) {
                    const ticker = topSymbols[i];
                    if (!ticker) continue;

                    const symbol = ticker.symbol;
                    setTimeout(() => {
                        fetchLineChart(symbol).then(s => {
                            setMarkets(prev => prev.map(m => m.symbol === symbol ? { ...m, LineChart: s } : m));
                        });
                        calculateIndicators(symbol).then(ind => {
                            setMarkets(prev => prev.map(m => m.symbol === symbol ? { ...m, indicators: ind } : m));
                        });
                    }, i * 100);
                }
            }
        } catch (err) {
            console.error('Market load error:', err);
        }
    }, [LineChartsLoaded]);

    useEffect(() => {
        loadData(true);
        const timer = setInterval(() => loadData(false), 60000);
        return () => clearInterval(timer);
    }, [loadData]);

    const filteredMarkets = useMemo(() => {
        let filtered = markets.filter(m => {
            const matchesSearch = m.symbol.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch && m.ticker;
        });

        switch (category) {
            case 'Favorites':
                filtered = filtered.filter(m => favorites.includes(m.symbol));
                break;
            case 'Gainers':
                filtered = filtered.filter(m => (m.ticker?.priceChangePercent ?? 0) > 0);
                break;
            case 'Losers':
                filtered = filtered.filter(m => (m.ticker?.priceChangePercent ?? 0) < 0);
                break;
            case 'High Volume':
                const sortedByVol = [...filtered].sort((a, b) =>
                    (b.ticker?.quoteVolume24h ?? 0) - (a.ticker?.quoteVolume24h ?? 0)
                );
                const topCount = Math.max(20, Math.floor(sortedByVol.length * 0.2));
                const topSymbols = new Set(sortedByVol.slice(0, topCount).map(m => m.symbol));
                filtered = filtered.filter(m => topSymbols.has(m.symbol));
                break;
            case 'Volatile':
                filtered = filtered.filter(m => Math.abs(m.ticker?.priceChangePercent ?? 0) >= 5);
                break;
            default:
                break;
        }

        return filtered.sort((a, b) => {
            if (!a.ticker || !b.ticker) return 0;
            const vA = a.ticker[sortField] as number;
            const vB = b.ticker[sortField] as number;
            return sortOrder === 'desc' ? vB - vA : vA - vB;
        });
    }, [markets, searchTerm, category, favorites, sortField, sortOrder]);

    const stats = useMemo(() => {
        const active = markets.filter(m => m.ticker);
        const gainers = active.filter(m => (m.ticker?.priceChangePercent ?? 0) > 0);
        const losers = active.filter(m => (m.ticker?.priceChangePercent ?? 0) < 0);
        const neutral = active.length - gainers.length - losers.length;
        const volatile = active.filter(m => Math.abs(m.ticker?.priceChangePercent ?? 0) >= 5);
        const totalVol = active.reduce((acc, m) => acc + (m.ticker?.quoteVolume24h ?? 0), 0);
        const avgChange = active.length > 0
            ? active.reduce((acc, m) => acc + (m.ticker?.priceChangePercent ?? 0), 0) / active.length
            : 0;

        const highVolCount = Math.max(20, Math.floor(active.length * 0.2));

        const topGainer = active.length > 0 ? active.reduce((best, current) => {
            if (!best?.ticker) return current;
            if (!current?.ticker) return best;
            return current.ticker.priceChangePercent > best.ticker.priceChangePercent ? current : best;
        }, active[0]) : null;

        const volumeLeader = active.length > 0 ? active.reduce((best, current) => {
            if (!best?.ticker) return current;
            if (!current?.ticker) return best;
            return current.ticker.quoteVolume24h > best.ticker.quoteVolume24h ? current : best;
        }, active[0]) : null;

        return {
            up: gainers.length,
            down: losers.length,
            neutral,
            volatileCount: volatile.length,
            highVolCount,
            totalVol,
            avgChange,
            topGainer,
            volumeLeader,
            totalPairs: active.length
        };
    }, [markets]);

    const handleSelect = (symbol: string) => {
        const { base, quote } = parseSymbol(symbol);
        addSymbol({ symbol, baseAsset: base, quoteAsset: quote });
        setSelectedSymbol(symbol);
        navigate('/trade');
    };

    const handleSort = (field: keyof MarketTicker) => {
        if (sortField === field) setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        else { setSortField(field); setSortOrder('desc'); }
    };

    return (
        <Container>
            {/* Header Intelligence Dashboard */}
            <Dashboard>
                {/* Card 1: Market Sentiment */}
                <StatCard>
                    <StatHeader>
                        <StatLabel>Market Sentiment</StatLabel>
                        <SentimentBadge $sentiment={stats.avgChange >= 0 ? 'bullish' : 'bearish'}>
                            {stats.avgChange >= 0 ? 'BULLISH' : 'BEARISH'}
                        </SentimentBadge>
                    </StatHeader>
                    <BreadthBar>
                        <BreadthUp $width={(stats.up / (stats.totalPairs || 1)) * 100} />
                    </BreadthBar>
                    <BreadthLegend>
                        <LegendItem>
                            <LegendDot $color="up" />
                            <LegendValue>{stats.up}</LegendValue>
                            <LegendLabel>Gainers</LegendLabel>
                        </LegendItem>
                        <LegendItem>
                            <LegendDot $color="down" />
                            <LegendValue>{stats.down}</LegendValue>
                            <LegendLabel>Decliners</LegendLabel>
                        </LegendItem>
                    </BreadthLegend>
                </StatCard>

                {/* Card 2: 24h Trading Volume */}
                <StatCard>
                    <StatHeader>
                        <StatLabel>24h Trading Volume</StatLabel>
                        <PairCount>{stats.totalPairs} pairs</PairCount>
                    </StatHeader>
                    <StatValue>${formatVolume(stats.totalVol)}</StatValue>
                    <VolumeSubtext>Aggregate USD Volume</VolumeSubtext>
                </StatCard>

                {/* Card 3: Top Performer */}
                <StatCard $clickable onClick={() => stats.topGainer && handleSelect(stats.topGainer.symbol)}>
                    <StatHeader>
                        <StatLabel>Top Performer</StatLabel>
                        <Timeframe>24H</Timeframe>
                    </StatHeader>
                    {stats.topGainer?.ticker ? (
                        <AssetHighlight>
                            <AssetMain>
                                <AssetSymbol>{parseSymbol(stats.topGainer.symbol).base}</AssetSymbol>
                                <AssetQuote>/ USD</AssetQuote>
                            </AssetMain>
                            <AssetMetrics>
                                <ChangeValue $positive>
                                    +{stats.topGainer.ticker.priceChangePercent.toFixed(2)}%
                                </ChangeValue>
                                <PriceValue>${formatPrice(stats.topGainer.ticker.price)}</PriceValue>
                            </AssetMetrics>
                        </AssetHighlight>
                    ) : (
                        <SkeletonLarge />
                    )}
                </StatCard>

                {/* Card 4: Volume Leader */}
                <StatCard $clickable onClick={() => stats.volumeLeader && handleSelect(stats.volumeLeader.symbol)}>
                    <StatHeader>
                        <StatLabel>Volume Leader</StatLabel>
                        <Timeframe>24H</Timeframe>
                    </StatHeader>
                    {stats.volumeLeader?.ticker ? (
                        <AssetHighlight>
                            <AssetMain>
                                <AssetSymbol>{parseSymbol(stats.volumeLeader.symbol).base}</AssetSymbol>
                                <AssetQuote>/ USD</AssetQuote>
                            </AssetMain>
                            <AssetMetrics>
                                <VolumeValue>${formatVolume(stats.volumeLeader.ticker.quoteVolume24h)}</VolumeValue>
                                <ChangeValue
                                    $positive={(stats.volumeLeader.ticker.priceChangePercent ?? 0) >= 0}
                                    $negative={(stats.volumeLeader.ticker.priceChangePercent ?? 0) < 0}
                                >
                                    {stats.volumeLeader.ticker.priceChangePercent > 0 ? '+' : ''}
                                    {stats.volumeLeader.ticker.priceChangePercent.toFixed(2)}%
                                </ChangeValue>
                            </AssetMetrics>
                        </AssetHighlight>
                    ) : (
                        <SkeletonLarge />
                    )}
                </StatCard>
            </Dashboard>

            <MainCard className="card">
                <Toolbar>
                    <Tabs>
                        {[
                            { id: 'All', label: 'All', Icons: null, count: stats.totalPairs },
                            { id: 'Favorites', label: 'Favorites', Icons: 'star' as IconsName, count: favorites.length },
                            { id: 'Gainers', label: 'Gainers', Icons: 'trending-up' as IconsName, count: stats.up, variant: 'gainer' as const },
                            { id: 'Losers', label: 'Losers', Icons: 'trending-down' as IconsName, count: stats.down, variant: 'loser' as const },
                            { id: 'High Volume', label: 'Top Volume', Icons: 'bar-chart-3' as IconsName, count: stats.highVolCount },
                            { id: 'Volatile', label: 'Volatile', Icons: 'activity' as IconsName, count: stats.volatileCount },
                        ].map(tab => (
                            <Tab
                                key={tab.id}
                                $active={category === tab.id}
                                $variant={category === tab.id ? tab.variant : undefined}
                                onClick={() => setCategory(tab.id)}
                            >
                                {tab.Icons && <Icons name={tab.Icons} size="xs" />}
                                <span>{tab.label}</span>
                                <TabCount $active={category === tab.id}>{tab.count}</TabCount>
                            </Tab>
                        ))}
                    </Tabs>
                    <SearchWrapper>
                        <SearchIcons><Icons name="search" size="sm" /></SearchIcons>
                        <Search
                            placeholder="Filter assets..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </SearchWrapper>
                    <ViewToggle>
                        <ToggleBtn
                            $active={viewMode === 'table'}
                            onClick={() => setViewMode('table')}
                            title="Table View"
                        >
                            <Icons name="layout-list" size="sm" />
                        </ToggleBtn>
                        <ToggleBtn
                            $active={viewMode === 'grid'}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <Icons name="layout-grid" size="sm" />
                        </ToggleBtn>
                    </ViewToggle>
                </Toolbar>

                <TableArea>
                    {viewMode === 'table' ? (
                        <Table>
                            <TableHead>
                                <tr>
                                    <th style={{ width: '40px' }}></th>
                                    <Sortable onClick={() => handleSort('symbol')}>Asset</Sortable>
                                    <Sortable onClick={() => handleSort('price')}>Last Price</Sortable>
                                    <Sortable onClick={() => handleSort('priceChangePercent')}>24h Change</Sortable>
                                    <Sortable onClick={() => handleSort('quoteVolume24h')}>24h Volume</Sortable>
                                    <th>Indicators</th>
                                    <th style={{ width: '120px' }}>Last 24h</th>
                                    <th style={{ width: '100px' }}>Action</th>
                                </tr>
                            </TableHead>
                            <TableBody>
                                {filteredMarkets.map(m => (
                                    <tr key={m.symbol} onClick={() => handleSelect(m.symbol)}>
                                        <td>
                                            <FavBtn
                                                $isFav={favorites.includes(m.symbol)}
                                                onClick={e => { e.stopPropagation(); toggleFavorite(m.symbol); }}
                                            >
                                                <Icons name="star" size="sm" />
                                            </FavBtn>
                                        </td>
                                        <td>
                                            <AssetCell>
                                                <Base>{parseSymbol(m.symbol).base}</Base>
                                                <Quote>/USD</Quote>
                                            </AssetCell>
                                        </td>
                                        <td className="tabular-nums font-medium">
                                            {m.ticker ? formatPrice(m.ticker.price) : '---'}
                                        </td>
                                        <td className={`tabular-nums ${(m.ticker?.priceChangePercent ?? 0) >= 0 ? 'price-up' : 'price-down'}`}>
                                            {m.ticker ? `${m.ticker.priceChangePercent > 0 ? '+' : ''}${m.ticker.priceChangePercent.toFixed(2)}%` : '---'}
                                        </td>
                                        <td className="tabular-nums text-secondary">
                                            ${m.ticker ? formatVolume(m.ticker.quoteVolume24h) : '---'}
                                        </td>
                                        <td>
                                            <IndicatorCell>
                                                {m.indicators ? (
                                                    <>
                                                        <Badge $warn={!!(m.indicators.rsi14 && m.indicators.rsi14 > 70)}>
                                                            RSI: {m.indicators.rsi14?.toFixed(0)}
                                                        </Badge>
                                                        <Icons
                                                            name={m.indicators.momentum === 'bullish' ? 'trending-up' : 'trending-down'}
                                                            size="xs"
                                                            className={m.indicators.momentum === 'bullish' ? 'price-up' : 'price-down'}
                                                        />
                                                    </>
                                                ) : <SkeletonSmall />}
                                            </IndicatorCell>
                                        </td>
                                        <td>
                                            {m.LineChart ? (
                                                <LineChart
                                                    data={m.LineChart.prices}
                                                    height={24}
                                                    width={100}
                                                    lineWidth={1.5}
                                                    color={(m.ticker?.priceChangePercent ?? 0) >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'}
                                                />
                                            ) : <SkeletonWide />}
                                        </td>
                                        <td>
                                            <TradeBtn>Execute</TradeBtn>
                                        </td>
                                    </tr>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <Grid>
                            {filteredMarkets.map(m => (
                                <Card key={m.symbol} onClick={() => handleSelect(m.symbol)}>
                                    <CardTop>
                                        <CardSymbol>{parseSymbol(m.symbol).base}</CardSymbol>
                                        <CardChange
                                            $positive={(m.ticker?.priceChangePercent ?? 0) >= 0}
                                            $negative={(m.ticker?.priceChangePercent ?? 0) < 0}
                                        >
                                            {m.ticker?.priceChangePercent.toFixed(2)}%
                                        </CardChange>
                                    </CardTop>
                                    <CardPrice>{m.ticker ? formatPrice(m.ticker.price) : '---'}</CardPrice>
                                    <CardChart>
                                        {m.LineChart && (
                                            <LineChart
                                                data={m.LineChart.prices}
                                                height={60}
                                                width={180}
                                                lineWidth={1.5}
                                                color={(m.ticker?.priceChangePercent ?? 0) >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'}
                                            />
                                        )}
                                    </CardChart>
                                    <CardFooter>
                                        <span className="text-secondary">Vol: ${formatVolume(m.ticker?.quoteVolume24h ?? 0)}</span>
                                        <MiniTradeBtn>Trade</MiniTradeBtn>
                                    </CardFooter>
                                </Card>
                            ))}
                        </Grid>
                    )}
                </TableArea>
            </MainCard>
        </Container>
    );
}
