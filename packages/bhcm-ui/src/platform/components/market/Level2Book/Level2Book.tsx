import {useLevel2Book} from './useLevel2Book';
import { Level2BookView } from './Level2Book.view';

/* ═══════════════════════════════════════════════════════════
 * ORDER BOOK CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Smart component that connects the store via useLevel2Book hook
 * to the pure Level2BookView presentational component.
 *
 * This thin layer enables:
 * - Level2BookView to be reused anywhere without store dependencies
 * - Testing Level2BookView in isolation with mock data
 * - Using Level2BookView in Storybook without complex setup
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
      onPriceClick={onPriceClick}
      embedded={embedded}
      compact={compact}
    />
  );
}

export { Level2Book };
