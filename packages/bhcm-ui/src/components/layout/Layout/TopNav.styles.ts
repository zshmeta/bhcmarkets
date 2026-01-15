import styled, { css, keyframes } from 'styled-components';
import { NavLink } from 'react-router-dom';

/* TopNav - Main navigation links */

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  height: 100%;
`;

interface NavLinkStyledProps {
  $active?: boolean;
}

export const StyledNavLink = styled(NavLink)<NavLinkStyledProps>`
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary, #9AA5B1);
  text-decoration: none;
  border-radius: 0.25rem;
  transition: all 0.15s ease-out;
  position: relative;

  &:hover {
    color: var(--text-primary, #E6EDF3);
    background: var(--surface-hover, #262C36);
  }

  &.active {
    color: var(--accent, #58A6FF);
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0.75rem;
      right: 0.75rem;
      height: 2px;
      background: var(--accent, #58A6FF);
      border-radius: 1px;
    }
  }
`;
