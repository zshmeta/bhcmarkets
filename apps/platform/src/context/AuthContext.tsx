/**
 * Auth Context for Platform App
 *
 * Provides authentication state and methods for the trading platform.
 * Mirrors the auth app's AuthProvider pattern.
 */

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useReducer,
  type ReactNode,
} from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface User {
  id: string;
  email: string;
  role: "user" | "admin" | "support";
  status: "active" | "pending" | "suspended" | "deleted";
}

export interface Session {
  id: string;
  expiresAt: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

// =============================================================================
// STORAGE
// =============================================================================

const TOKEN_KEYS = {
  ACCESS: "bhc_access_token",
  REFRESH: "bhc_refresh_token",
} as const;

const tokenStorage = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEYS.ACCESS),
  getRefreshToken: () => localStorage.getItem(TOKEN_KEYS.REFRESH),
  setAccessToken: (token: string) => localStorage.setItem(TOKEN_KEYS.ACCESS, token),
  setRefreshToken: (token: string) => localStorage.setItem(TOKEN_KEYS.REFRESH, token),
  hasTokens: () => !!localStorage.getItem(TOKEN_KEYS.ACCESS) && !!localStorage.getItem(TOKEN_KEYS.REFRESH),
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
  },
};

// =============================================================================
// API
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// REDUCER
// =============================================================================

type AuthAction =
  | { type: "INIT_START" }
  | { type: "INIT_SUCCESS"; payload: { user: User | null; session: Session | null } }
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; session: Session } }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "INIT_START":
      return { ...state, loading: true };
    case "INIT_SUCCESS":
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        session: action.payload.session,
        isAuthenticated: !!action.payload.user,
      };
    case "LOGIN_START":
      return { ...state, loading: true, error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        session: action.payload.session,
        isAuthenticated: true,
        error: null,
      };
    case "LOGIN_FAILURE":
      return { ...state, loading: false, error: action.payload, isAuthenticated: false };
    case "LOGOUT":
      return { ...state, user: null, session: null, isAuthenticated: false, error: null };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    session: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  const refreshToken = useCallback(async () => {
    const storedRefreshToken = tokenStorage.getRefreshToken();
    if (!storedRefreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const result = await apiRequest<{
        user: User;
        session: Session;
        tokens: { accessToken: string; refreshToken: string };
      }>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      tokenStorage.setAccessToken(result.tokens.accessToken);
      tokenStorage.setRefreshToken(result.tokens.refreshToken);
      dispatch({ type: "LOGIN_SUCCESS", payload: { user: result.user, session: result.session } });
    } catch (error) {
      tokenStorage.clearTokens();
      dispatch({ type: "LOGOUT" });
      throw error;
    }
  }, []);

  // Initialize auth state from stored tokens
  useEffect(() => {
    async function initializeAuth() {
      dispatch({ type: "INIT_START" });
      try {
        if (!tokenStorage.hasTokens()) {
          dispatch({ type: "INIT_SUCCESS", payload: { user: null, session: null } });
          return;
        }
        await refreshToken();
      } catch {
        tokenStorage.clearTokens();
        dispatch({ type: "INIT_SUCCESS", payload: { user: null, session: null } });
      }
    }
    initializeAuth();
  }, [refreshToken]);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const result = await apiRequest<{
        user: User;
        session: Session;
        tokens: { accessToken: string; refreshToken: string };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      tokenStorage.setAccessToken(result.tokens.accessToken);
      tokenStorage.setRefreshToken(result.tokens.refreshToken);
      dispatch({ type: "LOGIN_SUCCESS", payload: { user: result.user, session: result.session } });
    } catch (error) {
      dispatch({ type: "LOGIN_FAILURE", payload: error instanceof Error ? error.message : "Login failed" });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout errors
    } finally {
      tokenStorage.clearTokens();
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication state and methods.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to check if user has a specific role.
 */
export function useHasRole(role: string): boolean {
  const { user } = useAuth();
  return user?.role === role;
}

/**
 * Hook to get the current access token.
 */
export function useAccessToken(): string | null {
  return tokenStorage.getAccessToken();
}
