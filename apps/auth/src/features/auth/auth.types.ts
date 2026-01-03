/**
 * Auth API Types.
 * 
 * Frontend type definitions for authentication API.
 * These mirror the backend types but are frontend-specific.
 */

/**
 * User status.
 */
export type UserStatus = "active" | "pending" | "suspended" | "deleted";

/**
 * User role.
 */
export type UserRole = "user" | "admin" | "support";

/**
 * User entity.
 */
export interface User {
  id: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * Session status.
 */
export type SessionStatus = "active" | "revoked" | "expired" | "replaced";

/**
 * Session entity.
 */
export interface Session {
  id: string;
  userId: string;
  status: SessionStatus;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt?: string;
  revokedReason?: string;
}

/**
 * Authentication tokens.
 */
export interface AuthTokens {
  tokenType: "Bearer";
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

/**
 * Authentication result.
 */
export interface AuthResult {
  user: User;
  session: Session;
  tokens: AuthTokens;
}

/**
 * Registration input.
 */
export interface RegisterInput {
  email: string;
  password: string;
  issueSession?: boolean;
}

/**
 * Login input.
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Refresh input.
 */
export interface RefreshInput {
  refreshToken: string;
}

/**
 * Logout input.
 */
export interface LogoutInput {
  sessionId: string;
  userId?: string;
  reason?: string;
}

/**
 * Logout all input.
 */
export interface LogoutAllInput {
  userId: string;
  excludeSessionId?: string;
  reason?: string;
}

/**
 * API error response.
 */
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
