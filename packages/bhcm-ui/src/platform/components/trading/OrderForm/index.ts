/* ═══════════════════════════════════════════════════════════
 * ORDER ENTRY - PUBLIC API
 * ═══════════════════════════════════════════════════════════
 * Trading order form supporting spot, conditional, and OCO orders.
 * 
 *   // Option 1: Smart container (connected to stores)
 *   import { OrderForm } from '@/components-refactored/OrderForm';
 *   <OrderForm />
 *   
 *   // Option 2: Dumb component (for testing/Storybook)
 *   import { OrderFormView, useOrderForm } from '@/components-refactored/OrderForm';
 *   const hookData = useOrderForm();
 *   <OrderFormView {...hookData} ... />
 */

// Smart container
export { OrderForm } from './OrderForm';

// Dumb presentational component
export { OrderFormView } from './OrderForm.view';
export type { OrderFormViewProps } from './OrderForm.view';

// Business logic hook
export { useOrderForm } from './useOrderForm';
export type {
    UseOrderFormReturn,
    OrderCategory,
    OrderFormFormState,
    DataConfidenceInfo,
    BalanceInfo,
    EstimatedValues,
    OrderFormTranslations,
} from './useOrderForm';
