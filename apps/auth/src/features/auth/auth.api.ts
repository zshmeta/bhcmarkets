/**
 * Auth API Client.
 * 
 * Provides methods for authentication operations.
 * All methods return promises that resolve with typed responses.
 */

import { http } from "../../lib/http.js";
import type {
  RegisterInput,
  LoginInput,
  RefreshInput,
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
    const response = await http.post<AuthResult | { user: User }>("/auth/register", input);
    return response.data;
  },

  /**
   * Login with email and password.
   * 
   * @param input - Login credentials
   * @returns Authentication result with user, session, and tokens
   */
  async login(input: LoginInput): Promise<AuthResult> {
    const response = await http.post<AuthResult>("/auth/login", input);
    return response.data;
  },

  /**
   * Refresh access token using refresh token.
   * 
   * @param input - Refresh token
   * @returns New authentication result with refreshed tokens
   */
  async refresh(input: RefreshInput): Promise<AuthResult> {
    const response = await http.post<AuthResult>("/auth/refresh", input);
    return response.data;
  },

  /**
   * Logout (revoke single session).
   * 
   * @param input - Session to logout
   */
  async logout(input: LogoutInput): Promise<void> {
    await http.post("/auth/logout", input);
  },

  /**
   * Logout all sessions for a user.
   * 
   * @param input - User ID and optional exclusions
   */
  async logoutAll(input: LogoutAllInput): Promise<void> {
    await http.post("/auth/logout-all", input);
  },

  /**
   * Get all active sessions for a user.
   * 
   * @param userId - User ID
   * @returns List of active sessions
   */
  async getSessions(userId: string): Promise<Session[]> {
    const response = await http.get<{ sessions: Session[] }>(`/auth/sessions?userId=${userId}`);
    return response.data.sessions;
  },

  /**
   * Get current user info from access token.
   * This would typically decode the JWT client-side or call a /me endpoint.
   * 
   * @param accessToken - Access token
   * @returns User info from token
   */
  async getCurrentUser(accessToken: string): Promise<Partial<User>> {
    // In a real implementation, this would either:
    // 1. Decode the JWT client-side (if claims are not sensitive)
    // 2. Call a /auth/me endpoint on the backend
    
    // For now, we'll decode the JWT (simple base64 decode of payload)
    try {
      const parts = accessToken.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }

      const payload = JSON.parse(atob(parts[1]));
      
      return {
        id: payload.sub || payload.userId,
        role: payload.role,
      };
    } catch (error) {
      throw new Error("Failed to parse token");
    }
  },
};
