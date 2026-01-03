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

export type SessionInvalidationReason =
  | "manual"
  | "password_rotated"
  | "refresh_rotated"
  | "session_limit"
  | "suspicious_activity"
  | "user_disabled"
  | "logout_all"
  | "expired";

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
	revokedReason?: SessionInvalidationReason;
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
 * Auth Code Handoff.
 */
export interface GenerateAuthCodeInput {
  targetUrl: string;
}

export interface GenerateAuthCodeResponse {
  code: string;
  redirectUrl: string;
}

/**
 * Refresh input.
 */
export interface RefreshInput {
  refreshToken: string;
}

/** Password reset request input. */
export interface PasswordResetRequestInput {
  email: string;
}

/** Password reset confirm input. */
export interface PasswordResetConfirmInput {
  token: string;
  newPassword: string;
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
