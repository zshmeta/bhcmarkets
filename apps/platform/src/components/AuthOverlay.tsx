import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthStore } from '@repo/sdk';
import { Icons } from '@repo/bhcm-ui/core';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  padding: 24px;
`;

const Card = styled.div`
  width: min(520px, 100%);
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  letter-spacing: 0.02em;
  font-size: 14px;
  color: var(--text-primary);
`;

const Subtitle = styled.div`
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.4;
`;

const Actions = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const PrimaryButton = styled.button`
  border: 1px solid rgba(88, 166, 255, 0.35);
  background: linear-gradient(135deg, rgba(88, 166, 255, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%);
  color: var(--text-primary);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover { 
    background: linear-gradient(135deg, rgba(88, 166, 255, 0.3) 0%, rgba(59, 130, 246, 0.25) 100%);
    border-color: rgba(88, 166, 255, 0.5);
  }
`;

const SecondaryButton = styled.button`
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  cursor: pointer;
  &:hover { color: var(--text-primary); border-color: var(--border); }
`;

export const AuthOverlay = () => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);

  const shouldShow = useMemo(() => {
    // Allow everything once authenticated; otherwise block all routes.
    // (We keep it app-side because backend/auth is not ready yet.)
    return !isAuthenticated;
  }, [isAuthenticated]);

  if (!shouldShow) return null;

  return (
    <Overlay role="dialog" aria-modal="true">
      <Card className="card">
        <div className="card-header">
          SIGN IN REQUIRED
        </div>
        <div className="card-body">
          <Title>
            <Icons name="lock" size="sm" />
            Trading session locked
          </Title>
          <Subtitle>
            Backend auth is not ready yet. Use demo sign-in to explore the UI. Current route: {location.pathname}
          </Subtitle>

          <Actions>
            <PrimaryButton onClick={() => login('demo', 'demo')}>
              <Icons name="key-round" size="sm" />
              Sign in (demo)
            </PrimaryButton>
            <SecondaryButton onClick={() => {
              localStorage.removeItem('bhcm.authenticated');
              window.location.reload();
            }}>
              Reset session
            </SecondaryButton>
          </Actions>
        </div>
      </Card>
    </Overlay>
  );
};
