import styled, { css, keyframes } from 'styled-components';

/* Chart - TradingView-style charting component */

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

interface ContainerProps {
  $fullscreen?: boolean;
}

export const Container = styled.div<ContainerProps>`
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary, #161B22);
  border-radius: 0.375rem;
  overflow: hidden;
  height: 100%;
  min-height: 350px;

  @media (max-height: 900px) { min-height: 280px; }
  @media (max-width: 768px) { min-height: 150px; }

  ${({ $fullscreen }) => $fullscreen && css`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 1000;
    border-radius: 0;
    min-height: 100vh;
  `}
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--bg-tertiary, #1C2128);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  gap: 0.5rem;
  flex-wrap: wrap;
  flex-shrink: 0;

  @media (max-height: 800px) { padding: 2px 8px; min-height: 32px; }
  @media (max-width: 768px) { padding: 2px 6px; flex-wrap: nowrap; height: 32px; min-height: 32px; overflow: hidden; }
`;

export const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const ToolbarScrollArea = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  flex: 1;

  &::-webkit-scrollbar { display: none; }
  @media (max-width: 768px) { gap: 6px; height: 100%; overflow-y: hidden; }
`;

export const DemoIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(210, 153, 34, 0.1);
  color: var(--color-warning, #D29922);
  font-size: 10px;
  font-weight: 700;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: ${pulse} 2s infinite;
`;

export const IndicatorGroup = styled.div`
  display: flex;
  gap: 2px;
  background: var(--bg-secondary, #161B22);
  padding: 2px;
  border-radius: 0.25rem;

  @media (max-height: 700px) { display: none; }
`;

interface ActiveButtonProps {
  $active?: boolean;
}

