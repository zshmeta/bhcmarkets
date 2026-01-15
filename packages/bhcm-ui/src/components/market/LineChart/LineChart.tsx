import { useMemo } from 'react';
import { ChartContainer, PlaceholderBox, LineChartSvg } from './LineChart.styles';

/* ═══════════════════════════════════════════════════════════
 * LineChart COMPONENT
 * ═══════════════════════════════════════════════════════════
 * A compact line chart for displaying trends in small spaces.
 * 
 * Features:
 * - Auto-scales to fit data range
 * - Gradient fill under the line for visual depth
 * - Color indicates direction: green=up, red=down
 * - Graceful placeholder when data insufficient
 * 
 * SVG Note: Uses hardcoded hex colors because SVG stop-color
 * cannot parse CSS var() in gradient definitions.
 */

/* ─── Type Definitions ─── */
interface LineChartProps {
  /** Array of numeric values to chart */
  data: number[];
  /** Chart width in pixels */
  width?: number;
  /** Chart height in pixels */
  height?: number;
  /** Override automatic up/down color logic */
  color?: string;
  /** Additional CSS class for container */
  className?: string;
  /** Stroke width for the line path */
  lineWidth?: number;
  /** Unique ID for gradient (required if multiple LineCharts) */
  id?: string;
}

/* ─── Color Constants ───
 * Hardcoded because SVG gradients can't use CSS variables.
 * These match the design tokens for consistency.
 */
const CHART_COLORS = {
  up: '#22c55e',      // Matches --color-success (approx)
  down: '#ef4444',    // Matches --color-error (approx)
  neutral: '#94a3b8', // Muted fallback
} as const;

const LineChart = ({
  data,
  width = 100,
  height = 36,
  color,
  className = '',
  lineWidth = 1.5,
  id,
}: LineChartProps) => {
  /* ─── Path Computation ───
   * Memoized to avoid recalculating on every render.
   * Computes both the line path and the filled area path.
   */
  const { path, areaPath, isPositive } = useMemo(() => {
    // Need at least 2 points to draw a line
    if (data.length < 2) {
      return { path: '', areaPath: '', isPositive: true };
    }

    // Find data bounds for normalization
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Prevent division by zero
    const padding = 2; // Small margin from edges

    // Convert data values to SVG coordinates
    // Y is inverted: SVG 0,0 is top-left
    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * width,
      y: padding + (height - padding * 2) - ((value - min) / range) * (height - padding * 2),
    }));

    const firstPoint = points[0];
    if (!firstPoint) {
      return { path: '', areaPath: '', isPositive: true };
    }

    // Build SVG path: Move to first point, then Line to each subsequent
    const linePath = `M ${firstPoint.x},${firstPoint.y} ` +
      points.slice(1).map((p) => `L ${p.x},${p.y}`).join(' ');

    // Area path: close the shape at bottom for gradient fill
    const area = `${linePath} L ${width},${height} L 0,${height} Z`;

    // Determine trend direction for color
    const lastValue = data[data.length - 1];
    const firstValue = data[0];
    const positive = lastValue !== undefined && firstValue !== undefined
      ? lastValue >= firstValue
      : true;

    return { path: linePath, areaPath: area, isPositive: positive };
  }, [data, width, height]);

  // Resolve final color: user override > trend-based color
  const finalColor = color || (isPositive ? CHART_COLORS.up : CHART_COLORS.down);

  // Unique gradient ID prevents conflicts when multiple LineCharts render
  const gradientId = useMemo(
    () => `spark-grad-${id || Math.random().toString(36).substr(2, 9)}`,
    [id]
  );

  /* ─── Placeholder State ───
   * Renders when there's not enough data for a meaningful chart.
   */
  if (data.length < 2) {
    return (
      <PlaceholderBox
        className={className}
        style={{ width, height }}
      />
    );
  }

  /* ─── Chart Render ───
   * SVG with gradient definition, filled area, and stroke line.
   */
  return (
    <ChartContainer className={className} style={{ width, height }}>
      <LineChartSvg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {/* Gradient definition for the area fill */}
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={finalColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={finalColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Filled area under the line */}
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />

        {/* The actual line */}
        <path
          d={path}
          fill="none"
          stroke={finalColor}
          strokeWidth={lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </LineChartSvg>
    </ChartContainer>
  );
}

export default LineChart;
