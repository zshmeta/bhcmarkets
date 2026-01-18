import styled from 'styled-components';

/* MobileHeader - Compact navigation with blur background */

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  min-height: 48px;
  padding: 0 1rem;
  padding-top: env(safe-area-inset-top);
  background: rgba(22, 27, 34, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
`;

export const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 80px;
`;

export const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 80px;
  justify-content: flex-end;
`;

export const LogoLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
`;

export const LogoIcons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(88, 166, 255, 0.1);
  border-radius: 0.375rem;
  color: var(--accent, #58A6FF);
`;

export const BackBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: var(--text-primary, #E6EDF3);
  cursor: pointer;
  border-radius: 0.375rem;
  margin-left: -6px;

  &:active {
    background: var(--surface-hover, #262C36);
  }
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
  text-align: center;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
`;
