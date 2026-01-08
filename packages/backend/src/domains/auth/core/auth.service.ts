/* Auth servicea, Core feature */

import { randomUUID, createHash } from "node:crypto";
import type { Logger } from "../../../config/logger.js";
import type {
  AuthCodeRepository,
  CreateCredentialParams,
  CreateSessionParams,
  CreateUserParams,
  DeviceMetadata,
  SessionInvalidationReason,
  SessionView,
  User,
  UserCredential,
  UserCredentialRepository,
  UserRepository,
  UserRole,
  UserSession,
  UserSessionRepository,
  UserStatus,
  PasswordResetTokenRepository,
  UUID,
} from "./auth.types.js";
import type { AccountService } from "../../account/account.service.js";
import { AuthError } from "./auth.errors.js";

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const DEFAULT_MAX_SESSIONS_PER_USER = 10;

export interface SecretHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hashed: string): Promise<boolean>;
}

export interface Clock {
  now(): Date;
}

export type IdFactory = () => UUID;

export interface AccessTokenClaims {
  sub: UUID;
  sessionId: UUID;
  role: UserRole;
  version: number;
  issuedAt: string;
  expiresAt: string;
}

export interface RefreshTokenClaims {
  sub: UUID;
  sessionId: UUID;
  sessionVersion: number;
  passwordVersion: number;
  issuedAt: string;
  expiresAt: string;
}

export interface TokenManager {
  issueAccessToken(payload: AccessTokenClaims, ttlSeconds: number): Promise<string>;
  issueRefreshToken(payload: RefreshTokenClaims, ttlSeconds: number): Promise<string>;
  parseRefreshToken(token: string): Promise<RefreshTokenClaims | null>;
}

export interface AuthServiceConfig {
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  maxSessionsPerUser: number;
}

export interface AuthServiceDependencies {
  userRepository: UserRepository;
  authCodeRepository: AuthCodeRepository;
  credentialRepository: UserCredentialRepository;
  sessionRepository: UserSessionRepository;
  passwordResetTokenRepository: PasswordResetTokenRepository;
  passwordHasher: SecretHasher;
  tokenHasher?: SecretHasher;
  tokenManager: TokenManager;
  clock?: Clock;
  idFactory?: IdFactory;
  logger?: Logger;
  config?: Partial<AuthServiceConfig>;
  accountService?: AccountService;
  /** Optional email service for sending auth-related emails */
  authEmailService?: import('./auth.emails.js').AuthEmailService;
}

