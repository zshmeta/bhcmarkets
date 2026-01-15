import { memo, useCallback } from 'react';
import { Icons } from '../Icons';
import { formatPrice, formatQuantity, formatTime } from '../../utils';
import type { Trade } from '../../types/market';
import {
    Container,
    Header,
    Body,
    List,
    TradeRow,
    Price,
    TradeIcons,
    Quantity,
    Time,
    Empty,
    EmptyIcons,
} from './RecentPositions.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 * RecentPositions.view.tsx - Dumb component with no store hooks.
 * All data and callbacks passed via props.
 */

/* ─── Formatting Utilities ───
 * formatPrice, formatQuantity, formatTime are now imported from centralized utils
 */

/* ═══════════════════════════════════════════════════════════
 * TRADE ROW (Memoized sub-component)
 * ═══════════════════════════════════════════════════════════
 */
interface TradeRowItemProps {
    trade: Trade;
    compact?: boolean;
    onClick?: (price: string) => void;
}

const TradeRowItem = memo(({ trade, compact, onClick }: TradeRowItemProps) => {
    const isBuy = !trade.isBuyerMaker;
    const priceClass = isBuy ? 'price-up' : 'price-down';

    const handleClick = useCallback(() => {
        onClick?.(trade.price);
    }, [onClick, trade.price]);

    return (
        <TradeRow $compact={compact} onClick={handleClick} role="button" tabIndex={0}>
            <Price className={`${priceClass} tabular-nums`}>
                <TradeIcons>
                    <Icons name={isBuy ? 'trending-up' : 'trending-down'} size="xs" />
                </TradeIcons>
                {formatPrice(trade.price)}
            </Price>
            <Quantity className="tabular-nums">{formatQuantity(trade.quantity)}</Quantity>
            <Time $compact={compact} className="tabular-nums">{formatTime(trade.time)}</Time>
        </TradeRow>
    );
});

TradeRowItem.displayName = 'TradeRowItem';

/* ═══════════════════════════════════════════════════════════
 * VIEW PROPS INTERFACE
 * ═══════════════════════════════════════════════════════════
 */
interface RecentPositionsViewProps {
    /** List of trades to display */
    trades: Trade[];
    /** Whether there are any trades */
    hasTrades: boolean;
    /** Translations */
    translations: {
        title: string;
        price: string;
        amount: string;
        time: string;
        noTrades: string;
    };
    /** Callback when price is clicked */
    onPriceClick?: (price: string) => void;
    /** Compact mode for mobile/embedded */
    compact?: boolean;
}

/* ═══════════════════════════════════════════════════════════
 * MAIN VIEW COMPONENT
 * ═══════════════════════════════════════════════════════════
 */
const RecentPositionsView = ({
    trades,
    hasTrades,
    translations: t,
    onPriceClick,
    compact = false,
}: RecentPositionsViewProps) => {
    return (
        <Container $compact={compact} className="card animate-fade">
            {!compact && (
                <div className="card-header">
                    <span className="card-title">{t.title}</span>
                </div>
            )}

            <Header $compact={compact}>
                <span>{t.price}</span>
                <span>{t.amount}</span>
                <span>{t.time}</span>
            </Header>

            <Body>
                {!hasTrades ? (
                    <Empty>
                        <EmptyIcons>
                            <Icons name="history" size="lg" />
                        </EmptyIcons>
                        <span>{t.noTrades}</span>
                    </Empty>
                ) : (
                    <List>
                        {trades.map((trade) => (
                            <TradeRowItem
                                key={trade.id}
                                trade={trade}
                                compact={compact}
                                onClick={onPriceClick}
                            />
                        ))}
                    </List>
                )}
            </Body>
        </Container>
    );
}

export default RecentPositionsView;
