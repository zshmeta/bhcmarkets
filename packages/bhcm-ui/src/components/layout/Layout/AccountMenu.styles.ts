import styled, { css, keyframes } from 'styled-components';

/**
 * AccountMenu - User account dropdown in the header
 * Token mappings use CSS variables with fallbacks
 */

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const Container = styled.div`
  position: relative;
  font-family: 'Inter', system-ui, sans-serif;
`;

interface TriggerProps {
  $active?: boolean;
}

export const Trigger = styled.button<TriggerProps>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0 0.25rem;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  color: var(--text-primary, #E6EDF3);
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover, ${({ $active }) => $active && css`
    background: var(--surface-hover, #262C36);
  `}
`;

export const Avatar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(88, 166, 255, 0.1);
  color: var(--accent, #58A6FF);
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
`;

export const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const LargeAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface-tertiary, #1C2128);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #9AA5B1);
  overflow: hidden;
  flex-shrink: 0;
`;

interface ChevronProps {
  $rotated?: boolean;
}

export const Chevron = styled.span<ChevronProps>`
  color: var(--text-tertiary, #6E7681);
  transition: transform 0.1s ease-out;
  margin-left: 0.25rem;
  display: flex;
  
  ${({ $rotated }) => $rotated && css`
    transform: rotate(180deg);
  `}
`;

export const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 0;
  width: 200px;
  background: var(--card-bg, #161B22);
  border: 1px solid var(--card-border, #30363D);
  border-radius: 0.375rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  overflow: hidden;
  animation: ${slideIn} 0.2s ease-out;
`;

export const DropdownHeader = styled.div`
  padding: 0.75rem;
  background: var(--surface-secondary, #161B22);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const ProfileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const ProfileText = styled.div`
  display: flex;
  flex-direction: column;
`;

export const ProfileName = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
`;

export const ProfileId = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
  font-family: 'IBM Plex Mono', monospace;
`;

export const MenuItems = styled.div`
  padding: 0.25rem;
`;

export const MenuSection = styled.div`
  padding: 0.5rem;
`;

export const SectionLabel = styled.span`
  font-size: 9px;
  font-weight: 800;
  color: var(--text-muted, #484F58);
  letter-spacing: 0.1em;
  margin-bottom: 0.25rem;
  display: block;
`;

interface MenuItemProps {
  $logout?: boolean;
}

export const MenuItem = styled.button<MenuItemProps>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  color: var(--text-secondary, #9AA5B1);
  font-size: 0.75rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.1s ease-out;
  border-radius: 0.125rem;
  text-decoration: none;

  &:hover {
    background: var(--surface-hover, #262C36);
    color: var(--text-primary, #E6EDF3);
  }

  ${({ $logout }) => $logout && css`
    color: var(--color-error, #F85149);
    
    &:hover {
      background: rgba(248, 81, 73, 0.1);
      color: var(--color-error, #F85149);
    }
  `}
`;

export const MenuLink = styled(MenuItem).attrs({ as: 'a' })``;

export const Divider = styled.div`
  height: 1px;
  background: var(--border-subtle, #262C36);
  margin: 0.25rem;
`;
