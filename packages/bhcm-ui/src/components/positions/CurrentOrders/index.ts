/* ═══════════════════════════════════════════════════════════
 * OPEN ORDERS - PUBLIC API
 * ═══════════════════════════════════════════════════════════
 * Table displaying active trading orders with cancel functionality.
 * 
 *   import { CurrentOrders } from '@/components-refactored/CurrentOrders';
 */

// Container (smart component with store connection)
export { CurrentOrders } from './CurrentOrders';

// View (dumb component, pure props - for UI library)
export { CurrentOrdersView } from './CurrentOrders.view';
export type { CurrentOrdersViewProps } from './CurrentOrders.view';

// Hook (business logic)
export { useCurrentOrders } from './useCurrentOrders';
export type { UseCurrentOrdersReturn } from './useCurrentOrders';
