import styled, { css, keyframes } from 'styled-components';

/**
 * Mobile Trade Page Styles
 * Token Reference (from tokens.css):
 * --bg-primary/secondary/tertiary → #0D1117 / #161B22 / #1C2128
 * --border-subtle → #262C36
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --color-positive/negative → #3FB950 / #F85149
 * --font-mono → 'IBM Plex Mono', monospace
 */

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary, #0D1117);
  overflow: hidden;
`;

/* ═══════════════════════════════════════════════════════════
 * HEADER
 * ═══════════════════════════════════════════════════════════
 */
export const Header = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0.75rem;
  background: var(--bg-secondary, #161B22);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  flex-shrink: 0;
  gap: 0.25rem;
`;

export const HeaderMain = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SymbolSection = styled.div`
  display: flex;
  align-items: center;
`;

export const SymbolBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--text-primary, #E6EDF3);
  cursor: pointer;
`;

export const SymbolName = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
`;

export const SymbolQuote = styled.span`
  font-size: 0.75rem;
  color: var(--text-tertiary, #6E7681);
  margin-top: 2px;
`;

export const PriceSection = styled.div`
  text-align: right;
`;

export const PriceInfo = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
`;

export const CurrentPrice = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);
`;

interface PriceChangeProps {
    $positive?: boolean;
    $negative?: boolean;
}

export const PriceChange = styled.span<PriceChangeProps>`
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 0.25rem;

  ${({ $positive }) => $positive && css`
    background: rgba(63, 185, 80, 0.15);
    color: var(--color-positive, #3FB950);
  `}

  ${({ $negative }) => $negative && css`
    background: rgba(248, 81, 73, 0.15);
    color: var(--color-negative, #F85149);
  `}
`;

export const HeaderStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.25rem;

  @media (max-width: 375px) {
    display: none;
  }
`;

export const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const StatLabel = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
`;

export const StatValue = styled.span`
  font-size: 11px;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-secondary, #9AA5B1);
`;

/* ═══════════════════════════════════════════════════════════
 * TAB NAVIGATION & CONTENT
 * ═══════════════════════════════════════════════════════════
 */
export const TabNav = styled.div`
  background: var(--bg-secondary, #161B22);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  flex-shrink: 0;
`;

export const Content = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;

  & > * {
    height: 100%;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }

  & > div {
    display: flex;
    flex-direction: column;
  }
`;

export const UnifiedTradeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

export const CompactChart = styled.div`
  height: 280px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

export const UnifiedBook = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

export const ChartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;

  & > :first-child {
    flex: 1;
    min-height: 0;
  }

  & > :last-child {
    flex-shrink: 0;
  }
`;

export const DepthRiskWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #0D1117);
  overflow-y: auto;

  & > :first-child {
    flex-shrink: 0;
    padding: 0.5rem;
  }

  & > :last-child {
    flex: 1;
    min-height: 300px;
  }
`;

export const DepthWrapper = styled.div`
  height: 100%;
  padding: 0.25rem;
`;

/* ═══════════════════════════════════════════════════════════
 * INFO BAR
 * ═══════════════════════════════════════════════════════════
 */
interface InfoBarProps {
    $hidden?: boolean;
}

export const InfoBar = styled.div<InfoBarProps>`
  padding: 0.5rem 0.75rem;
  background: var(--bg-secondary, #161B22);
  border-top: 1px solid var(--border-subtle, #262C36);
  flex-shrink: 0;
  display: flex;

  ${({ $hidden }) => $hidden && css`display: none;`}
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  width: 100%;
`;

export const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const InfoLabel = styled.span`
  font-size: 9px;
  color: var(--text-tertiary, #6E7681);
  line-height: 1;
  font-weight: 500;
  text-transform: uppercase;
`;

export const InfoValue = styled.span`
  font-size: 11px;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
  line-height: 1.2;
`;

export const PnLItem = styled(InfoItem)`
  grid-column: span 3;
  padding: 0.25rem 0.5rem;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.25rem;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  ${InfoLabel} {
    font-size: 10px;
  }

  ${InfoValue} {
    font-size: 12px;
  }
`;

export const PnLPercent = styled.span`
  font-size: 10px;
  margin-left: 0.25rem;
  font-weight: 700;
`;

/* ═══════════════════════════════════════════════════════════
 * PRICE ANIMATIONS
 * ═══════════════════════════════════════════════════════════
 */
const priceJumpAnim = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export const PriceJump = styled.span`
  display: inline-block;
  animation: ${priceJumpAnim} 0.2s ease-out;
`;

export const Positive = styled.span`
  color: var(--color-positive, #3FB950);
`;

export const Negative = styled.span`
  color: var(--color-negative, #F85149);
`;

/* ═══════════════════════════════════════════════════════════
 * BOTTOM ACTIONS
 * ═══════════════════════════════════════════════════════════
 */
export const BottomActions = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-secondary, #161B22);
  border-top: 1px solid var(--border-subtle, #262C36);
  flex-shrink: 0;
`;

export const ActionBtn = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease-out;
  text-transform: uppercase;
  letter-spacing: 0.03em;

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }

  @media (max-height: 600px) {
    height: 36px;
  }
`;

export const BuyBtn = styled(ActionBtn)`
  background: var(--color-positive, #3FB950);
  color: white;
`;

export const SellBtn = styled(ActionBtn)`
  background: var(--color-negative, #F85149);
  color: white;
`;

export const ActionLabel = styled.span`
  font-weight: 700;
`;

/* ═══════════════════════════════════════════════════════════
 * FALLBACK
 * ═══════════════════════════════════════════════════════════
 */
export const Fallback = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 100%;
  color: var(--text-tertiary, #6E7681);
  font-size: 0.875rem;
`;
