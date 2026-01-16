/* ═══════════════════════════════════════════════════════════
 * PRICE CHART - PUBLIC API
 * ═══════════════════════════════════════════════════════════
 * Lightweight SVG-based chart for reliable rendering.
 * 
 * The SimpleChart is exported as Chart by default for stability.
 * FullChart (using lightweight-charts) is available for advanced use.
 */

// Default: Full TradingView-style chart
export { Chart } from './Chart';
export type { ChartType, TimeRange, Indicator } from './Chart';

// Lightweight SVG chart (stable, no heavy dependencies)
export { SimpleChart } from './SimpleChart';

// Business logic hook (data fetching, calculations)
export { useChart } from './useChart';
export type {
    UseChartReturn,
    KlineData,
    CrosshairData,
    PriceInfo,
    PriceLine,
} from './useChart';

