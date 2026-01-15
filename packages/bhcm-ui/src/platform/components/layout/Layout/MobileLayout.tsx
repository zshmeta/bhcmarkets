import { Outlet, useLocation } from 'react-router-dom';
import { Nav } from '../Nav';
import { ToastContainer } from '../Toast';
import { Container, Main } from './MobileLayout.styles';

/**
 * MOBILE LAYOUT - Full-screen shell with bottom navigation
 */

const MobileLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  return (
    <Container>
      <Main>
        <Outlet />
      </Main>

      {!isAuthPage && <Nav />}

      <ToastContainer />
    </Container>
  );
}

export default MobileLayout;
