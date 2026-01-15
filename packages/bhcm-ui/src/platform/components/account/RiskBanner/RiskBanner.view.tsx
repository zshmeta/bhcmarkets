import { Icons } from '../Icons';
import type { RiskLevel, RiskMetrics, PerformanceMetrics, MarketMetrics, RiskBannerTranslations } from './useRiskBanner';
import {
    Container,
    Header,
    TitleGroup,
    RiskIcons,
    Title,
    LevelBadge,
    RibbonBar,
    SegmentFill,
    PerfGrid,
    PerfItem,
    PerfLabel,
    PerfValue,
    CompactContainer,
    CompactLevel,
    CompactDivider,
    CompactMetric,
    ScoreSection,
    GaugeContainer,
    GaugeValue,
    GaugeLabel,
    StatusInfo,
    StatusLevel,
    StatusDesc,
    Divider,
    GridTitle,
    FullGrid,
    GridItem,
    ItemLabel,
    ItemValue,
} from './RiskBanner.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 * RiskBanner.view.tsx - Dumb component with no store hooks.
 */

export interface RiskBannerViewProps {
    // Display mode
    compact?: boolean;
    full?: boolean;

    // Risk data
    riskMetrics: RiskMetrics | null;
    overallRisk: number;
    riskLevel: RiskLevel;
    riskLabel: string;
    riskDescription: string;

    // Performance
    performanceMetrics: PerformanceMetrics;

    // Market metrics
    marketMetrics: MarketMetrics | null;

    // Translations
    translations: RiskBannerTranslations;
}

