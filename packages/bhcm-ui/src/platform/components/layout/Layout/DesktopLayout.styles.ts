import styled from 'styled-components';

/* DesktopLayout - Top-level layout shell for desktop */

export const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary, #E6EDF3);
  margin-right: 1rem;
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

export const Title = styled.span`
  font-weight: 600;
  font-size: 1rem;
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
`;

export const AccountWrapper = styled.div`
  margin-left: 0.5rem;
`;

export const SettingsBtn = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.25rem;
  color: var(--text-secondary, #9AA5B1);
  cursor: pointer;
  transition: all 0.1s ease-out;
  text-decoration: none;

  &:hover {
    background: var(--bg-tertiary, #1C2128);
    border-color: var(--border, #30363D);
    color: var(--text-primary, #E6EDF3);
  }
`;

export const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const Footer = styled.footer`
  border-top: 1px solid var(--border-subtle, #262C36);
  background: var(--bg-secondary, #161B22);
  padding: 0.5rem 1rem;
  text-align: center;
`;
