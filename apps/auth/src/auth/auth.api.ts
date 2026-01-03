/**
 * Auth API Client.
 * 
 * Provides methods for authentication operations.
 * All methods return promises that resolve with typed responses.
 */

import { http, HttpError } from "../lib/http.js";
import { tokenStorage } from "../lib/storage.js";
import type {
  RegisterInput,
  LoginInput,
  RefreshInput,
  PasswordResetRequestInput,
  PasswordResetConfirmInput,
  LogoutInput,
  LogoutAllInput,
  AuthResult,
  Session,
  User,
} from "./auth.types.js";

/**
 * Auth API client.
 */
export const authApi = {
  /**
   * Register a new user.
   * 
   * @param input - Registration data
   * @returns Authentication result with user and tokens (if issueSession is true)
   */
  async register(input: RegisterInput): Promise<AuthResult | { user: User }> {
    try {
      const response = await http.post<AuthResult | { user: User }>("/auth/register", input);
      return response.data;
    } catch (err: unknown) {
      throw toUserFacingAuthError(err, "Registration failed");
    }
  },

  /**
   * Login with email and password.
   * 
   * @param input - Login credentials
   * @returns Authentication result with user, session, and tokens
   */
  async login(input: LoginInput): Promise<AuthResult> {
    try {
      const response = await http.post<AuthResult>("/auth/login", input);
      return response.data;
    } catch (err: unknown) {
      throw toUserFacingAuthError(err, "Unable to sign in");
    }
  },

  /**
   * Generate a short-lived authorization code for cross-domain handoff.
   * 
   * @param input - Target URL for the handoff
   * @returns Auth code
   */
  async generateAuthCode(input: { targetUrl: string }): Promise<{ code: string }> {
    try {
      const response = await http.post<{ code: string }>("/auth/code", input, {
        headers: buildAuthHeaders(),
      });
      return response.data;
    } catch (err: unknown) {
      throw toUserFacingAuthError(err, "Unable to generate auth code");
    }
  },

  /**
   * Refresh access token using refresh token.
   * 
   * @param input - Refresh token
   * @returns New authentication result with refreshed tokens
   */
  async refresh(input: RefreshInput): Promise<AuthResult> {
    try {
      const response = await http.post<AuthResult>("/auth/refresh", input);
      return response.data;
    } catch (err: unknown) {
      throw toUserFacingAuthError(err, "Session expired");
    }
  },

  /**
   * Request a password reset email.
   * Endpoint naming may vary by backend; adjust here to match.
   */
  async requestPasswordReset(input: PasswordResetRequestInput): Promise<void> {
    try {
      await http.post("/auth/forgot-password", input);
      return;
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        // Anti-enumeration: unknown emails should look like success.
        if (err.status === 404 && typeof err.response === "object" && err.response !== null) {
          const maybe = err.response as { error?: string };
          if (maybe.error === "UNKNOWN_USER" || maybe.error === "USER_NOT_FOUND") return;
        }
        // Route not implemented on the server (common during integration).
        if (err.status === 404 && typeof err.response === "string") {
          throw new Error("Password reset is not available on this server");
        }
        if (err.status === 429) {
          throw new Error("Too many requests. Please try again later");
        }
        if (typeof err.response === "object" && err.response !== null) {
          const maybe = err.response as { error?: string; message?: string };
          if (maybe.error === "RATE_LIMIT_EXCEEDED" || maybe.error === "TOO_MANY_ATTEMPTS") {
            throw new Error("Too many requests. Please try again later");
          }
          if (maybe.message) throw new Error(maybe.message);
        }
      }
      throw toUserFacingAuthError(err, "Unable to send reset email");
    }
  },

  /**
   * Confirm password reset using the token from the email.
   */
  async confirmPasswordReset(input: PasswordResetConfirmInput): Promise<void> {
    try {
      await http.post("/auth/reset-password", input);
      return;
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        if (err.status === 404 && typeof err.response === "string") {
          throw new Error("Password reset is not available on this server");
        }
        if (err.status === 429) {
          throw new Error("Too many requests. Please try again later");
        }
        if (typeof err.response === "object" && err.response !== null) {
          const maybe = err.response as { error?: string; message?: string };
          switch (maybe.error) {
            case "RESET_TOKEN_INVALID":
              throw new Error("This reset link is invalid. Please request a new one");
            case "RESET_TOKEN_EXPIRED":
              throw new Error("This reset link has expired. Please request a new one");
            case "RESET_TOKEN_USED":
              throw new Error("This reset link has already been used. Please request a new one");
            case "RATE_LIMIT_EXCEEDED":
            case "TOO_MANY_ATTEMPTS":
              throw new Error("Too many requests. Please try again later");
            default:
              if (maybe.message) throw new Error(maybe.message);
          }
        }
      }
      throw toUserFacingAuthError(err, "Unable to reset password");
    }
  },

  /**
   * Logout (revoke single session).
   * 
   * @param input - Session to logout
   */
  async logout(input: LogoutInput): Promise<void> {
    try {
      await http.post("/auth/logout", input, { headers: buildAuthHeaders() });
    } catch (err: unknown) {
      throw toUserFacingAuthError(err, "Unable to sign out");
    }
  },

  /**
   * Logout all sessions for a user.
   * 
   * @param input - User ID and optional exclusions
   */
  async logoutAll(input: LogoutAllInput): Promise<void> {
    try {
      await http.post("/auth/logout-all", input, { headers: buildAuthHeaders() });
    } catch (err: unknown) {
      throw toUserFacingAuthError(err, "Unable to sign out");
    }
  },

  /**
   * Get all active sessions for a user.
   * 
   * @param userId - User ID
   * @returns List of active sessions
   */
  async getSessions(userId: string): Promise<Session[]> {
    try {
      const response = await http.get<{ sessions: Session[] }>(`/auth/sessions?userId=${encodeURIComponent(userId)}`, {
        headers: buildAuthHeaders(),
      });
      return response.data.sessions;
    } catch (err: unknown) {
      throw toUserFacingAuthError(err, "Unable to load sessions");
    }
  },
};

