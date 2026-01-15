import styled, { css } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-primary           → var(--bg-primary, #0D1117)
 * --bg-secondary         → var(--bg-secondary, #161B22)
 * --border               → var(--border, #30363D)
 * --border-subtle        → var(--border-subtle, #262C36)
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --accent               → #3B82F6
 * --accent-alpha         → rgba(59, 130, 246, 0.15)
 * --space-1/2/3/4/6      → 0.25/0.5/0.75/1/1.5rem
 * --header-height        → 48px (from layout)
 * --transition-fast      → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * MAIN CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  height: calc(100vh - 48px);
  overflow: hidden;
  background: var(--bg-primary, #0D1117);

  @media (max-width: 768px) {
    display: none;
  }
`;

export const MainLayout = styled.div`
  flex: 1;
  min-height: 0;
`;

/* ═══════════════════════════════════════════════════════════
 * PANEL WRAPPERS
 * ═══════════════════════════════════════════════════════════
 */
export const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 1024px) {
    display: none !important;
  }
`;

export const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
`;

export const CenterPanel = styled.div`
  display: flex !important;
  flex-direction: column !important;
`;

export const CenterPanelGroup = styled.div`
  flex: 1 !important;
  height: 100% !important;
`;

export const ChartPanel = styled.div`
  display: flex !important;
  flex-direction: column !important;
`;

/* ═══════════════════════════════════════════════════════════
 * CONTENT AREAS
 * ═══════════════════════════════════════════════════════════
 */
export const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
  overflow: hidden;

  & > :first-child {
    flex: 0 0 auto;
    max-height: 50%;
    overflow: hidden;
  }

  & > :last-child {
    flex: 1 1 auto;
    min-height: 11.25rem;
    overflow: hidden;
  }
`;

export const RightContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
  overflow: hidden;
`;

export const ChartArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;

  @media (max-height: 56.25rem) {
    gap: 0;
  }
`;

export const ChartContainer = styled.div`
  flex: 1 1 auto;
  min-height: 18.75rem;
  overflow: hidden;

  & > * {
    height: 100%;
  }

  @media (max-height: 56.25rem) {
    min-height: 15.625rem;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * RIGHT PANEL WRAPPERS
 * ═══════════════════════════════════════════════════════════
 */
export const AccountOverviewWrapper = styled.div`
  flex-shrink: 0;
`;

export const OrderFormWrapper = styled.div`
  flex-shrink: 0;
`;

export const Level2BookWrapper = styled.div`
  flex: 1 1 0;
  min-height: 12.5rem;
  overflow: hidden;

  @media (max-height: 900px) {
    display: none;
  }

  @media (max-width: 1400px) {
    display: none;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * RESIZE HANDLES
 * ═══════════════════════════════════════════════════════════
 */
export const ResizeHandleHorizontal = styled.div`
  width: 0.25rem;
  margin: 0 0.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease-out;
  cursor: col-resize;
  border-radius: 0.125rem;

  &:hover,
  &[data-panel-group-direction='horizontal'][data-resize-handle-active] {
    background: #3B82F6;
  }
`;

export const ResizeHandleVertical = styled.div`
  height: 0.25rem;
  margin: 0.125rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease-out;
  cursor: row-resize;
  border-radius: 0.125rem;

  &:hover,
  &[data-panel-group-direction='vertical'][data-resize-handle-active] {
    background: #3B82F6;
  }
`;

export const ResizeHandleInner = styled.div`
  width: 1px;
  height: 1px;
  background: var(--border-subtle, #262C36);
`;

/* ═══════════════════════════════════════════════════════════
 * MOBILE LAYOUT
 * ═══════════════════════════════════════════════════════════
 */
export const MobileContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px - 48px - env(safe-area-inset-bottom));
  background: var(--bg-primary, #0D1117);
  overflow: hidden;

  @media (min-width: 769px) {
    display: none !important;
  }
`;

export const MobileHeader = styled.div`
  flex-shrink: 0;
  padding: 0.5rem;
  background: var(--bg-secondary, #161B22);
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

export const MobileTabNav = styled.div`
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--bg-secondary, #161B22);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

interface MobileTabBtnProps {
  $active?: boolean;
}

export const MobileTabBtn = styled.button<MobileTabBtnProps>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  color: var(--text-tertiary, #6E7681);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s ease-out;
  white-space: nowrap;
  min-height: 2.25rem;

  &:active {
    background: var(--surface-hover, #262C36);
  }

  ${({ $active }) =>
    $active &&
    css`
      background: var(--surface, #1C2128);
      color: var(--text-primary, #E6EDF3);
    `}
`;

export const MobileContent = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;

  & > * {
    height: 100%;
  }
`;

export const MobileChartWrapper = styled.div`
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

export const MobileAccountSummary = styled.div<{ $expanded?: boolean }>`
  flex-shrink: 0;
  background: var(--bg-secondary, #161B22);
  border-top: 1px solid var(--border-subtle, #262C36);
  transition: max-height 0.15s ease-out;
  max-height: 48px;
  overflow: hidden;

  ${({ $expanded }) =>
    $expanded &&
    css`
      max-height: 25rem;
      overflow-y: auto;
    `}
`;

export const AccountToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border: none;
  color: var(--text-primary, #E6EDF3);
  cursor: pointer;
  gap: 0.5rem;

  &:active {
    background: var(--surface-hover, #262C36);
  }
`;

export const MobileOrderForm = styled.div`
  padding: 0.75rem;
  padding-top: 0;
`;

export const MobileQuickOrder = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
  background: var(--bg-secondary, #161B22);
  border-top: 1px solid var(--border-subtle, #262C36);
`;

interface QuickOrderBtnProps {
  $variant: 'buy' | 'sell';
}

export const QuickOrderBtn = styled.button<QuickOrderBtnProps>`
  flex: 1;
  height: 3rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.1s ease-out;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: white;

  &:active {
    transform: scale(0.98);
  }

  background: ${({ $variant }) =>
    $variant === 'buy' ? 'var(--color-positive, #3FB950)' : 'var(--color-negative, #F85149)'};
`;
