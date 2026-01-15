import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdaptiveLayout } from '@repo/bhcm-ui/layout';
import { TradePage } from './pages-modified/TradePage';
import { MarketsPage } from './pages-modified/MarketsPage';
import { WalletPage } from './pages-modified/WalletPage';
import { AssetDetailPage } from './pages-modified/AssetDetailPage';
import { OrdersPage } from './pages-modified/OrdersPage';
import { SettingsPage } from './pages-modified/SettingsPage';
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