const RiskBannerView = ({
    compact = false,
    full = false,
    riskMetrics,
    overallRisk,
    riskLevel,
    riskLabel,
    riskDescription,
    performanceMetrics,
    marketMetrics,
    translations: t,
}: RiskBannerViewProps) => {
    if (!riskMetrics) return null;

    // FULL DASHBOARD MODE
    if (full) {
        return (
            <Container $full>
                <ScoreSection>
                    <GaugeContainer $level={riskLevel}>
                        <GaugeValue>{overallRisk.toFixed(0)}</GaugeValue>
                        <GaugeLabel>{t.title}</GaugeLabel>
                    </GaugeContainer>
                    <StatusInfo>
                        <StatusLevel $level={riskLevel}>
                            <Icons name="shield" size="sm" />
                            {riskLabel}
                        </StatusLevel>
                        <StatusDesc>{riskDescription}</StatusDesc>
                    </StatusInfo>
                </ScoreSection>

                <Divider />

                <GridTitle>Real-time Risk Metrics</GridTitle>
                <FullGrid>
                    <GridItem>
                        <ItemLabel>{t.positionRatio}</ItemLabel>
                        <ItemValue>{riskMetrics.positionSizePercent.toFixed(2)}%</ItemValue>
                    </GridItem>
                    <GridItem>
                        <ItemLabel>Unrealized PnL</ItemLabel>
                        <ItemValue
                            $positive={riskMetrics.unrealizedPnlPercent >= 0}
                            $negative={riskMetrics.unrealizedPnlPercent < 0}
                        >
                            {riskMetrics.unrealizedPnlPercent >= 0 ? '+' : ''}
                            {riskMetrics.unrealizedPnlPercent.toFixed(2)}%
                        </ItemValue>
                    </GridItem>
                    <GridItem>
                        <ItemLabel>Market Volatility</ItemLabel>
                        <ItemValue>{marketMetrics?.microVolatility.toFixed(4)}</ItemValue>
                    </GridItem>
                    <GridItem>
                        <ItemLabel>Liquidity Depth</ItemLabel>
                        <ItemValue>{marketMetrics?.liquidityScore.toFixed(0)}/100</ItemValue>
                    </GridItem>
                </FullGrid>

                <Divider />

                <GridTitle>Historical Performance</GridTitle>
                <FullGrid>
                    <GridItem>
                        <ItemLabel>{t.winRate}</ItemLabel>
                        <ItemValue>{(performanceMetrics.winRate * 100).toFixed(1)}%</ItemValue>
                    </GridItem>
                    <GridItem>
                        <ItemLabel>{t.profitFactor}</ItemLabel>
                        <ItemValue>{performanceMetrics.profitFactor.toFixed(2)}</ItemValue>
                    </GridItem>
                    <GridItem>
                        <ItemLabel>{t.maxDrawdown}</ItemLabel>
                        <ItemValue $negative>-{performanceMetrics.maxDrawdown.toFixed(1)}%</ItemValue>
                    </GridItem>
                    <GridItem>
                        <ItemLabel>Total Realized PnL</ItemLabel>
                        <ItemValue
                            $positive={parseFloat(performanceMetrics.totalRealizedPnl) >= 0}
                            $negative={parseFloat(performanceMetrics.totalRealizedPnl) < 0}
                        >
                            ${performanceMetrics.totalRealizedPnl}
                        </ItemValue>
                    </GridItem>
                </FullGrid>
            </Container>
        );
    }

    // COMPACT MODE
    if (compact) {
        return (
            <CompactContainer>
                <CompactLevel $level={riskLevel}>
                    <Icons name="shield" size="xs" />
                    {riskLabel}
                </CompactLevel>
                <CompactDivider>|</CompactDivider>
                <CompactMetric>Pos: {riskMetrics.positionSizePercent.toFixed(0)}%</CompactMetric>
                <CompactMetric
                    $positive={riskMetrics.unrealizedPnlPercent >= 0}
                    $negative={riskMetrics.unrealizedPnlPercent < 0}
                >
                    {riskMetrics.unrealizedPnlPercent >= 0 ? '+' : ''}
                    {riskMetrics.unrealizedPnlPercent.toFixed(1)}%
                </CompactMetric>
            </CompactContainer>
        );
    }

    // DEFAULT MODE
    return (
        <Container>
            <Header>
                <TitleGroup>
                    <RiskIcons><Icons name="shield" size="xs" /></RiskIcons>
                    <Title>{t.title}</Title>
                </TitleGroup>
                <LevelBadge $level={riskLevel}>{riskLabel}</LevelBadge>
            </Header>

            <RibbonBar>
                <SegmentFill $width={riskMetrics.positionSizePercent} $profit={riskMetrics.unrealizedPnlPercent >= 0} />
            </RibbonBar>

            <PerfGrid>
                <PerfItem title={t.positionRatio}>
                    <PerfLabel>Pos</PerfLabel>
                    <PerfValue>{riskMetrics.positionSizePercent.toFixed(1)}%</PerfValue>
                </PerfItem>
                <PerfItem title={t.unrealizedPnL}>
                    <PerfLabel>PnL</PerfLabel>
                    <PerfValue
                        $positive={riskMetrics.unrealizedPnlPercent >= 0}
                        $negative={riskMetrics.unrealizedPnlPercent < 0}
                    >
                        {riskMetrics.unrealizedPnlPercent >= 0 ? '+' : ''}
                        {riskMetrics.unrealizedPnlPercent.toFixed(2)}%
                    </PerfValue>
                </PerfItem>
                <PerfItem title={t.winRate}>
                    <PerfLabel>Win</PerfLabel>
                    <PerfValue>{(performanceMetrics.winRate * 100).toFixed(0)}%</PerfValue>
                </PerfItem>
                <PerfItem title={t.profitFactor}>
                    <PerfLabel>PF</PerfLabel>
                    <PerfValue>{performanceMetrics.profitFactor.toFixed(2)}</PerfValue>
                </PerfItem>
                <PerfItem title={t.maxDrawdown}>
                    <PerfLabel>DD</PerfLabel>
                    <PerfValue $negative>-{performanceMetrics.maxDrawdown.toFixed(0)}%</PerfValue>
                </PerfItem>
                <PerfItem title={t.totalRealizedPnl}>
                    <PerfLabel>Real</PerfLabel>
                    <PerfValue
                        $positive={parseFloat(performanceMetrics.totalRealizedPnl) >= 0}
                        $negative={parseFloat(performanceMetrics.totalRealizedPnl) < 0}
                    >
                        {parseFloat(performanceMetrics.totalRealizedPnl) >= 0 ? '+' : ''}
                        {performanceMetrics.totalRealizedPnl}
                    </PerfValue>
                </PerfItem>
            </PerfGrid>
        </Container>
    );
}

export  {RiskBannerView};
