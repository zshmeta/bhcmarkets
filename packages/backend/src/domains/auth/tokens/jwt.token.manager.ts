/**
 * Combined JWT Token Manager.
 * 
 * Implements the TokenManager interface using separate JWT implementations
 * for access and refresh tokens.
 */

import type { TokenManager, AccessTokenClaims, RefreshTokenClaims } from "./token.manager.js";
import { JwtAccessTokenManager, type JwtAccessConfig } from "./jwt.access.js";
import { JwtRefreshTokenManager, type JwtRefreshConfig } from "./jwt.refresh.js";

/**
 * Configuration for the combined JWT token manager.
 */
export interface JwtTokenManagerConfig {
  /** Access token configuration */
  access: JwtAccessConfig;
  
  /** Refresh token configuration */
  refresh: JwtRefreshConfig;
}

/**
 * JWT Token Manager implementation.
 * 
 * Uses separate secrets for access and refresh tokens as a security best practice.
 * This limits the blast radius if one secret is compromised.
 */
export class JwtTokenManager implements TokenManager {
  private readonly accessManager: JwtAccessTokenManager;
  private readonly refreshManager: JwtRefreshTokenManager;

  constructor(config: JwtTokenManagerConfig) {
    this.accessManager = new JwtAccessTokenManager(config.access);
    this.refreshManager = new JwtRefreshTokenManager(config.refresh);
  }

  /**
   * Issue a new access token.
   */
  async issueAccessToken(claims: AccessTokenClaims, ttlSeconds: number): Promise<string> {
    return this.accessManager.issueAccessToken(claims, ttlSeconds);
  }

  /**
   * Issue a new refresh token.
   */
  async issueRefreshToken(claims: RefreshTokenClaims, ttlSeconds: number): Promise<string> {
    return this.refreshManager.issueRefreshToken(claims, ttlSeconds);
  }

  /**
   * Parse and validate an access token.
   * Returns null if the token is invalid or expired.
   */
  async parseAccessToken(token: string): Promise<AccessTokenClaims | null> {
    const result = await this.accessManager.parseAccessToken(token);
    return result.valid ? result.claims! : null;
  }

  /**
   * Parse and validate a refresh token.
   * Returns null if the token is invalid or expired.
   */
  async parseRefreshToken(token: string): Promise<RefreshTokenClaims | null> {
    const result = await this.refreshManager.parseRefreshToken(token);
    return result.valid ? result.claims! : null;
  }
}

/**
 * Create a JWT token manager from environment variables or configuration.
 */
export function createJwtTokenManager(config: Partial<JwtTokenManagerConfig>): JwtTokenManager {
  // Load from environment if not provided
  const accessSecret = config.access?.secret || process.env.AUTH_JWT_ACCESS_SECRET || "";
  const refreshSecret = config.refresh?.secret || process.env.AUTH_JWT_REFRESH_SECRET || "";
  const issuer = config.access?.issuer || process.env.AUTH_JWT_ISSUER || "bhcmarkets";
  const audience = config.access?.audience || process.env.AUTH_JWT_AUDIENCE || "bhcmarkets-api";

  // Validate secrets
  if (!accessSecret || accessSecret.length < 32) {
    throw new Error("JWT access secret must be at least 32 characters. Set AUTH_JWT_ACCESS_SECRET environment variable.");
  }
  if (!refreshSecret || refreshSecret.length < 32) {
    throw new Error("JWT refresh secret must be at least 32 characters. Set AUTH_JWT_REFRESH_SECRET environment variable.");
  }
  if (accessSecret === refreshSecret) {
    throw new Error("JWT access and refresh secrets must be different for security.");
  }

  return new JwtTokenManager({
    access: {
      secret: accessSecret,
      issuer,
      audience,
      algorithm: config.access?.algorithm || "HS256",
    },
    refresh: {
      secret: refreshSecret,
      issuer,
      audience,
      algorithm: config.refresh?.algorithm || "HS256",
    },
  });
}
