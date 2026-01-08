/**
 * Auth Domain - Barrel Export
 *
 * This file provides a clean public API for the auth domain.
 * All external imports should go through this file.
 */

// Core service and factory
export { createAuthService } from "./core/auth.service.js";
export type {
  AuthService,
  AuthServiceDependencies,
  AuthServiceConfig,
  AuthenticationInput,
  AuthenticationResult,
  AuthTokens,
  RegistrationInput,
  RefreshSessionInput,
  LogoutInput,
  LogoutAllInput,
  UpdatePasswordInput,
} from "./core/auth.service.js";

// Types
export type {
  User,
  UserStatus,
  UserRole,
  UUID,
  NormalizedEmail,
  UserEntity,
  CreateUserParams,
  UserCredential,
  CreateCredentialParams,
  UserSession,
  SessionView,
  SessionStatus,
  SessionInvalidationReason,
  CreateSessionParams,
  DeviceMetadata,
  UserRepository,
  UserCredentialRepository,
  UserSessionRepository,
  AuthCode,
  AuthCodeRepository,
} from "./core/auth.types.js";

// Errors
export { AuthError } from "./core/auth.errors.js";
export type { AuthErrorCode } from "./core/auth.errors.js";
export { AUTH_ERROR_DESCRIPTIONS, AUTH_ERROR_HTTP_STATUS } from "./core/auth.errors.js";

// Repositories
export {
  createUserRepository,
  createCredentialRepository,
  createSessionRepository,
  createAuthCodeRepository,
  createPasswordResetTokenRepository,
} from "./repositories/repositories.pg.js";

// Routes
export { registerAuthRoutes } from "./routes/auth.routes.js";

// Security utilities
export { createBcryptHasher } from "./security/hasher.js";
export type { SecretHasher } from "./security/hasher.js";
export { createJwtTokenManager } from "./tokens/tokens.js";
export type { TokenManager, AccessTokenClaims, RefreshTokenClaims } from "./tokens/tokens.js";
