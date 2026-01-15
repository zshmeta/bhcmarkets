import styled, { css, keyframes } from 'styled-components';

/* MobileDrawer - Bottom sheet drawer */

export const Overlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 200;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  visibility: ${({ $visible }) => $visible ? 'visible' : 'hidden'};
  transition: opacity 0.25s ease, visibility 0.25s ease;
`;

interface DrawerProps {
  $open: boolean;
  $height: 'auto' | 'half' | 'full';
}

export const Drawer = styled.div<DrawerProps>`
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: var(--bg-secondary, #161B22);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  z-index: 201;
  transform: ${({ $open }) => $open ? 'translateY(0)' : 'translateY(100%)'};
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.25);
  padding-bottom: env(safe-area-inset-bottom);
  
  ${({ $height }) => {
    switch ($height) {
      case 'auto': return css`max-height: 90vh;`;
      case 'half': return css`height: 55vh; max-height: 55vh;`;
      case 'full': return css`height: calc(100vh - 48px); max-height: calc(100vh - 48px);`;
    }
  }}
`;

export const HandleArea = styled.div`
  display: flex;
  justify-content: center;
  padding: 12px 0 8px;
  cursor: grab;

  &:active { cursor: grabbing; }
`;

export const Handle = styled.div`
  width: 36px;
  height: 4px;
  background: var(--text-tertiary, #6E7681);
  border-radius: 2px;
  opacity: 0.5;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem 0.75rem;
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

export const Title = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

export const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  background: transparent;
  border: none;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  border-radius: 9999px;
  transition: all 0.1s ease-out;

  &:active {
    background: var(--surface-hover, #262C36);
    color: var(--text-primary, #E6EDF3);
  }
`;

export const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
`;
