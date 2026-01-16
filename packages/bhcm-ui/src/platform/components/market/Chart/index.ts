/* ═══════════════════════════════════════════════════════════
 * PRICE CHART - PUBLIC API
 * ═══════════════════════════════════════════════════════════
 * Lightweight SVG-based chart for reliable rendering.
 * 
 * The SimpleChart is exported as Chart by default for stability.
 * FullChart (using lightweight-charts) is available for advanced use.
 */

// Default: Lightweight SVG chart (stable, no heavy dependencies)
export { Chart, SimpleChart } from './SimpleChart';

// Full TradingView-style chart (may have performance issues)
export { Chart as FullChart } from './Chart';
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

