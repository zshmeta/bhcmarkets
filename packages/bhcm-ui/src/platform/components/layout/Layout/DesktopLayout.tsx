import { Outlet, Link, useLocation } from 'react-router-dom';
import { NetworkStatus } from '../NetworkStatus';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';
import { ToastContainer } from '../Toast';
import { HelpFAQ } from '../HelpFAQ';
import { NotifBell } from '../NotifBell';
import { TopNav } from './TopNav';
import { AssetSnapshot } from './AssetSnapshot';
import { AccountMenu } from './AccountMenu';
import { Icons } from '../Icons';
import { useI18n } from '../../i18n';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useAuthStore } from '@repo/sdk';
import {
  Logo,
  LogoIcons,
  Title,
  Actions,
  AccountWrapper,
  SettingsBtn,
  Main,
  Footer,
} from './DesktopLayout.styles';

/**
 * DESKTOP LAYOUT
 * Main shell for desktop view with header, footer, and content area.
 */

const DesktopLayout = () => {
  const { t } = useI18n();
  const location = useLocation();
  const { isAuthenticated, loginWithRedirect } = useAuthStore();

  const showNetworkStatus =
    (location.pathname === '/trade' || location.pathname === '/') && isAuthenticated;

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 't',
      action: () => {
        const root = document.documentElement;
        const currentTheme = root.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
      },
      description: 'Toggle theme',
    },
  ]);

  return (
    <div className="app-container">
      {showNetworkStatus && <NetworkStatus />}

      <header className="app-header">
        <Logo>
          <LogoIcons>
            <Icons name="trending-up" size="lg" strokeWidth={2.5} />
          </LogoIcons>
          <Title>{t.header.title}</Title>
        </Logo>

        <TopNav />

        <Actions>
          <AssetSnapshot />
          <SettingsBtn as={Link} to="/settings" title={t.settings?.title || 'Settings'}>
            <Icons name="settings" size="md" />
          </SettingsBtn>
          <HelpFAQ />
          <NotifBell />
          <LanguageToggle />
          <ThemeToggle />

          {isAuthenticated ? (
            <AccountWrapper>
              <AccountMenu />
            </AccountWrapper>
          ) : (
            <button
              onClick={loginWithRedirect}
              style={{
                background: '#58A6FF',
                color: '#fff',
                border: 'none',
                padding: '0.375rem 0.75rem',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.75rem',
                marginLeft: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              Sign In
            </button>
          )}
        </Actions>
      </header>

      <Main>
        <Outlet />
      </Main>

      <Footer />

      <ToastContainer />
    </div>
  );
}

export default DesktopLayout;
