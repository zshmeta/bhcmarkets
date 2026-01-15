import styled from 'styled-components';

/* MobileLayout - Full-height container with bottom nav support */

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh; /* Dynamic viewport height */
  max-height: 100dvh;
  background: var(--bg-primary, #0D1117);
  overflow: hidden;
`;

export const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  padding-bottom: calc(var(--bottom-nav-height, 56px) + env(safe-area-inset-bottom));

  > * {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
`;
