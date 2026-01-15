import styled, { css } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-tertiary          → var(--bg-tertiary, #1C2128)
 * --border-primary       → var(--border, #30363D)
 * --border-secondary     → var(--border-subtle, #262C36)
 * --text-secondary       → var(--text-secondary, #9AA5B1)
 * --text-tertiary        → var(--text-tertiary, #6E7681)
 * --color-price-up       → var(--color-price-up, #3FB950)
 * --color-price-down     → var(--color-price-down, #F85149)
 * --color-info           → #58A6FF
 * --space-1/2/4          → 0.25/0.5/1rem
 * --font-size-xs         → 0.6875rem
 * --transition-fast      → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
export const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

/* ═══════════════════════════════════════════════════════════
 * MID PRICE DISPLAY
 * ═══════════════════════════════════════════════════════════
 */
export const MidPriceLabel = styled.span`
  font-size: 0.6875rem;
  color: var(--text-secondary, #9AA5B1);
`;

/* ═══════════════════════════════════════════════════════════
 * CHART GRID
 * ═══════════════════════════════════════════════════════════
 */
export const Chart = styled.div`
  display: grid;
  grid-template-columns: 1fr 24px 1fr;
  gap: 0;
  padding: 0.5rem;
  min-height: 300px;
`;

/* ═══════════════════════════════════════════════════════════
 * BID/ASK SIDES
 * ═══════════════════════════════════════════════════════════
 */
interface SideProps {
    $side: 'bid' | 'ask';
}

export const Side = styled.div<SideProps>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: ${({ $side }) => ($side === 'bid' ? 'flex-end' : 'flex-start')};
`;

/* ═══════════════════════════════════════════════════════════
 * LEVEL ROW
 * ═══════════════════════════════════════════════════════════
 */
interface LevelProps {
    $side: 'bid' | 'ask';
}

export const Level = styled.div<LevelProps>`
  display: flex;
  align-items: center;
  height: 18px;
  gap: 0.25rem;
  flex-direction: ${({ $side }) => ($side === 'bid' ? 'row-reverse' : 'row')};
`;

/* ═══════════════════════════════════════════════════════════
 * DEPTH BAR
 * ═══════════════════════════════════════════════════════════
 */
interface BarProps {
    $side: 'bid' | 'ask';
    $width: number;
}

export const Bar = styled.div<BarProps>`
  height: 14px;
  border-radius: 2px;
  position: relative;
  min-width: 4px;
  width: ${({ $width }) => $width}%;
  transition: width 0.1s ease-out;
  opacity: 0.3;
  background: ${({ $side }) =>
        $side === 'bid'
            ? 'var(--color-price-up, #3FB950)'
            : 'var(--color-price-down, #F85149)'};
`;

interface BarLabelProps {
    $side: 'bid' | 'ask';
}

export const BarLabel = styled.span<BarLabelProps>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 9px;
  color: var(--text-secondary, #9AA5B1);
  white-space: nowrap;
  padding: 0 4px;
  ${({ $side }) => ($side === 'bid' ? 'right: 4px;' : 'left: 4px;')}
`;

/* ═══════════════════════════════════════════════════════════
 * PRICE LABEL
 * ═══════════════════════════════════════════════════════════
 */
interface PriceProps {
    $side: 'bid' | 'ask';
}

export const Price = styled.span<PriceProps>`
  font-size: 0.6875rem;
  min-width: 60px;
  text-align: ${({ $side }) => ($side === 'bid' ? 'left' : 'right')};
`;

/* ═══════════════════════════════════════════════════════════
 * CENTER COLUMN
 * ═══════════════════════════════════════════════════════════
 */
export const Center = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const MidLine = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--border, #30363D);
`;

export const TradeIndicators = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
`;

interface TradeIndicatorProps {
    $isBuy: boolean;
    $top: number;
    $opacity: number;
}

export const TradeIndicator = styled.div<TradeIndicatorProps>`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: ${({ $top }) => $top}%;
  opacity: ${({ $opacity }) => $opacity};
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.1s ease-out;
  background: ${({ $isBuy }) =>
        $isBuy
            ? 'var(--color-price-up, #3FB950)'
            : 'var(--color-price-down, #F85149)'};
  box-shadow: ${({ $isBuy }) =>
        $isBuy
            ? '0 0 4px var(--color-price-up, #3FB950)'
            : '0 0 4px var(--color-price-down, #F85149)'};
`;

/* ═══════════════════════════════════════════════════════════
 * LEGEND
 * ═══════════════════════════════════════════════════════════
 */
export const Legend = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem;
  border-top: 1px solid var(--border-subtle, #262C36);
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
`;

interface LegendDotProps {
    $type: 'bid' | 'ask' | 'trade';
}

export const LegendDot = styled.span<LegendDotProps>`
  width: 8px;
  height: 8px;
  border-radius: ${({ $type }) => ($type === 'trade' ? '50%' : '2px')};
  background: ${({ $type }) => {
        switch ($type) {
            case 'bid':
                return 'var(--color-price-up, #3FB950)';
            case 'ask':
                return 'var(--color-price-down, #F85149)';
            case 'trade':
                return '#58A6FF';
        }
    }};
`;

/* ═══════════════════════════════════════════════════════════
 * LOADING STATE
 * ═══════════════════════════════════════════════════════════
 */
export const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--text-tertiary, #6E7681);
`;