export interface AuthTokens {
  tokenType: "Bearer";
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface AuthenticationResult {
  user: User;
  session: SessionView;
  tokens: AuthTokens;
}

export interface RegistrationInput {
  email: string;
  password: string;
  role?: UserRole;
  status?: UserStatus;
  device?: DeviceMetadata;
  issueSession?: boolean;
}

export interface AuthenticationInput {
  email: string;
  password: string;
  device?: DeviceMetadata;
}

export interface RefreshSessionInput {
  refreshToken: string;
  device?: DeviceMetadata;
}

export interface LogoutInput {
  sessionId: UUID;
  userId?: UUID;
  reason?: SessionInvalidationReason;
}

export interface LogoutAllInput {
  userId: UUID;
  excludeSessionId?: UUID;
  reason?: SessionInvalidationReason;
}

export interface UpdatePasswordInput {
  userId: UUID;
  currentPassword?: string;
  newPassword: string;
  invalidateOtherSessions?: boolean;
}

export interface AuthService {
  register(input: RegistrationInput): Promise<AuthenticationResult | { user: User }>;
  authenticate(input: AuthenticationInput): Promise<AuthenticationResult>;
  refreshSession(input: RefreshSessionInput): Promise<AuthenticationResult>;
  logout(input: LogoutInput): Promise<void>;
  logoutAll(input: LogoutAllInput): Promise<void>;
  updatePassword(input: UpdatePasswordInput): Promise<void>;
  getUserById(id: UUID): Promise<User | null>;
  listActiveSessions(userId: UUID): Promise<SessionView[]>;
  generateAuthCode(userId: UUID, targetUrl: string): Promise<string>;
  exchangeAuthCode(code: string): Promise<AuthenticationResult>;
  requestPasswordReset(email: string): Promise<void>;
  confirmPasswordReset(token: string, newPassword: string): Promise<void>;
}

const defaultClock: Clock = { now: () => new Date() };
const defaultIdFactory: IdFactory = () => randomUUID();

const toSessionView = (session: UserSession): SessionView => {
  const { refreshTokenHash: _hash, ...rest } = session;
  return rest;
};

const ensureUserActive = (user: User): void => {
  if (user.status === "pending" || user.status === "deleted") {
    throw new AuthError("USER_NOT_ACTIVE");
  }
  if (user.status === "suspended") {
    throw new AuthError("USER_SUSPENDED");
  }
};

const verifyRefreshTokenFreshness = (
  session: UserSession,
  claims: RefreshTokenClaims,
): void => {
  if (session.refreshTokenVersion !== claims.sessionVersion) {
    throw new AuthError("REFRESH_TOKEN_INVALID");
  }
  if (session.passwordVersion !== claims.passwordVersion) {
    throw new AuthError("REFRESH_TOKEN_INVALID");
  }
};

const pruneSessions = async (
  sessionRepository: UserSessionRepository,
  userId: UUID,
  limit: number,
  excludeSessionId: UUID | undefined,
  clock: Clock,
): Promise<void> => {
  if (!limit || limit < 1) return;
  const sessions = await sessionRepository.listActiveByUser(userId);
  if (sessions.length <= limit) return;

  const ordered = sessions
    .filter((session) => (excludeSessionId ? session.id !== excludeSessionId : true))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const surplus = ordered.slice(0, Math.max(0, ordered.length - limit));
  if (!surplus.length) return;

  const closedAt = clock.now().toISOString();
  await Promise.all(
    surplus.map((session) =>
      sessionRepository.markInactive(session.id, "session_limit", closedAt),
    ),
  );
};

export const createAuthService = (deps: AuthServiceDependencies): AuthService => {
  const {
    userRepository,
    credentialRepository,
    sessionRepository,
    authCodeRepository,
    passwordResetTokenRepository,
    passwordHasher,
    tokenHasher = passwordHasher,
    tokenManager,
    clock = defaultClock,
    idFactory = defaultIdFactory,
    logger,
    accountService,
    authEmailService,
  } = deps;

  const config: AuthServiceConfig = {
    accessTokenTtlSeconds: deps.config?.accessTokenTtlSeconds ?? DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenTtlSeconds: deps.config?.refreshTokenTtlSeconds ?? DEFAULT_REFRESH_TOKEN_TTL_SECONDS,
    maxSessionsPerUser: deps.config?.maxSessionsPerUser ?? DEFAULT_MAX_SESSIONS_PER_USER,
  };

  const normalizeEmail = (email: string): string => email.trim().toLowerCase();

  const issueInitialSession = async (
    user: User,
    credential: UserCredential,
    device?: DeviceMetadata,
  ): Promise<AuthenticationResult> => {
    const issuedAt = clock.now();
    const refreshExpiresAt = new Date(issuedAt.getTime() + config.refreshTokenTtlSeconds * 1000);
    const accessExpiresAt = new Date(issuedAt.getTime() + config.accessTokenTtlSeconds * 1000);
    const sessionId = idFactory();

    const refreshToken = await tokenManager.issueRefreshToken(
      {
        sub: user.id,
        sessionId,
        sessionVersion: 1,
        passwordVersion: credential.version,
        issuedAt: issuedAt.toISOString(),
        expiresAt: refreshExpiresAt.toISOString(),
      },
      config.refreshTokenTtlSeconds,
    );

    const refreshTokenHash = await tokenHasher.hash(refreshToken);

    const sessionRecord: CreateSessionParams = {
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      refreshTokenVersion: 1,
      passwordVersion: credential.version,
      status: "active",
      ipAddress: device?.ipAddress,
      userAgent: device?.userAgent,
      createdAt: issuedAt.toISOString(),
      lastSeenAt: issuedAt.toISOString(),
      expiresAt: refreshExpiresAt.toISOString(),
    };

    const storedSession = await sessionRepository.create(sessionRecord);
    const accessToken = await tokenManager.issueAccessToken(
      {
        sub: user.id,
        sessionId: storedSession.id,
        role: user.role,
        version: storedSession.refreshTokenVersion,
        issuedAt: issuedAt.toISOString(),
        expiresAt: accessExpiresAt.toISOString(),
      },
      config.accessTokenTtlSeconds,
    );

    return {
      user,
      session: toSessionView(storedSession),
      tokens: {
        tokenType: "Bearer",
        accessToken,
        accessTokenExpiresAt: accessExpiresAt.toISOString(),
        refreshToken,
        refreshTokenExpiresAt: refreshExpiresAt.toISOString(),
      },
    };
  };

  const rotateSession = async (
    session: UserSession,
    user: User,
    device?: DeviceMetadata,
  ): Promise<AuthenticationResult> => {
    const issuedAt = clock.now();
    const refreshExpiresAt = new Date(issuedAt.getTime() + config.refreshTokenTtlSeconds * 1000);
    const accessExpiresAt = new Date(issuedAt.getTime() + config.accessTokenTtlSeconds * 1000);
    const nextVersion = session.refreshTokenVersion + 1;

    const refreshToken = await tokenManager.issueRefreshToken(
      {
        sub: user.id,
        sessionId: session.id,
        sessionVersion: nextVersion,
        passwordVersion: session.passwordVersion,
        issuedAt: issuedAt.toISOString(),
        expiresAt: refreshExpiresAt.toISOString(),
      },
      config.refreshTokenTtlSeconds,
    );

    const refreshTokenHash = await tokenHasher.hash(refreshToken);

    const updatedSession = await sessionRepository.replaceRefreshToken({
      sessionId: session.id,
      refreshTokenHash,
      refreshTokenVersion: nextVersion,
      expiresAt: refreshExpiresAt.toISOString(),
      lastSeenAt: issuedAt.toISOString(),
      ipAddress: device?.ipAddress,
      userAgent: device?.userAgent,
    });

    if (!updatedSession) {
      throw new AuthError("SESSION_NOT_FOUND");
    }

    const accessToken = await tokenManager.issueAccessToken(
      {
        sub: user.id,
        sessionId: updatedSession.id,
        role: user.role,
        version: updatedSession.refreshTokenVersion,
        issuedAt: issuedAt.toISOString(),
        expiresAt: accessExpiresAt.toISOString(),
      },
      config.accessTokenTtlSeconds,
    );

    return {
      user,
      session: toSessionView(updatedSession),
      tokens: {
        tokenType: "Bearer",
        accessToken,
        accessTokenExpiresAt: accessExpiresAt.toISOString(),
        refreshToken,
        refreshTokenExpiresAt: refreshExpiresAt.toISOString(),
      },
    };
  };

  const register: AuthService["register"] = async (input) => {
    const email = normalizeEmail(input.email);
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new AuthError("EMAIL_ALREADY_REGISTERED");
    }

    const timestamp = clock.now().toISOString();
    const userId = idFactory();

    const userRecord: CreateUserParams = {
      id: userId,
      email,
      role: input.role ?? "user",
      status: input.status ?? "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const user = await userRepository.create(userRecord);

    const passwordHash = await passwordHasher.hash(input.password);
    const credentialRecord: CreateCredentialParams = {
      userId: user.id,
      passwordHash,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      passwordUpdatedAt: timestamp,
    };

    const credential = await credentialRepository.create(credentialRecord);

    if (accountService) {
      await accountService.createAccount(user.id);
    }

    // Send welcome email (fire and forget - don't block registration)
    if (authEmailService) {
      authEmailService.sendWelcomeEmail(user).catch((err) => {
        logger?.error("Failed to send welcome email", { userId: user.id, error: err });
      });
    }

    if (input.issueSession === false) {
      return { user };
    }

    const result = await issueInitialSession(user, credential, input.device);
    await pruneSessions(sessionRepository, user.id, config.maxSessionsPerUser, result.session.id, clock);
    await userRepository.updateLastLogin?.(user.id, result.session.createdAt);
    return result;
  };

  const authenticate: AuthService["authenticate"] = async (input) => {
    const email = normalizeEmail(input.email);
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AuthError("INVALID_CREDENTIALS");
    }

    ensureUserActive(user);

    const credential = await credentialRepository.getByUserId(user.id);
    if (!credential) {
      throw new AuthError("INVALID_CREDENTIALS");
    }

    const passwordMatches = await passwordHasher.verify(input.password, credential.passwordHash);
    if (!passwordMatches) {
      await credentialRepository.recordFailedAttempt?.(user.id, clock.now().toISOString());
      logger?.warn("Invalid login attempt", { userId: user.id });
      throw new AuthError("INVALID_CREDENTIALS");
    }

    await credentialRepository.resetFailedAttempts?.(user.id);

    const result = await issueInitialSession(user, credential, input.device);
    await pruneSessions(sessionRepository, user.id, config.maxSessionsPerUser, result.session.id, clock);
    await userRepository.updateLastLogin?.(user.id, result.session.createdAt);
    return result;
  };

