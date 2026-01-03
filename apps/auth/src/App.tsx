/**
 * Auth App.
 *
 * Main application component for the auth frontend.
 * Provides routing and authentication state management.
 */

import { Providers } from "./app/providers";
import { Router } from "./app/router";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { useAuth } from "./features/auth/auth.hooks";
import "./App.css";

/**
 * Home page (protected).
 */
function HomePage() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    window.location.hash = "/login";
    return null;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "50px auto", padding: "20px" }}>
      <h1>Welcome, {user.email}!</h1>

      <div style={{
        padding: "20px",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
        marginBottom: "20px"
      }}>
        <h2>User Information</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Status:</strong> {user.status}</p>
        <p><strong>ID:</strong> {user.id}</p>
      </div>

      <button
        onClick={logout}
        style={{
          padding: "10px 20px",
          backgroundColor: "#c00",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Logout
      </button>
    </div>
  );
}

/**
 * Main App component.
 */
function App() {
  return (
    <Providers>
      <Router
        routes={[
          { path: "/", component: <HomePage /> },
          { path: "/login", component: <LoginPage /> },
          { path: "/register", component: <RegisterPage /> },
        ]}
        notFound={
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>404 - Page Not Found</h1>
            <a href="#/login">Go to Login</a>
          </div>
        }
      />
    </Providers>
  );
}

export default App;
