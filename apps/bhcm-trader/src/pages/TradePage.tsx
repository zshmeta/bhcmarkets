import { useEffect, useState, useCallback } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Level2Book } from '../components-refactored/Level2Book';
import { HealthBoard } from '../components-refactored/HealthBoard';
import { RecentPositions } from '../components-refactored/RecentPositions';
import { OrderForm } from '../components-refactored/OrderForm';
import { RiskBanner } from '../components-refactored/RiskBanner';
import { Chart } from '../components-refactored/Chart';
import { Watchlist } from '../components-refactored/Watchlist';
import { Tabs } from '../components-refactored/Tabs';
import { CatchError } from '../components-refactored/CatchError';
import { useMarketStore, selectLevel2Book } from '../store/marketStore';
import { useTradingStore } from '../store/tradingStore';
import { useWatchlistStore, selectSelectedSymbol } from '../store/watchlistStore';
import { useIsMobile } from '../hooks/useMediaQuery';
import { MobileTradePage } from '../pages/mobile';
import {
    Container,
    LeftPanel,
    SidebarContent,
    CenterPanel,
    ChartPanel,
    ChartArea,
    ChartContainer,
    RightPanel,
    RightContent,
    OrderFormWrapper,
    Level2BookWrapper,
    ResizeHandleHorizontal,
    ResizeHandleVertical,
    ResizeHandleInner,
} from './TradePage.styles';

const PanelFallback = ({ name }: { name: string }) => (
    <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '10px' }}>
        PANEL_ERROR: {name}
    </div>
);

const ResizeHandle = ({ orientation = 'horizontal' }: { orientation?: 'horizontal' | 'vertical' }) => (
    <PanelResizeHandle>
        {orientation === 'horizontal' ? (
            <ResizeHandleHorizontal>
                <ResizeHandleInner />
            </ResizeHandleHorizontal>
        ) : (
            <ResizeHandleVertical>
                <ResizeHandleInner />
            </ResizeHandleVertical>
        )}
    </PanelResizeHandle>
);

export const TradePage = () => {
    const isMobile = useIsMobile();
    const Level2Book = useMarketStore(selectLevel2Book);
    const subscribe = useMarketStore((state) => state.subscribe);
    const unsubscribe = useMarketStore((state) => state.unsubscribe);
    const updateLevel2BookForMatching = useTradingStore((state) => state.updateLevel2BookForMatching);
    const selectedSymbol = useWatchlistStore(selectSelectedSymbol);

    const [selectedPrice, setSelectedPrice] = useState<{ value: string; timestamp: number } | undefined>();
    const [selectedSide, setSelectedSide] = useState<'buy' | 'sell' | undefined>();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handlePriceClick = useCallback((price: string, side?: 'buy' | 'sell') => {
        setSelectedPrice({ value: price, timestamp: Date.now() });
        if (side) setSelectedSide(side);
    }, []);

    const handleSymbolChange = useCallback((_symbol: string) => {
        setSelectedPrice(undefined);
        setSelectedSide(undefined);
    }, []);

    useEffect(() => {
        subscribe(selectedSymbol);
        return () => unsubscribe();
    }, [selectedSymbol, subscribe, unsubscribe]);

    useEffect(() => {
        if (Level2Book) {
            updateLevel2BookForMatching(Level2Book);
        }
    }, [Level2Book, updateLevel2BookForMatching]);

    // Render mobile layout
    if (isMobile) {
        return <MobileTradePage />;
    }

    // Desktop Layout
    return (
        <Container>
            <PanelGroup orientation="horizontal" style={{ height: '100%' }}>
                {/* Left Sidebar: Watchlist + Recent Trades */}
                <Panel
                    defaultSize={15}
                    minSize={5}
                    collapsible
                    onResize={(size) => {
                        setIsSidebarCollapsed(size.asPercentage === 0);
                    }}
                >
                    <LeftPanel>
                        <SidebarContent>
                            <CatchError name="Watchlist" fallback={<PanelFallback name="WATCHLIST" />}>
                                <Watchlist onSymbolChange={handleSymbolChange} isCollapsed={isSidebarCollapsed} />
                            </CatchError>
                            {!isSidebarCollapsed && (
                                <CatchError name="RecentPositions" fallback={<PanelFallback name="TRADES" />}>
                                    <RecentPositions onPriceClick={(price) => handlePriceClick(price)} />
                                </CatchError>
                            )}
                        </SidebarContent>
                    </LeftPanel>
                </Panel>

                <ResizeHandle />

                {/* Center Area: Chart + Bottom Tabs */}
                <Panel defaultSize={55} minSize={30}>
                    <CenterPanel>
                        <PanelGroup orientation="vertical" style={{ height: '100%' }}>
                            <Panel defaultSize={64} minSize={25}>
                                <ChartPanel>
                                    <ChartArea>
                                        <ChartContainer>
                                            <CatchError name="Chart" fallback={<PanelFallback name="PRICE_CHART" />}>
                                                <Chart />
                                            </CatchError>
                                        </ChartContainer>
                                        <CatchError name="Metrics" fallback={<PanelFallback name="METRICS" />}>
                                            <HealthBoard />
                                        </CatchError>
                                    </ChartArea>
                                </ChartPanel>
                            </Panel>

                            <ResizeHandle orientation="vertical" />

                            <Panel defaultSize={36} minSize={15}>
                                <CatchError name="Tabs" fallback={<PanelFallback name="BOTTOM_TABS" />}>
                                    <Tabs onPriceClick={handlePriceClick} />
                                </CatchError>
                            </Panel>
                        </PanelGroup>
                    </CenterPanel>
                </Panel>

                <ResizeHandle />

                {/* Right Sidebar: Order Entry + Level2Book */}
                <Panel defaultSize={18} minSize={12}>
                    <RightPanel>
                        <RightContent>
                            <CatchError name="Risk" fallback={<PanelFallback name="RISK" />}>
                                <RiskBanner />
                            </CatchError>
                            <OrderFormWrapper>
                                <CatchError name="OrderForm" fallback={<PanelFallback name="ORDER_ENTRY" />}>
                                    <OrderForm
                                        priceFromLevel2Book={selectedPrice?.value}
                                        sideFromLevel2Book={selectedSide}
                                        key={selectedPrice?.timestamp}
                                    />
                                </CatchError>
                            </OrderFormWrapper>
                            <Level2BookWrapper>
                                <CatchError name="Level2Book" fallback={<PanelFallback name="Level2Book" />}>
                                    <Level2Book onPriceClick={handlePriceClick} />
                                </CatchError>
                            </Level2BookWrapper>
                        </RightContent>
                    </RightPanel>
                </Panel>
            </PanelGroup>
        </Container>
    );
}
