import styled from 'styled-components';
import { Chart as PriceChart } from '../../platform/components/market/Chart';
import { COLORS } from '../theme';

/**
 * Mobile Chart Wrapper
 * 
 * Wraps the platform Chart component with mobile-optimized defaults.
 * Responsive height, touch-friendly, compact controls.
 */

interface MobileChartProps {
    height?: number;
    showTimeRangeSelector?: boolean;
    showChartTypeSelector?: boolean;
    showIndicators?: boolean;
    className?: string;
}

const ChartContainer = styled.div<{ $height: number }>`
  width: 100%;
  height: ${({ $height }) => $height}px;
  background: ${COLORS.bgPrimary};
  border-radius: 12px;
  overflow: hidden;
  
  /* Mobile touch optimizations */
  touch-action: pan-y pinch-zoom;
  -webkit-user-select: none;
  user-select: none;
  
  /* Responsive sizing */
  @media (max-height: 700px) {
    height: ${({ $height }) => Math.max($height - 60, 180)}px;
  }
  
  /* Override internal chart controls for mobile */
  .chart-controls {
    padding: 8px;
    gap: 4px;
  }
  
  .chart-controls button {
    min-height: 32px;
    min-width: 32px;
    font-size: 12px;
  }
`;

export const MobileChart = ({
    height = 280,
    showTimeRangeSelector: _showTimeRangeSelector = true,
    showChartTypeSelector: _showChartTypeSelector = false,
    showIndicators: _showIndicators = false,
    className,
}: MobileChartProps) => (
    <ChartContainer $height={height} className={className}>
        <PriceChart />
    </ChartContainer>
);

export { MobileChart as Chart };
