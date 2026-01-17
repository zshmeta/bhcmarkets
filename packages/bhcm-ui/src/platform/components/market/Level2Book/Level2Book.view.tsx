import { memo } from 'react';
import { Icons } from '../../core/Icons';
import { formatPrice, formatQuantity } from '../../../../../../sdk/utils';
import type { Level2BookLevel } from '../../types/market';
import type { Level2BookMetrics, DataConfidenceState } from './useLevel2Book';
import {
    Container,
    Body,
    Header,
    AsksSection,
    BidsSection,
    ScrollContent,
    Level,
    DepthBar,
    Price,
    Quantity,
    SpreadSection,
    SpreadValue,
    SpreadBps,
    Loading,
    Spinner,
    ConfidenceIcons,
    ResyncOverlay,
    EmbeddedContainer,
    EmbeddedBody,
    EmbeddedColumn,
    EmbeddedHeader,
    EmbeddedScrollContent,
    EmbeddedSpread,
    EmbeddedSpreadValue,
    type ConfidenceLevel,
} from './Level2Book.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 * Level2Book.view.tsx - Dumb component, no hooks except React basics.
 * All data passed via props, fully reusable in any context.
 */

/* ─── Price Formatting Helpers ───
 * formatPrice and formatQuantity are now imported from centralized utils
 */

/* ═══════════════════════════════════════════════════════════
 * PRICE LEVEL ROW (Memoized sub-component)
 * ═══════════════════════════════════════════════════════════
 */
interface PriceLevelProps {
    level: Level2BookLevel;
    side: 'bid' | 'ask';
    maxQuantity: number;
    prevPrice?: string;
    onPriceClick?: (price: string, side: 'buy' | 'sell') => void;
    compact?: boolean;
}

const PriceLevel = memo(({
    level,
    side,
    maxQuantity,
    prevPrice,
    onPriceClick,
    compact
}: PriceLevelProps) => {
    const depthPercent = Math.min((parseFloat(level.quantity) / maxQuantity) * 100, 100);
    const priceChanged = prevPrice && prevPrice !== level.price;
    const priceUp = priceChanged && parseFloat(level.price) > parseFloat(prevPrice);

    const handleClick = () => {
        if (onPriceClick) {
            const orderSide = side === 'bid' ? 'buy' : 'sell';
            onPriceClick(level.price, orderSide);
        }
    };

    return (
        <Level
            $compact={compact}
            className={priceChanged ? (priceUp ? 'flash-up' : 'flash-down') : ''}
            onClick={handleClick}
            role="button"
            tabIndex={0}
        >
            <DepthBar $side={side} $width={depthPercent} />
            <Price $side={side} $compact={compact} className="tabular-nums">
                {formatPrice(level.price)}
            </Price>
            <Quantity $compact={compact} className="tabular-nums">
                {formatQuantity(level.quantity)}
            </Quantity>
        </Level>
    );
});

PriceLevel.displayName = 'PriceLevel';

/* ═══════════════════════════════════════════════════════════
 * VIEW PROPS INTERFACE
 * ═══════════════════════════════════════════════════════════
 */
export interface Level2BookViewProps {
    /** Order book levels (null = loading) */
    bids: Level2BookLevel[] | null;
    asks: Level2BookLevel[] | null;
    /** Computed metrics */
    metrics: Level2BookMetrics;
    /** Data confidence state */
    confidence: DataConfidenceState;
    /** Max quantities for depth bar scaling */
    maxQuantities: { bids: number; asks: number };
    /** Previous prices for change detection */
    prevPriceMap: Map<string, string>;
    /** Translations */
    translations: {
        title: string;
        price: string;
        amount: string;
        buyOrders: string;
        sellOrders: string;
    };
    /** Callback when a price level is clicked */
    onPriceClick?: (price: string, side: 'buy' | 'sell') => void;
    /** Horizontal layout for embedding */
    embedded?: boolean;
    /** Compact mode for mobile */
    compact?: boolean;
}

/* ═══════════════════════════════════════════════════════════
 * MAIN VIEW COMPONENT
 * ═══════════════════════════════════════════════════════════
 */
