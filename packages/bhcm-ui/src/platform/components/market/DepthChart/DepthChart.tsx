import { useDepthChart } from './useDepthChart';
import { DepthChartView } from './DepthChart.view';

/* ═══════════════════════════════════════════════════════════
 * DEPTH CHART CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Smart component that connects the store via useDepthChart hook
 * to the pure DepthChartView presentational component.
 *
 * This thin layer enables:
 * - DepthChartView to be reused anywhere without store dependencies
 * - Testing DepthChartView in isolation with mock data
 * - Using DepthChartView in Storybook without complex setup
 */

const DepthChart = () => {
    // All business logic extracted to hook
    const { data, isReady, scaleWidth, translations } = useDepthChart();

    // Render pure view with all data as props
    return (
        <DepthChartView
            midPrice={data?.midPrice ?? 0}
            bidLevels={data?.bidLevels ?? []}
            askLevels={data?.askLevels ?? []}
            RecentPositionsPrices={data?.RecentPositionsPrices ?? []}
            scaleWidth={scaleWidth}
            translations={translations}
            isReady={isReady}
        />
    );
}

export { DepthChart };
