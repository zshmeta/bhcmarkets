import { formatPrice, formatQuantity, clamp } from '../../utils';
import type { DepthLevel, TradeIndicator } from './useDepthChart';
import {
    Container,
    MidPriceLabel,
    Chart,
    Side,
    Level,
    Bar,
    BarLabel,
    Price,
    Center,
    MidLine,
    TradeIndicators,
    TradeIndicator as TradeIndicatorStyled,
    Legend,
    LegendItem,
    LegendDot,
    Loading,
} from './DepthChart.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 * DepthChart.view.tsx - Dumb component with no store hooks.
 * All data and callbacks passed via props.
 */

/* ─── Formatting Utilities ───
 * formatPrice and formatQuantity are now imported from centralized utils
 */

/* ═══════════════════════════════════════════════════════════
 * VIEW PROPS INTERFACE
 * ═══════════════════════════════════════════════════════════
 */
export interface DepthChartViewProps {
    /** Mid price for center display */
    midPrice: number;
    /** Bid levels (buy orders) */
    bidLevels: DepthLevel[];
    /** Ask levels (sell orders) */
    askLevels: DepthLevel[];
    /** Recent trade indicators */
    RecentPositionsPrices: TradeIndicator[];
    /** Function to calculate bar width from cumulative */
    scaleWidth: (cumulative: number) => number;
    /** Translations */
    translations: {
        title: string;
        midPrice: string;
        bids: string;
        asks: string;
        RecentPositions: string;
        loading: string;
    };
    /** Whether data is ready (shows loading if false) */
    isReady: boolean;
}

/* ═══════════════════════════════════════════════════════════
 * MAIN VIEW COMPONENT
 * ═══════════════════════════════════════════════════════════
 */
const DepthChartView = ({
    midPrice,
    bidLevels,
    askLevels,
    RecentPositionsPrices,
    scaleWidth,
    translations: t,
    isReady,
}: DepthChartViewProps) => {
    // Loading state
    if (!isReady) {
        return (
            <Container className="card">
                <div className="card-header">{t.title}</div>
                <Loading className="card-body">{t.loading}</Loading>
            </Container>
        );
    }

    return (
        <Container className="card">
            <div className="card-header">
                <span>{t.title}</span>
                <MidPriceLabel className="tabular-nums">
                    {t.midPrice}: {formatPrice(midPrice)}
                </MidPriceLabel>
            </div>

            <Chart>
                {/* Bid side (left) */}
                <Side $side="bid">
                    {bidLevels.map((level, i) => (
                        <Level key={`bid-${i}`} $side="bid">
                            <Bar $side="bid" $width={scaleWidth(level.cumulative)}>
                                <BarLabel $side="bid" className="tabular-nums">
                                    {formatQuantity(level.quantity)}
                                </BarLabel>
                            </Bar>
                            <Price $side="bid" className="tabular-nums price-up">
                                {formatPrice(level.price)}
                            </Price>
                        </Level>
                    ))}
                </Side>

                {/* Center - Trade indicators */}
                <Center>
                    <MidLine />
                    <TradeIndicators>
                        {RecentPositionsPrices.slice(0, 5).map((trade, i) => {
                            const relativePos = ((trade.price - midPrice) / midPrice) * 1000;
                            const clampedPos = clamp(relativePos, -50, 50);
                            return (
                                <TradeIndicatorStyled
                                    key={i}
                                    $isBuy={trade.isBuy}
                                    $top={50 + clampedPos}
                                    $opacity={1 - i * 0.15}
                                />
                            );
                        })}
                    </TradeIndicators>
                </Center>

                {/* Ask side (right) */}
                <Side $side="ask">
                    {askLevels.map((level, i) => (
                        <Level key={`ask-${i}`} $side="ask">
                            <Price $side="ask" className="tabular-nums price-down">
                                {formatPrice(level.price)}
                            </Price>
                            <Bar $side="ask" $width={scaleWidth(level.cumulative)}>
                                <BarLabel $side="ask" className="tabular-nums">
                                    {formatQuantity(level.quantity)}
                                </BarLabel>
                            </Bar>
                        </Level>
                    ))}
                </Side>
            </Chart>

            <Legend>
                <LegendItem>
                    <LegendDot $type="bid" />
                    <span>{t.bids}</span>
                </LegendItem>
                <LegendItem>
                    <LegendDot $type="ask" />
                    <span>{t.asks}</span>
                </LegendItem>
                <LegendItem>
                    <LegendDot $type="trade" />
                    <span>{t.RecentPositions}</span>
                </LegendItem>
            </Legend>
        </Container>
    );
}

export { DepthChartView };
