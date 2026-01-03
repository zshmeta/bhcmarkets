import { ThemeProvider } from "@repo/ui";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { ToastProvider } from "./components/ToastContext";
import { AuthPage } from "./components/AuthPage";
import { SuccessPage } from "./components/SuccessPage";
import { LoadingScreen } from "./components/LoadingScreen";

import './App.css'

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Initializing..." />;
  }

  return isAuthenticated ? <SuccessPage /> : <AuthPage />;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
