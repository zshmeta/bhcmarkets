/* ═══════════════════════════════════════════════════════════
 * ORDER BOOK - PUBLIC API
 * ═══════════════════════════════════════════════════════════
 * Real-time bid/ask order book with depth visualization.
 * 
 *   // Smart component (connected to store)
 *   import { Level2Book } from '@/components-refactored/Level2Book';
 *   <Level2Book onPriceClick={handlePriceClick} />
 *   
 *   // Dumb component (for custom data or testing)
 *   import { Level2BookView } from '@/components-refactored/Level2Book';
 *   <Level2BookView bids={mockBids} asks={mockAsks} ... />
 *   
 *   // Hook (for custom containers)
 *   import { useLevel2Book } from '@/components-refactored/Level2Book';
 *   const { Level2Book, metrics } = useLevel2Book();
 */

// Smart container (default export pattern)
export { Level2Book } from './Level2Book';

// Dumb presentational component
export { Level2BookView } from './Level2Book.view';
export type { Level2BookViewProps } from './Level2Book.view';

// Business logic hook
export { useLevel2Book } from './useLevel2Book';
export type { UseLevel2BookReturn, Level2BookData, Level2BookMetrics, DataConfidenceState } from './useLevel2Book';