  const refreshSession: AuthService["refreshSession"] = async ({ refreshToken, device }) => {
    const claims = await tokenManager.parseRefreshToken(refreshToken);
    if (!claims) {
      throw new AuthError("REFRESH_TOKEN_INVALID");
    }

    const session = await sessionRepository.getById(claims.sessionId);
    if (!session) {
      throw new AuthError("SESSION_NOT_FOUND");
    }

    if (session.status !== "active") {
      throw new AuthError("SESSION_REVOKED");
    }

    const now = clock.now();
    if (new Date(session.expiresAt) <= now) {
      await sessionRepository.markInactive(session.id, "expired", now.toISOString());
      throw new AuthError("SESSION_EXPIRED");
    }

    const tokenMatches = await tokenHasher.verify(refreshToken, session.refreshTokenHash);
    if (!tokenMatches) {
      await sessionRepository.markInactive(session.id, "suspicious_activity", now.toISOString());
      throw new AuthError("REFRESH_TOKEN_REUSED");
    }

    verifyRefreshTokenFreshness(session, claims);

    const user = await userRepository.findById(session.userId);
    if (!user) {
      throw new AuthError("UNKNOWN_USER");
    }

    ensureUserActive(user);

    return rotateSession(session, user, device);
  };

  const logout: AuthService["logout"] = async ({ sessionId, userId, reason }) => {
    const session = await sessionRepository.getById(sessionId);
    if (!session) return;
    if (userId && session.userId !== userId) {
      throw new AuthError("SESSION_NOT_FOUND");
    }
    if (session.status !== "active") return;
    await sessionRepository.markInactive(session.id, reason ?? "manual", clock.now().toISOString());
  };

