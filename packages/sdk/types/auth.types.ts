/**
 * Auth API Types.
 * 
 * Type definitions for authentication API.
 * Includes both frontend API types and backend repository/entity types.
 */

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** UUID string type */
export type UUID = string;

/** Normalized email (lowercase, trimmed) */
export type NormalizedEmail = string;

// =============================================================================
// USER TYPES
// =============================================================================

/**
 * User status.
 */
export type UserStatus = "active" | "pending" | "suspended" | "deleted";

/**
 * User role.
 */
export type UserRole = "user" | "admin" | "support";

/**
 * User entity (API response).
 */
export interface User {
  id: UUID;
  email: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * User database entity (backend internal).
 */
export interface UserEntity extends User {
  lastLoginAt?: string;
}

/**
 * Input for creating a new user.
 */
export interface CreateUserParams {
  id: UUID;
  email: NormalizedEmail;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// CREDENTIAL TYPES
// =============================================================================

/**
 * User credential (password hash and metadata).
 */
export interface UserCredential {
  userId: UUID;
  passwordHash: string;
  version: number;
  failedAttemptCount?: number;
  lockedUntil?: string;
  passwordUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating credentials.
 */
export interface CreateCredentialParams {
  userId: UUID;
  passwordHash: string;
  version: number;
  passwordUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// SESSION TYPES
// =============================================================================

/**
 * Session status.
 */
export type SessionStatus = "active" | "revoked" | "expired" | "replaced";

/**
 * Session invalidation reasons.
 */
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
 * Session entity (API response, without sensitive data).
 */
export interface Session {
  id: UUID;
  userId: UUID;
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
 * User session entity (backend internal, includes refresh token hash).
 */
export interface UserSession extends Session {
  refreshTokenHash: string;
  refreshTokenVersion: number;
  passwordVersion: number;
}

/**
 * Session view (excludes sensitive fields like refresh token hash).
 */
export type SessionView = Omit<UserSession, "refreshTokenHash">;

/**
 * Input for creating a new session.
 */
export interface CreateSessionParams {
  id: UUID;
  userId: UUID;
  refreshTokenHash: string;
  refreshTokenVersion: number;
  passwordVersion: number;
  status: SessionStatus;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

/**
 * Device metadata for session tracking.
 */
export interface DeviceMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

// =============================================================================
// AUTH CODE TYPES
// =============================================================================

/**
 * Auth code for SSO handoff.
 */
export interface AuthCode {
  code: string;
  userId: UUID;
  expiresAt: string;
  usedAt?: string;
}

// =============================================================================
// PASSWORD RESET TYPES
// =============================================================================

/**
 * Password reset token entity.
 */
export interface PasswordResetToken {
  id: number;
  userId: UUID;
  tokenHash: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

// =============================================================================
// REPOSITORY INTERFACES
// =============================================================================

/**
 * User repository interface.
 */
export interface UserRepository {
  create(input: CreateUserParams): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: UUID): Promise<User | null>;
  updateStatus(id: UUID, status: UserStatus): Promise<void>;
  updateLastLogin?(id: UUID, at: string): Promise<void>;
}

/**
 * User credential repository interface.
 */
export interface UserCredentialRepository {
  create(input: CreateCredentialParams): Promise<UserCredential>;
  getByUserId(userId: UUID): Promise<UserCredential | null>;
  updatePassword(
    userId: UUID,
    params: {
      passwordHash: string;
      version: number;
      passwordUpdatedAt: string;
      updatedAt: string;
    }
  ): Promise<void>;
  recordFailedAttempt?(userId: UUID, at: string): Promise<void>;
  resetFailedAttempts?(userId: UUID): Promise<void>;
}

/**
 * User session repository interface.
 */
export interface UserSessionRepository {
  create(input: CreateSessionParams): Promise<UserSession>;
  getById(id: UUID): Promise<UserSession | null>;
  listActiveByUser(userId: UUID): Promise<UserSession[]>;
  markInactive(sessionId: UUID, reason: SessionInvalidationReason, at: string): Promise<void>;
  markInactiveByUser(
    userId: UUID,
    reason: SessionInvalidationReason,
    at: string,
    options?: { excludeSessionId?: UUID }
  ): Promise<void>;
  replaceRefreshToken(params: {
    sessionId: UUID;
    refreshTokenHash: string;
    refreshTokenVersion: number;
    expiresAt: string;
    lastSeenAt: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<UserSession | null>;
  touch(
    sessionId: UUID,
    params: { lastSeenAt: string; ipAddress?: string; userAgent?: string }
  ): Promise<void>;
}

/**
 * Auth code repository interface.
 */
export interface AuthCodeRepository {
  save(authCode: AuthCode): Promise<void>;
  findByCode(code: string): Promise<AuthCode | null>;
  markUsed(code: string): Promise<void>;
}

/**
 * Password reset token repository interface.
 */
export interface PasswordResetTokenRepository {
  create(input: { userId: UUID; tokenHash: string; expiresAt: string }): Promise<PasswordResetToken>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  markUsed(id: number): Promise<void>;
  revokeAllForUser(userId: UUID): Promise<void>;
}

// =============================================================================
// API INPUT/OUTPUT TYPES
// =============================================================================

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

