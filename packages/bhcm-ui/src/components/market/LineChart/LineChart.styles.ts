import styled, { keyframes } from 'styled-components';

/**
 * Token Mapping Reference (from tokens.css):
 * --bg-tertiary     → var(--bg-tertiary, #1C2128)
 * --text-tertiary   → var(--text-tertiary, #6E7681)
 * --radius-xs       → 0.125rem (2px)
 */

/* ═══════════════════════════════════════════════════════════
 * SHIMMER ANIMATION
 * ═══════════════════════════════════════════════════════════
 * Subtle pulsing effect for the placeholder state.
 * Creates visual feedback that data is loading.
 */
const shimmer = keyframes`
  0% { opacity: 0.2; }
  50% { opacity: 0.5; }
  100% { opacity: 0.2; }
`;

/* ═══════════════════════════════════════════════════════════
 * LineChart CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Wrapper that establishes dimensions for the SVG chart.
 * overflow: hidden clips any edge antialiasing artifacts.
 */
export const ChartContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

/* ═══════════════════════════════════════════════════════════
 * PLACEHOLDER STATE
 * ═══════════════════════════════════════════════════════════
 * Shown when there's insufficient data to render a chart.
 * Uses muted styling to indicate "no data" without being jarring.
 */
export const PlaceholderBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.125rem; /* 2px - minimal rounding */
  opacity: 0.5; /* Further muted to show it's inactive */
`;

/* ═══════════════════════════════════════════════════════════
 * SHIMMER LINE
 * ═══════════════════════════════════════════════════════════
 * A thin animated line inside the placeholder.
 * Gives visual indication that content will appear here.
 */
export const ShimmerLine = styled.div`
  width: 80%;
  height: 1px;
  background: var(--text-tertiary, #6E7681);
  animation: ${shimmer} 1.5s infinite;
`;

/* ═══════════════════════════════════════════════════════════
 * SVG ELEMENT
 * ═══════════════════════════════════════════════════════════
 * The actual LineChart chart. display: block removes
 * default inline spacing that can cause layout issues.
 */
export const LineChartSvg = styled.svg`
  display: block;
`;