  const logoutAll: AuthService["logoutAll"] = async ({ userId, excludeSessionId, reason }) => {
    await sessionRepository.markInactiveByUser(userId, reason ?? "logout_all", clock.now().toISOString(), {
      excludeSessionId,
    });
  };

  const updatePassword: AuthService["updatePassword"] = async ({
    userId,
    currentPassword,
    newPassword,
    invalidateOtherSessions = true,
  }) => {
    const credential = await credentialRepository.getByUserId(userId);
    if (!credential) {
      throw new AuthError("UNKNOWN_USER");
    }

    if (currentPassword) {
      const matches = await passwordHasher.verify(currentPassword, credential.passwordHash);
      if (!matches) {
        throw new AuthError("PASSWORD_MISMATCH");
      }
    }

    const nextHash = await passwordHasher.hash(newPassword);
    const timestamp = clock.now().toISOString();
    const nextVersion = credential.version + 1;

    await credentialRepository.updatePassword(userId, {
      passwordHash: nextHash,
      version: nextVersion,
      passwordUpdatedAt: timestamp,
      updatedAt: timestamp,
    });

    if (invalidateOtherSessions) {
      await sessionRepository.markInactiveByUser(userId, "password_rotated", timestamp);
    }
  };

  const getUserById: AuthService["getUserById"] = (id) => userRepository.findById(id);

