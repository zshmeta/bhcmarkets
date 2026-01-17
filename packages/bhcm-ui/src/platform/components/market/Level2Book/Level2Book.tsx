import { useOrderForm } from '../../trading/OrderForm/useOrderForm';
import { useLevel2Book } from './useLevel2Book';
import { Level2BookView } from './Level2Book.view';

/* ═══════════════════════════════════════════════════════════
 * ORDER BOOK CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Smart component that connects the store via useLevel2Book hook
 * to the pure Level2BookView presentational component.
 */

interface Level2BookProps {
  /** Callback when a price level is clicked */
  onPriceClick?: (price: string, side: 'buy' | 'sell') => void;
  /** Horizontal layout for embedding in Tabs */
  embedded?: boolean;
  /** Compact mode for mobile */
  compact?: boolean;
}

const Level2Book = ({
  onPriceClick,
  embedded = false,
  compact = false
}: Level2BookProps) => {
  // All business logic extracted to hook
  const {
    Level2Book,
    metrics,
    confidence,
    maxQuantities,
    prevPriceMap,
    translations,
  } = useLevel2Book();

  // If no external handler is provided, use the global order form integration
  const { actions } = useOrderForm();

  const handlePriceClick = (price: string, side: 'buy' | 'sell') => {
    if (onPriceClick) {
        onPriceClick(price, side);
    } else {
        // Default behavior: Fill the order form
        // Note: Clicking a BID means you want to SELL to them
        // Clicking an ASK means you want to BUY from them
        // The View passes 'buy' for BID clicks and 'sell' for ASK clicks based on context?
        // Let's check Level2Book.view.tsx logic:
        // side='bid' -> orderSide='buy' (Wait, if I click a bid, I want to sell... Logic might be flipped or intended for "copy price")
        // Usually: Click ASK to BUY. Click BID to SELL.

        // Let's trust the View's intent for now, but verify:
        // View says: const orderSide = side === 'bid' ? 'buy' : 'sell';
        // If side is 'bid', orderSide is 'buy'. This means "I want to place a Buy order at this Bid price".
        // This is "Maker" behavior (joining the bid).
        // "Taker" behavior would be selling into the bid.

        // Let's support Maker behavior (joining the book) as it's safer default.
        actions.onPriceChange(price);
        actions.onSideChange(side === 'buy' ? 'buy' : 'sell'); // View passes 'buy'/'sell'
    }
  };

  // Render pure view with all data as props
  return (
    <Level2BookView
      bids={Level2Book?.bids ?? null}
      asks={Level2Book?.asks ?? null}
      metrics={metrics}
      confidence={confidence}
      maxQuantities={maxQuantities}
      prevPriceMap={prevPriceMap}
      translations={translations}
      onPriceClick={handlePriceClick}
      embedded={embedded}
      compact={compact}
    />
  );
}

export { Level2Book };
