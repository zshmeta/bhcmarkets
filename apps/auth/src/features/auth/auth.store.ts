/**
 * Auth Store (React Context).
 * 
 * Manages authentication state using React Context API.
 * Provides auth state and methods to components via hooks.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi } from "./auth.api.js";
import { tokenStorage } from "../../lib/storage.js";
import type { User, AuthResult, LoginInput, RegisterInput } from "./auth.types.js";

/**
 * Auth state.
 */
export interface AuthState {
  /** Current user (null if not authenticated) */
  user: User | null;
  
  /** Whether the auth state is being initialized */
  loading: boolean;
  
  /** Authentication error (if any) */
  error: string | null;
  
  /** Whether user is authenticated */
  isAuthenticated: boolean;
}

/**
 * Auth actions.
 */
export interface AuthActions {
  /** Login with email and password */
  login: (input: LoginInput) => Promise<void>;
  
  /** Register new user */
  register: (input: RegisterInput) => Promise<void>;
  
  /** Logout current session */
  logout: () => Promise<void>;
  
  /** Logout all sessions */
  logoutAll: () => Promise<void>;
  
  /** Refresh access token */
  refreshToken: () => Promise<void>;
  
  /** Clear error state */
  clearError: () => void;
}

/**
 * Auth context value.
 */
export interface AuthContextValue extends AuthState, AuthActions {}

/**
 * Auth context.
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth provider props.
 */
export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth provider component.
 * Wraps the app and provides authentication state and methods.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  /**
   * Initialize auth state from stored tokens.
   */
  useEffect(() => {
    async function initializeAuth() {
      try {
        // Check if we have tokens
        if (!tokenStorage.hasTokens()) {
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }

        // Try to refresh the session
        await refreshToken();
      } catch (error) {
        // Failed to restore session, clear tokens
        tokenStorage.clearTokens();
        setState({
          user: null,
          loading: false,
          error: null,
          isAuthenticated: false,
        });
      }
    }

    initializeAuth();
  }, []);

  /**
   * Login user.
   */
  const login = useCallback(async (input: LoginInput) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await authApi.login(input);
      
      // Store tokens
      tokenStorage.setAccessToken(result.tokens.accessToken);
      tokenStorage.setRefreshToken(result.tokens.refreshToken);

      // Update state
      setState({
        user: result.user,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
    } catch (error) {
      setState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : "Login failed",
        isAuthenticated: false,
      });
      throw error;
    }
  }, []);

  /**
   * Register new user.
   */
  const register = useCallback(async (input: RegisterInput) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await authApi.register(input);
      
      // Check if session was issued
      if ("tokens" in result) {
        // Store tokens
        tokenStorage.setAccessToken(result.tokens.accessToken);
        tokenStorage.setRefreshToken(result.tokens.refreshToken);

        // Update state
        setState({
          user: result.user,
          loading: false,
          error: null,
          isAuthenticated: true,
        });
      } else {
        // No session issued, just created user
        setState({
          user: result.user,
          loading: false,
          error: null,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      setState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : "Registration failed",
        isAuthenticated: false,
      });
      throw error;
    }
  }, []);

  /**
   * Logout current session.
   */
  const logout = useCallback(async () => {
    try {
      const accessToken = tokenStorage.getAccessToken();
      if (accessToken) {
        // Parse session ID from token
        const user = await authApi.getCurrentUser(accessToken);
        if (user.id) {
          await authApi.logout({ sessionId: user.id });
        }
      }
    } catch (error) {
      // Ignore logout errors
      console.error("Logout error:", error);
    } finally {
      // Clear tokens and state
      tokenStorage.clearTokens();
      setState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    }
  }, []);

  /**
   * Logout all sessions.
   */
  const logoutAll = useCallback(async () => {
    try {
      const accessToken = tokenStorage.getAccessToken();
      if (accessToken && state.user) {
        await authApi.logoutAll({ userId: state.user.id });
      }
    } catch (error) {
      console.error("Logout all error:", error);
    } finally {
      // Clear tokens and state
      tokenStorage.clearTokens();
      setState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    }
  }, [state.user]);

  /**
   * Refresh access token.
   */
  const refreshToken = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const result = await authApi.refresh({ refreshToken });
      
      // Store new tokens
      tokenStorage.setAccessToken(result.tokens.accessToken);
      tokenStorage.setRefreshToken(result.tokens.refreshToken);

      // Update state
      setState({
        user: result.user,
        loading: false,
        error: null,
        isAuthenticated: true,
      });
    } catch (error) {
      // Refresh failed, clear tokens
      tokenStorage.clearTokens();
      setState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : "Session expired",
        isAuthenticated: false,
      });
      throw error;
    }
  }, []);

  /**
   * Clear error state.
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    logoutAll,
    refreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Use auth context hook.
 * 
 * @returns Auth context value
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
