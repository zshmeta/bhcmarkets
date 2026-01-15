import styled, { css, keyframes } from 'styled-components';
import { NavLink } from 'react-router-dom';

/**
 * Token Reference (from tokens.css):
 * --bg-secondary         → var(--bg-secondary, #161B22)
 * --border-subtle        → var(--border-subtle, #262C36)
 * --surface-hover        → var(--bg-hover, #262C36)
 * --accent               → #3B82F6
 * --accent-alpha         → rgba(59, 130, 246, 0.15)
 * --text-tertiary        → var(--text-tertiary, #6E7681)
 * --z-sticky             → 100
 * --space-1              → 0.25rem
 * --transition-fast      → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * ANIMATIONS
 * ═══════════════════════════════════════════════════════════
 */
const pulseGlow = keyframes`
  0%, 100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.15;
    transform: translate(-50%, -50%) scale(1.2);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * NAV CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Fixed bottom navigation bar. Hidden on desktop, visible on mobile.
 */
export const NavContainer = styled.nav`
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(48px + env(safe-area-inset-bottom));
  background: var(--bg-secondary, #161B22);
  border-top: 1px solid var(--border-subtle, #262C36);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);

  @media (max-width: 768px) {
    display: flex;
    align-items: flex-start;
    justify-content: space-around;
    padding-top: 2px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    height: calc(40px + env(safe-area-inset-bottom));
  }
`;

/* ═══════════════════════════════════════════════════════════
 * NAV ITEM
 * ═══════════════════════════════════════════════════════════
 */
interface NavItemProps {
  $isCenter?: boolean;
}

export const NavItem = styled(NavLink) <NavItemProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: ${({ $isCenter }) => ($isCenter ? '1.2' : '1')};
  height: 44px;
  padding: 2px 0.25rem;
  text-decoration: none;
  color: var(--text-tertiary, #6E7681);
  transition: color 0.1s ease-out;
  gap: 1px;
  min-width: 48px;
  -webkit-tap-highlight-color: transparent;
  position: relative;

  &:active:not([data-center='true']) {
    background: var(--bg-hover, #262C36);
  }

  &.active:not([data-center='true']) {
    color: #3B82F6;
  }

  &.active:not([data-center='true'])::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 32px;
    height: 32px;
    background: rgba(59, 130, 246, 0.15);
    border-radius: 50%;
    opacity: 0.3;
    animation: ${pulseGlow} 2s ease-in-out infinite;
  }

  &.active .Icons {
    transform: scale(1.15);
    filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.15));
  }

  @media (max-width: 360px) {
    min-width: 44px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    height: 36px;
    flex-direction: row;
    gap: 4px;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * Icons STYLING
 * ═══════════════════════════════════════════════════════════
 */
export const IconsWrapper = styled.span`
  width: 20px;
  height: 20px;
  transition: transform 0.1s ease-out, color 0.1s ease-out;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* ═══════════════════════════════════════════════════════════
 * LABEL
 * ═══════════════════════════════════════════════════════════
 */
export const Label = styled.span`
  font-size: 9px;
  font-weight: 500;
  line-height: 1;
  text-align: center;
  white-space: nowrap;

  @media (max-width: 360px) {
    font-size: 8px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    display: none;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * CENTER BUTTON (Trade action)
 * ═══════════════════════════════════════════════════════════
 */
export const CenterButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #3B82F6 0%, #1a365d 100%);
  border-radius: 50%;
  margin-top: -14px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  transition: transform 0.1s ease-out, box-shadow 0.1s ease-out;

  ${NavItem}.active &,
  ${NavItem}:active & {
    transform: scale(0.95);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 360px) {
    width: 40px;
    height: 40px;
    margin-top: -12px;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    width: 36px;
    height: 36px;
    margin-top: -10px;
  }
`;

export const CenterIcons = styled.span`
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const CenterLabel = styled(Label)`
  margin-top: -1px;
  color: #3B82F6;
  font-weight: 700;
  font-size: 10px;
`;
