/**
 * JWT Access Token Implementation.
 * 
 * Handles creation and validation of JWT access tokens using the `jose` library.
 * Access tokens are short-lived and used for API authentication.
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { AccessTokenClaims, TokenValidationResult } from "./token.manager.js";

/**
 * Configuration for JWT access token manager.
 */
export interface JwtAccessConfig {
  /** Secret key for signing (must be at least 32 characters) */
  secret: string;
  
  /** Token issuer */
  issuer: string;
  
  /** Token audience */
  audience: string | string[];
  
  /** Algorithm to use (default: HS256) */
  algorithm?: "HS256" | "HS384" | "HS512";
}

/**
 * JWT Access Token Manager.
 * Creates and validates JWT access tokens.
 */
export class JwtAccessTokenManager {
  private readonly secretKey: Uint8Array;
  private readonly config: Required<JwtAccessConfig>;

  constructor(config: JwtAccessConfig) {
    if (!config.secret || config.secret.length < 32) {
      throw new Error("JWT access secret must be at least 32 characters");
    }

    this.config = {
      ...config,
      algorithm: config.algorithm || "HS256",
    };

    // Convert secret to Uint8Array for jose
    this.secretKey = new TextEncoder().encode(this.config.secret);
  }

  /**
   * Issue a new access token.
   * @param claims - Access token claims
   * @param ttlSeconds - Time-to-live in seconds
   * @returns Signed JWT token
   */
  async issueAccessToken(claims: AccessTokenClaims, ttlSeconds: number): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + ttlSeconds;

    // Create JWT with standard claims
    const jwt = await new SignJWT({
      // Custom claims
      userId: claims.sub,
      sessionId: claims.sessionId,
      role: claims.role,
      version: claims.version,
      issuedAt: claims.issuedAt,
      expiresAt: claims.expiresAt,
    } as JWTPayload)
      .setProtectedHeader({ alg: this.config.algorithm, typ: "JWT" })
      .setSubject(claims.sub)
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .setIssuer(this.config.issuer)
      .setAudience(this.config.audience)
      .sign(this.secretKey);

    return jwt;
  }

  /**
   * Parse and validate an access token.
   * @param token - JWT token string
   * @returns Validation result with claims if valid
   */
  async parseAccessToken(token: string): Promise<TokenValidationResult<AccessTokenClaims>> {
    try {
      const { payload } = await jwtVerify(token, this.secretKey, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      // Extract custom claims
      const claims: AccessTokenClaims = {
        sub: payload.userId as string,
        sessionId: payload.sessionId as string,
        role: payload.role as any,
        version: payload.version as number,
        issuedAt: payload.issuedAt as string,
        expiresAt: payload.expiresAt as string,
      };

      return {
        valid: true,
        claims,
      };
    } catch (error: any) {
      // Determine error type
      let errorCode: TokenValidationResult<AccessTokenClaims>["errorCode"] = "INVALID_SIGNATURE";
      let errorMessage = "Invalid token";

      if (error.code === "ERR_JWT_EXPIRED") {
        errorCode = "EXPIRED";
        errorMessage = "Token has expired";
      } else if (error.code === "ERR_JWT_INVALID") {
        errorCode = "MALFORMED";
        errorMessage = "Token is malformed";
      } else if (error.code === "ERR_JWT_CLAIM_VALIDATION_FAILED") {
        if (error.claim === "nbf") {
          errorCode = "NOT_YET_VALID";
          errorMessage = "Token is not yet valid";
        }
      }

      return {
        valid: false,
        error: errorMessage,
        errorCode,
      };
    }
  }

  /**
   * Verify token without parsing claims (fast check).
   * @param token - JWT token string
   * @returns True if token signature is valid
   */
  async verifySignature(token: string): Promise<boolean> {
    try {
      await jwtVerify(token, this.secretKey);
      return true;
    } catch {
      return false;
    }
  }
}
