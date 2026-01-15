/* ═══════════════════════════════════════════════════════════
 * METRICS PANEL - PUBLIC API
 * ═══════════════════════════════════════════════════════════
 * Market microstructure metrics display.
 * 
 *   // Option 1: Full component
 *   import { HealthBoard } from '@/components-refactored/HealthBoard';
 *   
 *   // Option 2: Hook only (for custom metrics displays)
 *   import { useHealthBoard } from '@/components-refactored/HealthBoard';
 */

// Full component
export { HealthBoard } from './HealthBoard';

// View (dumb component, pure props - for UI library)
export { HealthBoardView } from './HealthBoard.view';
export type { HealthBoardViewProps } from './HealthBoard.view';

// Business logic hook
export { useHealthBoard } from './useHealthBoard';
export { formatPrice, formatVolume } from '../../utils';
export type {
  UseHealthBoardReturn,
  MetricItem,
  HealthBoardTranslations,
} from './useHealthBoard';