type AuthErrorBody = { error?: string; message?: string; details?: unknown };

function toUserFacingAuthError(err: unknown, fallbackMessage: string): Error {
  if (err instanceof Error && !(err instanceof HttpError)) {
    return err;
  }

  if (err instanceof HttpError) {
    const body = err.response;
    if (typeof body === "object" && body !== null) {
      const maybe = body as AuthErrorBody;
      const rawMessage = typeof maybe.message === "string" ? maybe.message : "";
      const cleanMessage = rawMessage.replace(/^validation_error:\s*/i, "");

      // Prefer server message when present.
      if (cleanMessage) return new Error(cleanMessage);

      // Basic fallback mapping by error code.
      switch (maybe.error) {
        case "INVALID_CREDENTIALS":
          return new Error("Invalid email or password");
        case "EMAIL_ALREADY_REGISTERED":
          return new Error("An account with this email already exists");
        case "PASSWORD_TOO_WEAK":
          return new Error("Password does not meet security requirements");
        case "PASSWORD_BREACHED":
          return new Error("This password can’t be used. Choose a different one");
        case "EMAIL_NOT_VERIFIED":
          return new Error("Email not verified");
        case "TOO_MANY_ATTEMPTS":
        case "RATE_LIMIT_EXCEEDED":
          return new Error("Too many requests. Please try again later");
        default:
          break;
      }
    }

    if (err.status === 401) return new Error("Please sign in again");
    if (err.status === 403) return new Error("Access denied");
    if (err.status === 429) return new Error("Too many requests. Please try again later");
  }

  return new Error(fallbackMessage);
}

function buildAuthHeaders(): Record<string, string> {
  const token = tokenStorage.getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
