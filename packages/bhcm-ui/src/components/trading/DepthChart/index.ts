// Container (smart component with store connection)
export { DepthChart } from './DepthChart';

// View (dumb component, pure props - for UI library)
export { DepthChartView } from './DepthChart.view';
export type { DepthChartViewProps } from './DepthChart.view';

// Hook (business logic)
export { useDepthChart } from './useDepthChart';
export type { UseDepthChartReturn, DepthLevel, TradeIndicator, DepthChartData } from './useDepthChart';
