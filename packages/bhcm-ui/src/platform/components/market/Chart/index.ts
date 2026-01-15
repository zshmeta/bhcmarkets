/* ═══════════════════════════════════════════════════════════
 * PRICE CHART - PUBLIC API
 * ═══════════════════════════════════════════════════════════
 * TradingView-style candlestick/line chart with indicators.
 * 
 *   // Option 1: Full component (contains chart refs)
 *   import { Chart } from '@/components-refactored/Chart';
 *   
 *   // Option 2: Hook only (for custom chart implementations)
 *   import { useChart } from '@/components-refactored/Chart';
 */

// Full component (includes chart initialization)
export { Chart } from './Chart';
export type { ChartType, TimeRange, Indicator } from './Chart';

// Business logic hook (data fetching, calculations)
export { useChart } from './useChart';
export type {
    UseChartReturn,
    KlineData,
    CrosshairData,
    PriceInfo,
    PriceLine,
} from './useChart';
