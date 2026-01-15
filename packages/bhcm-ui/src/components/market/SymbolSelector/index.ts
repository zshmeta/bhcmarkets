/* ═══════════════════════════════════════════════════════════
 * SYMBOL SELECTOR - PUBLIC API
 * ═══════════════════════════════════════════════════════════
 * Trading pair selector with WebSocket connection management.
 * 
 *   import { SymbolSelector } from '@/components-refactored/SymbolSelector';
 */

// Container
export { SymbolSelector } from './SymbolSelector';

// View (for UI library)
export { SymbolSelectorView } from './SymbolSelector.view';
export type { SymbolSelectorViewProps } from './SymbolSelector.view';

// Hook
export { useSymbolSelector, POPULAR_SYMBOLS } from './useSymbolSelector';
export type { UseSymbolSelectorReturn } from './useSymbolSelector';