export const IndicatorBtn = styled.button<ActiveButtonProps>`
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  background: transparent;
  border: none;
  border-radius: 2px;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  transition: all 0.1s ease-out;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover { color: var(--text-secondary, #9AA5B1); background: var(--surface-hover, #262C36); }

  ${({ $active }) => $active && css`
    color: var(--accent, #58A6FF);
    background: rgba(88, 166, 255, 0.1);
  `}

  @media (max-height: 800px) { padding: 2px 6px; font-size: 10px; }
  @media (max-width: 768px) { padding: 2px 5px; font-size: 9px; }
`;

export const ChartTypeGroup = styled.div`
  display: flex;
  gap: 2px;
  background: var(--bg-secondary, #161B22);
  padding: 2px;
  border-radius: 0.25rem;
`;

export const ChartTypeBtn = styled.button<ActiveButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 24px;
  background: transparent;
  border: none;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.1s ease-out;

  &:hover { color: var(--text-secondary, #9AA5B1); background: var(--surface-hover, #262C36); }

  ${({ $active }) => $active && css`
    color: var(--accent, #58A6FF);
    background: rgba(88, 166, 255, 0.1);
  `}

  @media (max-height: 800px) { width: 24px; height: 20px; }
  @media (max-width: 768px) { width: 24px; height: 20px; }
`;

export const TimeRangeGroup = styled.div`
  display: flex;
  gap: 2px;
`;

export const TimeRangeBtn = styled.button<ActiveButtonProps>`
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.25rem;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover { color: var(--text-secondary, #9AA5B1); background: var(--surface-hover, #262C36); }

  ${({ $active }) => $active && css`
    color: var(--accent, #58A6FF);
    border-color: var(--accent, #58A6FF);
    background: rgba(88, 166, 255, 0.1);
  `}

  @media (max-height: 800px) { padding: 2px 6px; font-size: 10px; }
  @media (max-width: 768px) { padding: 2px 5px; font-size: 9px; }
`;

export const ToolBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  background: transparent;
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.25rem;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover { color: var(--text-primary, #E6EDF3); border-color: var(--border, #30363D); background: var(--surface-hover, #262C36); }

  @media (max-height: 800px) { width: 24px; height: 24px; }
  @media (max-width: 768px) { width: 24px; height: 24px; }
`;

export const OhlcBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--bg-tertiary, #1C2128);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  gap: 0.75rem;
  flex-wrap: wrap;
  min-height: 36px;
  flex-shrink: 0;

  @media (max-height: 800px) { padding: 2px 8px; min-height: 28px; }
  @media (max-width: 768px) { padding: 2px 6px; gap: 4px; flex-direction: row; justify-content: space-between; flex-wrap: nowrap; min-height: 24px; }
`;

export const SymbolInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) { gap: 4px; }
`;

export const SymbolName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);

  @media (max-height: 800px) { font-size: 12px; }
  @media (max-width: 768px) { font-size: 11px; }
`;

export const CurrentPrice = styled.span`
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);

  @media (max-height: 800px) { font-size: 12px; }
  @media (max-width: 768px) { font-size: 11px; }
`;

interface PriceChangeProps {
  $up: boolean;
}

export const PriceChange = styled.span<PriceChangeProps>`
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 0.25rem;
  color: ${({ $up }) => $up ? 'var(--color-positive, #3FB950)' : 'var(--color-negative, #F85149)'};
  background: ${({ $up }) => $up ? 'rgba(63, 185, 80, 0.15)' : 'rgba(248, 81, 73, 0.15)'};

  @media (max-width: 768px) { font-size: 10px; padding: 1px 4px; }
`;

export const OhlcData = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

  @media (max-width: 1200px) { display: none; }
  @media (max-width: 768px) { display: none; }
`;

interface OhlcItemProps {
  $trend?: 'up' | 'down';
}

export const OhlcItem = styled.div<OhlcItemProps>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: ${({ $trend }) => {
    switch ($trend) {
      case 'up': return 'var(--color-positive, #3FB950)';
      case 'down': return 'var(--color-negative, #F85149)';
      default: return 'var(--text-secondary, #9AA5B1)';
    }
  }};

  label { color: var(--text-tertiary, #6E7681); font-weight: 500; min-width: 20px; }

  @media (max-height: 800px) { font-size: 10px; }
  @media (max-width: 768px) { font-size: 9px; }
`;

export const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0.75rem;
  font-size: 10px;
  font-family: 'IBM Plex Mono', monospace;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  flex-shrink: 0;

  span { display: flex; align-items: center; gap: 2px; white-space: nowrap; }

  @media (max-height: 800px) { padding: 2px 8px; font-size: 9px; }
  @media (max-height: 700px) { display: none; }
  @media (max-width: 768px) { padding: 1px 6px; font-size: 8px; }
`;

export const MainChart = styled.div<ContainerProps>`
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 240px;

  /* Hide TradingView watermark */
  #tv-attr-logo, [id^="tv-attr"], a[href*="tradingview"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
  }

  ${({ $fullscreen }) => $fullscreen && css`min-height: calc(100vh - 200px);`}

  @media (max-height: 900px) { min-height: 150px; }
  @media (max-height: 700px) { min-height: 120px; }
  @media (max-width: 768px) { min-height: 120px; }
`;

export const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: var(--bg-secondary, #161B22);
  z-index: 10;

  span { font-size: 0.75rem; color: var(--text-secondary, #9AA5B1); }
`;

export const Spinner = styled.div`
  width: 32px; height: 32px;
  border: 3px solid var(--border-subtle, #262C36);
  border-top-color: var(--accent, #58A6FF);
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

export const ErrorOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: var(--bg-secondary, #161B22);
  z-index: 10;

  svg { color: var(--color-error, #F85149); }
  span { font-size: 0.75rem; color: var(--text-secondary, #9AA5B1); }
`;

export const RetryBtn = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--accent, #58A6FF);
  border: none;
  border-radius: 0.375rem;
  color: white;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover { filter: brightness(1.1); }
`;
