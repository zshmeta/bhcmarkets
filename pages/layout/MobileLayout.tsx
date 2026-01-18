import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from '../../components/DONE/BottomNav';
import { ToastContainer } from '../../components/DONE/Toast';
import { Container, Main } from './MobileLayout.styles';

/**
 * MOBILE LAYOUT - Full-screen shell with bottom navigation
 */

export function MobileLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  return (
    <Container>
      <Main>
        <Outlet />
      </Main>

      {!isAuthPage && <BottomNav />}

      <ToastContainer />
    </Container>
  );
}
