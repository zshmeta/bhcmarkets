export type UserStatus = "active" | "pending" | "suspended" | "deleted";
export type UserRole = "user" | "admin" | "support";

export interface User {
  id: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lightweight UUID alias while database abstractions settle.
 */
export type UUID = User["id"];

/**
 * Normalized email string used throughout the auth domain.
 */
export type NormalizedEmail = string;

/**
 * Public-facing representation of a user account.
 */
export type UserEntity = User;

/**
 * Input contract for creating a new user record.
 */
export interface CreateUserParams {
  id: UUID;
  email: NormalizedEmail;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Stored credential metadata for a user. `version` is incremented each time the password changes,
 * enabling session invalidation on credential rotation.
 */
export interface UserCredential {
  userId: UUID;
  passwordHash: string;
  version: number;
  failedAttemptCount: number;
  lockedUntil?: string;
  passwordUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCredentialParams {
  userId: UUID;
  passwordHash: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  passwordUpdatedAt: string;
}

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

export interface UserSession {
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
  revokedAt?: string;
  revokedReason?: SessionInvalidationReason;
}

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

export interface RotateSessionParams {
  sessionId: UUID;
  refreshTokenHash: string;
  refreshTokenVersion: number;
  expiresAt: string;
  lastSeenAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionView extends Omit<UserSession, "refreshTokenHash"> {}

export interface DeviceMetadata {
  ipAddress?: string;
  userAgent?: string;
  platform?: string;
}

export interface UserRepository {
  create(input: CreateUserParams): Promise<UserEntity>;
  findByEmail(email: NormalizedEmail): Promise<UserEntity | null>;
  findById(id: UUID): Promise<UserEntity | null>;
  updateStatus(id: UUID, status: UserStatus): Promise<void>;
  updateLastLogin?(id: UUID, at: string): Promise<void>;
}

export interface UserCredentialRepository {
  create(input: CreateCredentialParams): Promise<UserCredential>;
  getByUserId(userId: UUID): Promise<UserCredential | null>;
  updatePassword(userId: UUID, params: { passwordHash: string; version: number; passwordUpdatedAt: string; updatedAt: string }): Promise<void>;
  recordFailedAttempt?(userId: UUID, at: string): Promise<void>;
  resetFailedAttempts?(userId: UUID): Promise<void>;
  lock?(userId: UUID, until: string): Promise<void>;
  unlock?(userId: UUID): Promise<void>;
}

export interface UserSessionRepository {
  create(input: CreateSessionParams): Promise<UserSession>;
  getById(id: UUID): Promise<UserSession | null>;
  listActiveByUser(userId: UUID): Promise<UserSession[]>;
  markInactive(sessionId: UUID, reason: SessionInvalidationReason, at: string): Promise<void>;
  markInactiveByUser(userId: UUID, reason: SessionInvalidationReason, at: string, options?: { excludeSessionId?: UUID }): Promise<void>;
  replaceRefreshToken(params: RotateSessionParams): Promise<UserSession | null>;
  touch(sessionId: UUID, params: { lastSeenAt: string; ipAddress?: string; userAgent?: string }): Promise<void>;
}