export function Level2BookView({
    bids,
    asks,
    metrics,
    confidence,
    maxQuantities,
    prevPriceMap,
    translations: t,
    onPriceClick,
    embedded = false,
    compact = false
}: Level2BookViewProps) {
    const { level, reason, isResyncing, isStale } = confidence;

    // Loading state
    if (!bids || !asks) {
        return (
            <Container className="card">
                <div className="card-header" style={{ padding: '4px 6px' }}>
                    <span className="card-title" style={{
                        color: 'var(--accent, #3B82F6)',
                        fontWeight: 500,
                        fontSize: '11px',
                        letterSpacing: '0.02em'
                    }}>
                        {t.title}
                    </span>
                </div>
                <Loading className="card-body">
                    <Spinner>
                        <Icons name="loader" />
                    </Spinner>
                </Loading>
            </Container>
        );
    }

    /* ─── Embedded Mode (Horizontal Layout) ─── */
    if (embedded) {
        return (
            <EmbeddedContainer $level={level as ConfidenceLevel}>
                <EmbeddedBody $isStale={isStale}>
                    {/* Bids - Left */}
                    <EmbeddedColumn>
                        <EmbeddedHeader>
                            <span className="price-up">{t.buyOrders}</span>
                            <span>{t.price}</span>
                            <span>{t.amount}</span>
                        </EmbeddedHeader>
                        <EmbeddedScrollContent>
                            {bids.slice(0, 15).map((lvl, i) => (
                                <PriceLevel
                                    key={`bid-${lvl.price}`}
                                    level={lvl}
                                    side="bid"
                                    maxQuantity={maxQuantities.bids}
                                    prevPrice={prevPriceMap.get(`bid-${i}`)}
                                    onPriceClick={onPriceClick}
                                    compact
                                />
                            ))}
                        </EmbeddedScrollContent>
                    </EmbeddedColumn>

                    {/* Spread - Center */}
                    <EmbeddedSpread>
                        <EmbeddedSpreadValue>
                            <span className="tabular-nums">{formatPrice(String(metrics.spread))}</span>
                            <SpreadBps>({metrics.spreadBps.toFixed(2)} bps)</SpreadBps>
                        </EmbeddedSpreadValue>
                        {level !== 'live' && (
                            <ConfidenceIcons title={reason}>
                                {isResyncing && <Spinner><Icons name="refresh-cw" size="sm" /></Spinner>}
                                {isStale && <Icons name="wifi-off" size="sm" />}
                                {level === 'degraded' && <Icons name="alert-triangle" size="sm" />}
                            </ConfidenceIcons>
                        )}
                    </EmbeddedSpread>

                    {/* Asks - Right */}
                    <EmbeddedColumn>
                        <EmbeddedHeader>
                            <span className="price-down">{t.sellOrders}</span>
                            <span>{t.price}</span>
                            <span>{t.amount}</span>
                        </EmbeddedHeader>
                        <EmbeddedScrollContent>
                            {asks.slice(0, 15).map((lvl, i) => (
                                <PriceLevel
                                    key={`ask-${lvl.price}`}
                                    level={lvl}
                                    side="ask"
                                    maxQuantity={maxQuantities.asks}
                                    prevPrice={prevPriceMap.get(`ask-${i}`)}
                                    onPriceClick={onPriceClick}
                                    compact
                                />
                            ))}
                        </EmbeddedScrollContent>
                    </EmbeddedColumn>
                </EmbeddedBody>

                {isResyncing && <ResyncOverlay />}
            </EmbeddedContainer>
        );
    }

    /* ─── Default/Compact Mode (Vertical Layout) ─── */
    return (
        <Container className="card" $compact={compact} $level={level as ConfidenceLevel}>
            {!compact && (
                <div className="card-header" style={{ padding: '4px 6px' }}>
                    <span className="card-title" style={{
                        color: 'var(--accent, #3B82F6)',
                        fontWeight: 500,
                        fontSize: '11px',
                        letterSpacing: '0.02em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <Icons name="book-open" size="xs" />
                        {t.title}
                    </span>
                    {level !== 'live' && (
                        <ConfidenceIcons title={reason}>
                            {isResyncing && <Spinner><Icons name="refresh-cw" size="xs" /></Spinner>}
                            {isStale && <Icons name="wifi-off" size="xs" />}
                            {level === 'degraded' && <Icons name="alert-triangle" size="xs" />}
                        </ConfidenceIcons>
                    )}
                </div>
            )}

            <Body $isStale={isStale}>
                <Header $compact={compact}>
                    <span>{t.price}</span>
                    <span>{t.amount}</span>
                </Header>

                {/* Asks (reversed so lowest ask is at bottom) */}
                <AsksSection>
                    <ScrollContent>
                        {asks.slice(-5).reverse().map((lvl, i) => (
                            <PriceLevel
                                key={`ask-${lvl.price}`}
                                level={lvl}
                                side="ask"
                                maxQuantity={maxQuantities.asks}
                                prevPrice={prevPriceMap.get(`ask-${asks.length - 1 - i}`)}
                                onPriceClick={onPriceClick}
                                compact={compact}
                            />
                        ))}
                    </ScrollContent>
                </AsksSection>

                {/* Spread */}
                <SpreadSection $compact={compact}>
                    <SpreadValue $compact={compact}>
                        <span className="tabular-nums">{formatPrice(String(metrics.spread))}</span>
                        <SpreadBps $compact={compact}>({metrics.spreadBps.toFixed(2)} bps)</SpreadBps>
                    </SpreadValue>
                    {compact && level !== 'live' && (
                        <ConfidenceIcons title={reason}>
                            {isResyncing && <Spinner><Icons name="refresh-cw" size="xs" /></Spinner>}
                            {isStale && <Icons name="wifi-off" size="xs" />}
                            {level === 'degraded' && <Icons name="alert-triangle" size="xs" />}
                        </ConfidenceIcons>
                    )}
                </SpreadSection>

                {/* Bids */}
                <BidsSection>
                    <ScrollContent>
                        {bids.slice(0, 5).map((lvl, i) => (
                            <PriceLevel
                                key={`bid-${lvl.price}`}
                                level={lvl}
                                side="bid"
                                maxQuantity={maxQuantities.bids}
                                prevPrice={prevPriceMap.get(`bid-${i}`)}
                                onPriceClick={onPriceClick}
                                compact={compact}
                            />
                        ))}
                    </ScrollContent>
                </BidsSection>
            </Body>

            {isResyncing && <ResyncOverlay />}
        </Container>
    );
}