  const listActiveSessions: AuthService["listActiveSessions"] = async (userId) => {
    const sessions = await sessionRepository.listActiveByUser(userId);
    return sessions.map(toSessionView);
  };

  const generateAuthCode: AuthService["generateAuthCode"] = async (userId, targetUrl) => {
    // In a real implementation, we might bind the code to the targetUrl to prevent redirection attacks.
    // For now, we just generate a secure random code.
    const code = idFactory().replace(/-/g, "") + idFactory().replace(/-/g, "");
    const expiresAt = new Date(clock.now().getTime() + 30 * 1000).toISOString(); // 30 seconds

    await authCodeRepository.save({
      code,
      userId,
      expiresAt,
    });

    return code;
  };

  const exchangeAuthCode: AuthService["exchangeAuthCode"] = async (code) => {
    const authCode = await authCodeRepository.findByCode(code);
    if (!authCode) {
      throw new AuthError("AUTH_CODE_INVALID");
    }

    if (authCode.usedAt) {
      // Re-use attempt! Security risk.
      throw new AuthError("AUTH_CODE_INVALID");
    }

    if (new Date(authCode.expiresAt) < clock.now()) {
      throw new AuthError("AUTH_CODE_EXPIRED");
    }

    await authCodeRepository.markUsed(code);

    const user = await userRepository.findById(authCode.userId);
    if (!user) {
      throw new AuthError("UNKNOWN_USER");
    }
    ensureUserActive(user);

    const credential = await credentialRepository.getByUserId(user.id);
    if (!credential) {
      throw new AuthError("UNKNOWN_USER");
    }

    // Issue new session
    return issueInitialSession(user, credential);
  };

  const requestPasswordReset: AuthService["requestPasswordReset"] = async (email) => {
    const normalized = normalizeEmail(email);
    const user = await userRepository.findByEmail(normalized);

    // Silent fail to prevent enumeration
    if (!user) return;

    // Generate token
    const token = idFactory().replace(/-/g, "") + idFactory().replace(/-/g, "");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(clock.now().getTime() + 60 * 60 * 1000).toISOString(); // 1 hour

    await passwordResetTokenRepository.revokeAllForUser(user.id);
    await passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Send password reset email
    if (authEmailService) {
      authEmailService.sendPasswordResetEmail(user, token).catch((err) => {
        logger?.error("Failed to send password reset email", { userId: user.id, error: err });
      });
    } else if (process.env.NODE_ENV !== "test") {
      console.log(`[DEV] Password Reset Token for ${email}: ${token}`);
    }
  };

  const confirmPasswordReset: AuthService["confirmPasswordReset"] = async (token, newPassword) => {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const resetToken = await passwordResetTokenRepository.findByTokenHash(tokenHash);

    if (!resetToken) {
      throw new AuthError("RESET_TOKEN_INVALID");
    }

    if (resetToken.used) {
      throw new AuthError("RESET_TOKEN_USED");
    }

    if (new Date(resetToken.expiresAt) < clock.now()) {
      throw new AuthError("RESET_TOKEN_EXPIRED");
    }

    const credential = await credentialRepository.getByUserId(resetToken.userId);
    if (!credential) {
      throw new AuthError("UNKNOWN_USER");
    }

    const nextHash = await passwordHasher.hash(newPassword);
    const timestamp = clock.now().toISOString();
    const nextVersion = credential.version + 1;

    await credentialRepository.updatePassword(resetToken.userId, {
      passwordHash: nextHash,
      version: nextVersion,
      passwordUpdatedAt: timestamp,
      updatedAt: timestamp,
    });

    await sessionRepository.markInactiveByUser(resetToken.userId, "password_rotated", timestamp);
    await passwordResetTokenRepository.markUsed(resetToken.id);
  };

  return {
    register,
    authenticate,
    refreshSession,
    logout,
    logoutAll,
    updatePassword,
    getUserById,
    listActiveSessions,
    generateAuthCode,
    exchangeAuthCode,
    requestPasswordReset,
    confirmPasswordReset,
  };
};

export type { AuthService as AuthDomainService };
