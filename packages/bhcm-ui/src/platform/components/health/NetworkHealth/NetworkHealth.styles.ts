import styled, { css, keyframes } from 'styled-components';

/* NetworkHealth - Network diagnostics panel */

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideInRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

export const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  animation: ${fadeIn} 0.2s ease-out;
`;

export const Drawer = styled.div`
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: 480px;
  max-width: 90vw;
  background: var(--bg-secondary, #161B22);
  border-left: 1px solid var(--border, #30363D);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 201;
  display: flex;
  flex-direction: column;
  animation: ${slideInRight} 0.3s ease-out;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

export const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  margin: 0;
`;

export const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  background: transparent;
  border: none;
  color: var(--text-secondary, #9AA5B1);
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--surface-hover, #262C36);
    color: var(--text-primary, #E6EDF3);
  }
`;

export const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

export const Section = styled.div`
  margin-bottom: 1.25rem;
`;

export const SectionTitle = styled.h4`
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.75rem;
`;

export const ChecksGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const CheckItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.25rem;
  font-size: 0.6875rem;
`;

interface CheckIconsProps {
  $passed: boolean;
}

export const CheckIcons = styled.span<CheckIconsProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px; height: 18px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: bold;
  flex-shrink: 0;
  background: ${({ $passed }) => $passed ? 'var(--color-success, #3FB950)' : 'var(--color-error, #F85149)'};
  color: white;
`;

export const CheckLabel = styled.span`
  flex: 1;
  color: var(--text-secondary, #9AA5B1);
`;

export const CheckStatus = styled.span<CheckIconsProps>`
  font-weight: 500;
  color: ${({ $passed }) => $passed ? 'var(--color-success, #3FB950)' : 'var(--color-error, #F85149)'};
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.25rem;
`;

export const StatLabel = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
`;

export const StatValue = styled.span`
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  font-variant-numeric: tabular-nums;
`;

export const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.25rem;
  max-height: 300px;
  overflow-y: auto;
`;

interface TimelineEventProps {
  $type: 'good' | 'bad' | 'warning' | 'default';
}

export const TimelineEvent = styled.div<TimelineEventProps>`
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem;
  border-left: 2px solid ${({ $type }) => {
    switch ($type) {
      case 'good': return 'var(--color-success, #3FB950)';
      case 'bad': return 'var(--color-error, #F85149)';
      case 'warning': return 'var(--color-warning, #D29922)';
      default: return 'var(--border-subtle, #262C36)';
    }
  }};
  padding-left: 0.75rem;
`;

export const TimelineTime = styled.div`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
  font-family: 'IBM Plex Mono', monospace;
  min-width: 80px;
`;

export const TimelineIcons = styled.div<TimelineEventProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px; height: 24px;
  flex-shrink: 0;
  color: ${({ $type }) => {
    switch ($type) {
      case 'good': return 'var(--color-success, #3FB950)';
      case 'bad': return 'var(--color-error, #F85149)';
      case 'warning': return 'var(--color-warning, #D29922)';
      default: return 'var(--text-secondary, #9AA5B1)';
    }
  }};
`;

export const TimelineContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const TimelineLevel = styled.span`
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  text-transform: uppercase;
`;

export const TimelineReason = styled.span`
  font-size: 0.6875rem;
  color: var(--text-secondary, #9AA5B1);
`;

export const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle, #262C36);
`;

export const ActionBtn = styled.button`
  flex: 1;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--bg-tertiary, #1C2128);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;
  color: var(--text-primary, #E6EDF3);
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--surface-hover, #262C36);
    border-color: var(--text-secondary, #9AA5B1);
  }
`;

export const ScoreGauge = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.375rem;
  margin-bottom: 0.75rem;
`;

interface ScoreCircleProps {
  $level: 'excellent' | 'good' | 'fair' | 'poor';
}

export const ScoreCircle = styled.div<ScoreCircleProps>`
  width: 80px; height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 3px solid;
  ${({ $level }) => {
    switch ($level) {
      case 'excellent': return css`border-color: var(--color-success, #3FB950); background: rgba(63, 185, 80, 0.1);`;
      case 'good': return css`border-color: #3b82f6; background: rgba(59, 130, 246, 0.1);`;
      case 'fair': return css`border-color: var(--color-warning, #D29922); background: rgba(210, 153, 34, 0.1);`;
      case 'poor': return css`border-color: var(--color-error, #F85149); background: rgba(248, 81, 73, 0.1);`;
    }
  }}
`;

export const ScoreValue = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
  line-height: 1;
`;

export const ScoreMax = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
`;

export const ScoreInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const ScoreLabel = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

interface ScoreTrendProps {
  $trend: 'improving' | 'stable' | 'degrading';
}

export const ScoreTrend = styled.span<ScoreTrendProps>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: ${({ $trend }) => {
    switch ($trend) {
      case 'improving': return 'var(--color-success, #3FB950)';
      case 'degrading': return 'var(--color-error, #F85149)';
      default: return 'var(--text-tertiary, #6E7681)';
    }
  }};
`;

export const ScoreBreakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const ScoreItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const ScoreItemLabel = styled.span`
  font-size: 0.6875rem;
  color: var(--text-secondary, #9AA5B1);
  min-width: 80px;
`;

export const ScoreBar = styled.div`
  flex: 1;
  height: 6px;
  background: var(--bg-primary, #0D1117);
  border-radius: 3px;
  overflow: hidden;
`;

interface ScoreBarFillProps {
  $width: number;
}

export const ScoreBarFill = styled.div<ScoreBarFillProps>`
  height: 100%;
  background: linear-gradient(90deg, var(--color-success, #3FB950), #3b82f6);
  border-radius: 3px;
  transition: width 0.3s ease;
  width: ${({ $width }) => $width}%;
`;

export const ScoreItemValue = styled.span`
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--text-tertiary, #6E7681);
  min-width: 40px;
  text-align: right;
  font-family: 'IBM Plex Mono', monospace;
`;

export const EmptyTimeline = styled.div`
  text-align: center;
  padding: 1rem;
  color: var(--text-tertiary, #6E7681);
  font-size: 0.75rem;
`;
