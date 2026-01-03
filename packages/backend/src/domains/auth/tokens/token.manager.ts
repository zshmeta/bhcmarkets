/**
 * Token Manager - Abstract interface for token issuance and validation.
 * 
 * This interface defines the contract for token management without
 * coupling to a specific implementation (JWT, PASETO, etc.).
 */

import type { UUID, UserRole } from "../core/auth.types.js";

/**
 * Claims contained in an access token.
 * Access tokens are short-lived and grant access to protected resources.
 */
export interface AccessTokenClaims {
  /** User ID (subject) */
  sub: UUID;
  
  /** Session ID */
  sessionId: UUID;
  
  /** User role for authorization */
  role: UserRole;
  
  /** Token version (for invalidation) */
  version: number;
  
  /** Issued at timestamp */
  issuedAt: string;
  
  /** Expiration timestamp */
  expiresAt: string;
}

/**
 * Claims contained in a refresh token.
 * Refresh tokens are long-lived and used to issue new access tokens.
 */
export interface RefreshTokenClaims {
  /** User ID (subject) */
  sub: UUID;
  
  /** Session ID */
  sessionId: UUID;
  
  /** Session version (incremented on rotation) */
  sessionVersion: number;
  
  /** Password version (for invalidation on password change) */
  passwordVersion: number;
  
  /** Issued at timestamp */
  issuedAt: string;
  
  /** Expiration timestamp */
  expiresAt: string;
}

/**
 * Token manager interface.
 * Abstracts token creation and parsing logic.
 */
export interface TokenManager {
  /**
   * Issue a new access token.
   * @param claims - Token claims
   * @param ttlSeconds - Time-to-live in seconds
   * @returns Signed token string
   */
  issueAccessToken(claims: AccessTokenClaims, ttlSeconds: number): Promise<string>;
  
  /**
   * Issue a new refresh token.
   * @param claims - Token claims
   * @param ttlSeconds - Time-to-live in seconds
   * @returns Signed token string
   */
  issueRefreshToken(claims: RefreshTokenClaims, ttlSeconds: number): Promise<string>;
  
  /**
   * Parse and validate an access token.
   * @param token - Token string
   * @returns Token claims if valid, null otherwise
   */
  parseAccessToken(token: string): Promise<AccessTokenClaims | null>;
  
  /**
   * Parse and validate a refresh token.
   * @param token - Token string
   * @returns Token claims if valid, null otherwise
   */
  parseRefreshToken(token: string): Promise<RefreshTokenClaims | null>;
}

/**
 * Token validation result.
 */
export interface TokenValidationResult<T> {
  /** Whether the token is valid */
  valid: boolean;
  
  /** Token claims (if valid) */
  claims?: T;
  
  /** Error message (if invalid) */
  error?: string;
  
  /** Error code */
  errorCode?: "EXPIRED" | "INVALID_SIGNATURE" | "MALFORMED" | "NOT_YET_VALID";
}
