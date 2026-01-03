import { Routes, Route, Navigate } from "react-router-dom";
import { TradingWorkspace } from "../features/workspace/TradingWorkspace";
import { AdminPage } from "../features/admin/AdminPage";
import { DashboardShell } from "./layout/DashboardShell";
import { DashboardOverviewPage } from "../features/overview/DashboardOverviewPage";
import { PortfolioPage } from "../features/portfolio/PortfolioPage";
import { MarketsPage } from "../features/markets/MarketsPage";
import { OrdersPage } from "../features/orders/OrdersPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { UiGalleryPage } from "../features/ui-gallery/UiGalleryPage";
import { MarketDataProvider } from "../context/MarketDataContext";

export const App = () => (
  <Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/auth/*" element={<AuthPage />} />
    <Route path="/app" element={
      <RequireAuth>
        <MarketDataProvider>
          <DashboardShell />
        </MarketDataProvider>
      </RequireAuth>
    }>
      <Route index element={<DashboardOverviewPage />} />
      <Route path="portfolio" element={<PortfolioPage />} />
      <Route path="markets" element={<MarketsPage />} />
      <Route path="trade" element={<TradingWorkspace />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
    <Route path="/admin" element={<AdminPage />} />
    <Route path="/ui" element={<UiGalleryPage />} />
    <Route path="/" element={<Navigate to="/auth" replace />} />
    <Route path="*" element={<Navigate to="/auth" replace />} />
  </Routes>
);

export default App;
