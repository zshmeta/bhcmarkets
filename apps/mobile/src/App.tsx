import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, memo } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';

// Import local mobile trade page
import { MobileTradePage } from './pages/MobileTradePage';

/**
 * BHC MARKETS - Enterprise Mobile Trading Platform
 */

// Global styles - defined outside component to prevent HMR full reload
const GlobalStyles = createGlobalStyle`
  :root {
    --bg-primary: #0D1117;
    --bg-secondary: #161B22;
    --bg-tertiary: #1C2128;
    --bg-elevated: #21262D;
    --text-primary: #E6EDF3;
    --text-secondary: #9AA5B1;
    --text-tertiary: #6E7681;
    --text-muted: #484F58;
    --color-positive: #3FB950;
    --color-negative: #F85149;
    --color-accent: #3B82F6;
    --color-warning: #D29922;
    --border-subtle: #30363D;
    --border-muted: #21262D;
    --surface-hover: #262C36;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(180deg, #0a0a0f 0%, #0D1117 100%);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #root {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tabular-nums {
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
`;

// Phone shell animation
const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 10px #1a1a1a, 0 0 0 12px #252525, 0 20px 60px rgba(0,0,0,0.5); }
  50% { box-shadow: 0 0 0 10px #1a1a1a, 0 0 0 12px #252525, 0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(88, 166, 255, 0.08); }
`;

const PhoneShell = styled.div`
  max-width: 430px;
  width: 100%;
  max-height: 932px;
  height: 100vh;
  position: relative;
  background: var(--bg-primary);
  border-radius: 44px;
  overflow: hidden;
  animation: ${pulseGlow} 4s ease-in-out infinite;

  @media (max-width: 480px) {
    max-width: 100%;
    max-height: 100%;
    border-radius: 0;
    box-shadow: none;
    animation: none;
  }
`;

const DynamicIsland = styled.div`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 34px;
  background: #000;
  border-radius: 20px;
  z-index: 1000;

  @media (max-width: 480px) { display: none; }
`;

const StatusBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 24px 0;
  z-index: 999;
  pointer-events: none;

  @media (max-width: 480px) { display: none; }
`;

const HomeIndicator = styled.div`
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 4px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 2px;
  z-index: 1000;

  @media (max-width: 480px) { display: none; }
`;

const AppContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding-top: 50px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 480px) { padding-top: 0; }
`;

const PageContainer = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`;

// Loading spinner
const spin = keyframes`to { transform: rotate(360deg); }`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--bg-primary);
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

// Placeholder pages
const PlaceholderPage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  color: var(--text-secondary);
  text-align: center;
  padding: 2rem;
`;

const MarketsPage = () => <PlaceholderPage><h2>📊 Markets</h2><p>Real-time market data coming soon</p></PlaceholderPage>;
const OrdersPage = () => <PlaceholderPage><h2>📋 Orders</h2><p>Order management coming soon</p></PlaceholderPage>;
const WalletPage = () => <PlaceholderPage><h2>💰 Wallet</h2><p>Wallet functionality coming soon</p></PlaceholderPage>;
const AccountPage = () => <PlaceholderPage><h2>👤 Account</h2><p>Account settings coming soon</p></PlaceholderPage>;

// Bottom tab navigation
const TabBar = styled.nav`
  display: flex;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-subtle);
  padding: 8px 0 24px;
  
  @media (max-width: 480px) {
    padding-bottom: env(safe-area-inset-bottom, 8px);
  }
`;

const TabItem = styled.a<{ $active?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  text-decoration: none;
  color: ${({ $active }) => $active ? 'var(--color-accent)' : 'var(--text-tertiary)'};
  font-size: 10px;
  font-weight: 500;
  transition: color 0.2s;
  
  &:active { opacity: 0.7; }
`;

const TabIcon = styled.span`
  font-size: 20px;
`;

// Navigation - memoized to prevent unnecessary re-renders
const MobileNav = memo(() => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <TabBar>
      <TabItem href="/markets" $active={path === '/' || path === '/markets'}>
        <TabIcon>📊</TabIcon>Markets
      </TabItem>
      <TabItem href="/trade" $active={path === '/trade'}>
        <TabIcon>📈</TabIcon>Trade
      </TabItem>
      <TabItem href="/orders" $active={path === '/orders'}>
        <TabIcon>📋</TabIcon>Orders
      </TabItem>
      <TabItem href="/wallet" $active={path === '/wallet'}>
        <TabIcon>💰</TabIcon>Wallet
      </TabItem>
      <TabItem href="/account" $active={path === '/account'}>
        <TabIcon>👤</TabIcon>Account
      </TabItem>
    </TabBar>
  );
});

// Main content - memoized for HMR optimization
const AppContent = memo(() => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });

  return (
    <PhoneShell>
      <DynamicIsland />
      <StatusBar>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{timeStr}</span>
        <span style={{ fontSize: 12 }}>📶 📡 🔋</span>
      </StatusBar>

      <AppContainer>
        <PageContainer>
          <Suspense fallback={<LoadingContainer><Spinner /></LoadingContainer>}>
            <Routes>
              <Route path="/" element={<MarketsPage />} />
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/trade" element={<MobileTradePage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </PageContainer>

        <MobileNav />
      </AppContainer>

      <HomeIndicator />
    </PhoneShell>
  );
});

export default function App() {
  return (
    <>
      <GlobalStyles />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </>
  );
}
