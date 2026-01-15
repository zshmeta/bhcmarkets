import styled, { css } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-primary           → var(--bg-primary, #0D1117)
 * --text-primary/secondary → #E6EDF3 / #9AA5B1
 * --accent               → #3B82F6
 * --accent-alpha         → rgba(59, 130, 246, 0.15)
 * --border               → var(--border, #30363D)
 * --color-price-up       → #3FB950
 * --space-2/3/4/6        → 0.5/0.75/1/1.5rem
 * --radius-sm            → 0.25rem
 */

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem 1.5rem;
  width: 100%;
  gap: 1rem;
`;

/* ═══════════════════════════════════════════════════════════
 * HEADER
 * ═══════════════════════════════════════════════════════════
 */
export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
  margin: 0;
`;

export const SimulatedBadge = styled.span`
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  background: rgba(59, 130, 246, 0.15);
  color: #3B82F6;
  border: 1px solid #3B82F6;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: help;
`;

export const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

/* ═══════════════════════════════════════════════════════════
 * TABS
 * ═══════════════════════════════════════════════════════════
 */
export const TabsContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--border, #30363D);
  margin-top: 0.5rem;
`;

interface TabProps {
    $active?: boolean;
}

export const Tab = styled.button<TabProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary, #9AA5B1);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s ease-out;
  margin-bottom: -1px;

  &:hover {
    color: var(--text-primary, #E6EDF3);
    background: var(--surface-hover, #262C36);
  }

  ${({ $active }) =>
        $active &&
        css`
      color: #3B82F6;
      border-bottom-color: #3B82F6;
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * BUTTONS
 * ═══════════════════════════════════════════════════════════
 */
export const DepositButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
  height: 36px;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.1s ease-out;
  background: var(--color-price-up, #3FB950);
  color: white;
  border: none;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
`;

export const WithdrawButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
  height: 36px;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.1s ease-out;
  background: var(--surface, #1C2128);
  color: var(--text-primary, #E6EDF3);
  border: 1px solid var(--border, #30363D);

  &:hover {
    background: var(--surface-hover, #262C36);
    border-color: #3B82F6;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * CONTENT AREAS
 * ═══════════════════════════════════════════════════════════
 */
export const MainContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

export const OnboardingWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Content = styled.div`
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
  padding-top: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const FullWidthColumn = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
`;

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
`;

export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
`;
