import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdaptiveLayout } from '@repo/bhcm-ui/layout';
import { TradePage } from './pages/TradePage';
import { MarketsPage } from './pages/MarketsPage';
import { WalletPage } from './pages/WalletPage';
import { AssetDetailPage } from './pages/AssetDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
// import { AuthOverlay } from './components/AuthOverlay';

/**
 * BHC Markets - Trading Platform
 *
 * Main application entry point with routing.
 * Auth is temporarily bypassed - will integrate apps/auth later.
 */
export function App() {
  return (
    <BrowserRouter>
      {/* <AuthOverlay /> */}
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        
        <Route element={<AdaptiveLayout />}>
          <Route path="/trade" element={<TradePage />} />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/assets" element={<AssetDetailPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<Navigate to="/trade" replace />} />
          <Route path="*" element={<Navigate to="/trade" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;