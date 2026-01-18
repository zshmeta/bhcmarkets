import styled from 'styled-components';
import { COLORS, RADIUS, SPACING } from '../theme';
import { Caption, Mono } from '../components/MobileTypography';

/**
 * Mobile OrderBook Component
 * 
 * Simplified order book display for mobile with touch-friendly rows.
 */

interface OrderBookLevel {
    price: string;
    quantity: string;
    total?: string;
}

interface MobileOrderBookProps {
    bids?: OrderBookLevel[];
    asks?: OrderBookLevel[];
    onPriceClick?: (price: string, side: 'buy' | 'sell') => void;
    maxRows?: number;
    className?: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  background: ${COLORS.bgPrimary};
  border-radius: ${RADIUS.l}px;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${SPACING.s}px ${SPACING.m}px;
  border-bottom: 1px solid ${COLORS.border};
`;

const BookSide = styled.div`
  flex: 1;
`;

const Row = styled.button<{ $side: 'bid' | 'ask' }>`
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: ${SPACING.s}px ${SPACING.m}px;
  border: none;
  background: transparent;
  cursor: pointer;
  
  &:active {
    background: ${({ $side }) =>
        $side === 'bid' ? 'rgba(63, 185, 80, 0.1)' : 'rgba(248, 81, 73, 0.1)'};
  }
`;

const Price = styled(Mono) <{ $side: 'bid' | 'ask' }>`
  color: ${({ $side }) => $side === 'bid' ? COLORS.secondary : COLORS.error};
  font-size: 13px;
`;

const Quantity = styled(Mono)`
  color: ${COLORS.textSecondary};
  font-size: 12px;
`;

export const MobileOrderBook = ({
    bids = [],
    asks = [],
    onPriceClick,
    maxRows = 8,
    className,
}: MobileOrderBookProps) => {
    const displayBids = bids.slice(0, maxRows);
    const displayAsks = asks.slice(0, maxRows).reverse();

    return (
        <Container className={className}>
            <Header>
                <Caption>Price</Caption>
                <Caption>Qty</Caption>
            </Header>

            <BookSide>
                {displayAsks.map((level, i) => (
                    <Row
                        key={`ask-${i}`}
                        $side="ask"
                        onClick={() => onPriceClick?.(level.price, 'sell')}
                    >
                        <Price $side="ask">{level.price}</Price>
                        <Quantity>{level.quantity}</Quantity>
                    </Row>
                ))}
            </BookSide>

            <BookSide>
                {displayBids.map((level, i) => (
                    <Row
                        key={`bid-${i}`}
                        $side="bid"
                        onClick={() => onPriceClick?.(level.price, 'buy')}
                    >
                        <Price $side="bid">{level.price}</Price>
                        <Quantity>{level.quantity}</Quantity>
                    </Row>
                ))}
            </BookSide>
        </Container>
    );
};

export { MobileOrderBook as OrderBook };
