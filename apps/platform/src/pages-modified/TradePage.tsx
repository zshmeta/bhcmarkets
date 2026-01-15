import { useEffect, useState, useCallback } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Level2Book } from '@repo/bhcm-ui/market';
import { HealthBoard } from '@repo/bhcm-ui/health';
import { RecentPositions } from '@repo/bhcm-ui/positions';
import { OrderForm } from '@repo/bhcm-ui/trading';
import { RiskBanner } from '@repo/bhcm-ui/account';
import { Chart } from '@repo/bhcm-ui/market';
import { Watchlist } from '@repo/bhcm-ui/market';
import { Tabs } from '@repo/bhcm-ui/layout';
import { CatchError } from '@repo/bhcm-ui/core';
import { useMarketStore, selectLevel2Book } from '@repo/bhcm-ui/store';
import { useTradingStore } from '@repo/bhcm-ui/store';
import { useWatchlistStore, selectSelectedSymbol } from '@repo/bhcm-ui/store';
import { useIsMobile } from '../hooks/useMediaQuery';
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const level2BookData = useMarketStore(selectLevel2Book);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscribe = useMarketStore((state: any) => state.subscribe);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = useMarketStore((state: any) => state.unsubscribe);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateLevel2BookForMatching = useTradingStore((state: any) => state.updateLevel2BookForMatching);
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
        if (level2BookData) {
            updateLevel2BookForMatching(level2BookData);
        }
    }, [level2BookData, updateLevel2BookForMatching]);

    // Mobile layout - TODO: implement MobileTradePage
    if (isMobile) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Mobile view coming soon</div>;
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
                                    <RecentPositions onPriceClick={(price: string) => handlePriceClick(price)} />
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
