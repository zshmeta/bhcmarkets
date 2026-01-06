import type { HttpRequest } from "./types.js";
import type { TokenManager, UserSessionRepository } from "../domains/auth/index.js";

export type AuthenticatedClaims = {
  sub: string;
  sessionId: string;
  role: string;
  version: number;
  issuedAt: string;
  expiresAt: string;
};

export type AuthServices = {
  tokenManager: TokenManager;
  sessionRepository: UserSessionRepository;
};

export async function getAuthUser(req: HttpRequest, services: AuthServices): Promise<AuthenticatedClaims | null> {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2) return null;

  const token = parts[1];
  if (!token) return null;

  const claims = await services.tokenManager.parseAccessToken(token);
  if (!claims) return null;

  const session = await services.sessionRepository.getById(claims.sessionId);
  if (!session) return null;

  const now = new Date();
  if (new Date(session.expiresAt) <= now) {
    await services.sessionRepository.markInactive(session.id, "expired", now.toISOString());
    return null;
  }

  if (session.status !== "active") return null;
  if (session.refreshTokenVersion !== claims.version) return null;
  if (session.userId !== claims.sub) return null;

  await services.sessionRepository.touch(session.id, {
    lastSeenAt: now.toISOString(),
    ipAddress: req.ipAddress,
    userAgent: req.headers["user-agent"],
  });

  return claims;
}

/**
 * Extracts the Bearer token from request headers.
 * Returns null if no valid Bearer token is present.
 */
export function extractBearerToken(headers: Record<string, string | string[] | undefined>): string | null {
  const authHeader = headers["authorization"];

  // Handle both string and array cases
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  if (!headerValue?.startsWith("Bearer ")) {
    return null;
  }

  const parts = headerValue.split(" ");
  if (parts.length !== 2) {
    return null;
  }

  return parts[1] || null;
}

/**
 * Verifies an access token and returns its claims.
 * Returns null if the token is invalid or expired.
 */
export async function verifyAccessToken(
  token: string,
  tokenManager: TokenManager
): Promise<AuthenticatedClaims | null> {
  try {
    const claims = await tokenManager.parseAccessToken(token);
    return claims as AuthenticatedClaims | null;
  } catch {
    return null;
  }
}
