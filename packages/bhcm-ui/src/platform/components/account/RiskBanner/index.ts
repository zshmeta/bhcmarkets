/* ═══════════════════════════════════════════════════════════
 * RISK RIBBON - PUBLIC API
 * ═══════════════════════════════════════════════════════════
 * Portfolio risk metrics display with three modes.
 * 
 *   // Option 1: Smart container (connected to stores)
 *   import { RiskBanner } from '@/components-refactored/RiskBanner';
 *   <RiskBanner full />
 *   
 *   // Option 2: Dumb component (for testing/Storybook)
 *   import { RiskBannerView, useRiskBanner } from '@/components-refactored/RiskBanner';
 */

// Smart container
export { RiskBanner } from './RiskBanner';

// Dumb presentational component
export { RiskBannerView } from './RiskBanner.view';
export type { RiskBannerViewProps } from './RiskBanner.view';

// Business logic hook
export { useRiskBanner } from './useRiskBanner';
export type {
    UseRiskBannerReturn,
    RiskLevel,
    RiskMetrics,
    PerformanceMetrics,
    MarketMetrics,
    RiskBannerTranslations,
} from './useRiskBanner';
