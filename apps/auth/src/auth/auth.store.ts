/**
 * Auth Store (React Context).
 * 
 * Manages authentication state using React Context API.
 * Provides auth state and methods to components via hooks.
 */

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useCallback,
  useReducer,
  type ReactNode,
} from "react";
import { authApi } from "./auth.api.js";
import { tokenStorage } from "../../lib/storage.js";
import type { User, Session, LoginInput, RegisterInput } from "./auth.types.js";

/**
 * Auth state.
 */
export interface AuthState {
  /** Current user (null if not authenticated) */
  user: User | null;

  /** Current session (null if not authenticated) */
  session: Session | null;
  
  /** Whether the auth state is being initialized */
  loading: boolean;
  
  /** Authentication error (if any) */
  error: string | null;
  
  /** Whether user is authenticated */
  isAuthenticated: boolean;
}

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
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    session: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  /**
   * Refresh access token.
   */
  const refreshToken = useCallback(async () => {
    const storedRefreshToken = tokenStorage.getRefreshToken();
    if (!storedRefreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const result = await authApi.refresh({ refreshToken: storedRefreshToken });

      // Store new tokens
      tokenStorage.setAccessToken(result.tokens.accessToken);
      tokenStorage.setRefreshToken(result.tokens.refreshToken);

      // Update state
      dispatch({ type: "LOGIN_SUCCESS", payload: { user: result.user, session: result.session } });
    } catch (error) {
      // Refresh failed, clear tokens
      tokenStorage.clearTokens();
      dispatch({ type: "LOGOUT" });
      throw error;
    }
  }, []);

  /**
   * Initialize auth state from stored tokens.
   */
  useEffect(() => {
    async function initializeAuth() {
      dispatch({ type: "INIT_START" });
      try {
        // Check if we have tokens
        if (!tokenStorage.hasTokens()) {
          dispatch({ type: "INIT_SUCCESS", payload: { user: null, session: null } });
          return;
        }

        // Try to refresh the session
        await refreshToken();
      } catch {
        // Failed to restore session, clear tokens
        tokenStorage.clearTokens();
        dispatch({ type: "INIT_SUCCESS", payload: { user: null, session: null } });
      }
    }

    initializeAuth();
  }, [refreshToken]);

  /**
   * Login user.
   */
  const login = useCallback(async (input: LoginInput) => {
    dispatch({ type: "LOGIN_START" });

    try {
      const result = await authApi.login(input);
      
      // Store tokens
      tokenStorage.setAccessToken(result.tokens.accessToken);
      tokenStorage.setRefreshToken(result.tokens.refreshToken);

      // Update state
      dispatch({ type: "LOGIN_SUCCESS", payload: { user: result.user, session: result.session } });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Login failed";
      dispatch({ type: "LOGIN_FAILURE", payload: msg });
      throw error;
    }
  }, []);

  /**
   * Register new user.
   */
  const register = useCallback(async (input: RegisterInput) => {
    dispatch({ type: "LOGIN_START" });

    try {
      const result = await authApi.register(input);
      
      // Check if session was issued
      if ("tokens" in result) {
        // Store tokens
        tokenStorage.setAccessToken(result.tokens.accessToken);
        tokenStorage.setRefreshToken(result.tokens.refreshToken);

        // Update state
        dispatch({ type: "LOGIN_SUCCESS", payload: { user: result.user, session: result.session } });
      } else {
        // No session issued, just created user
        // For now we treat this as a logout/reset, user needs to login
        dispatch({ type: "INIT_SUCCESS", payload: { user: null, session: null } });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Registration failed";
      dispatch({ type: "LOGIN_FAILURE", payload: msg });
      throw error;
    }
  }, []);

  /**
   * Logout current session.
   */
  const logout = useCallback(async () => {
    try {
      const sessionId = state.session?.id;
      const userId = state.user?.id;
      if (sessionId) {
        await authApi.logout({ sessionId, userId });
      }
    } catch (error) {
      // Ignore logout errors
      console.error("Logout error:", error);
    } finally {
      // Clear tokens and state
      tokenStorage.clearTokens();
      dispatch({ type: "LOGOUT" });
    }
  }, [state.session?.id, state.user?.id]);

  /**
   * Logout all sessions.
   */
  const logoutAll = useCallback(async () => {
    try {
      const userId = state.user?.id;
      if (userId) {
        await authApi.logoutAll({ userId, excludeSessionId: state.session?.id });
      }
    } catch (error) {
      console.error("Logout all error:", error);
    } finally {
      // Clear tokens and state
      tokenStorage.clearTokens();
      dispatch({ type: "LOGOUT" });
    }
  }, [state.session?.id, state.user?.id]);

  /**
   * Clear error state.
   */
  
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
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
  return createElement(AuthContext.Provider, { value }, children);

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
