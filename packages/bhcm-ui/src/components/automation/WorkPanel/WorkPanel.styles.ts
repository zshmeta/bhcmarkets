import styled, { css, keyframes } from 'styled-components';

/* WorkPanel - Trading automation triggers management */

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
`;

interface ContainerProps {
  $embedded?: boolean;
}

export const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;

  ${({ $embedded }) => $embedded && css`
    height: 100%;
  `}
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  background: linear-gradient(135deg, rgba(88, 166, 255, 0.08) 0%, transparent 100%);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  user-select: none;
  transition: background 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, rgba(88, 166, 255, 0.12) 0%, transparent 100%);
  }
`;

export const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  letter-spacing: 0.02em;

  svg { color: var(--accent, #58A6FF); }
`;

interface HeaderIconsProps {
  $expanded?: boolean;
}

export const HeaderIcons = styled.span<HeaderIconsProps>`
  color: var(--text-tertiary, #6E7681);
  transition: transform 0.25s ease;
  display: flex;

  ${({ $expanded }) => $expanded && css`
    transform: rotate(180deg);
  `}
`;

interface ContentProps {
  $embedded?: boolean;
}

export const Content = styled.div<ContentProps>`
  display: flex;
  flex-direction: column;
  animation: ${slideDown} 0.2s ease-out;

  ${({ $embedded }) => $embedded && css`
    padding: 0;
    height: 100%;
  `}
`;

export const Tabs = styled.div`
  display: flex;
  gap: 2px;
  padding: 6px;
  background: var(--bg-tertiary, #1C2128);
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

interface TabProps {
  $active?: boolean;
}

export const Tab = styled.button<TabProps>`
  flex: 1;
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary, #6E7681);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--text-secondary, #9AA5B1);
    background: var(--surface-hover, rgba(255,255,255,0.05));
  }

  ${({ $active }) => $active && css`
    color: var(--accent, #58A6FF);
    background: rgba(88, 166, 255, 0.15);
  `}
`;

interface ScrollAreaProps {
  $embedded?: boolean;
}

export const ScrollArea = styled.div<ScrollAreaProps>`
  max-height: 240px;
  overflow-y: auto;
  background: var(--bg-primary, #0D1117);

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.06); border-radius: 2px; }
  &::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.12); }

  ${({ $embedded }) => $embedded && css`
    max-height: none;
    flex: 1;
  `}
`;
