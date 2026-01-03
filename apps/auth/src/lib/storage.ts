/**
 * Token Storage Abstraction.
 * 
 * Provides secure storage for JWT tokens with multiple strategies:
 * - Memory (most secure, lost on refresh)
 * - LocalStorage (persistent, XSS vulnerable)
 * - SessionStorage (tab-scoped, XSS vulnerable)
 * 
 * For production, consider using httpOnly cookies set by the backend.
 */

/**
 * Storage strategy type.
 */
export type StorageStrategy = "memory" | "localStorage" | "sessionStorage";

/**
 * Token storage interface.
 */
export interface TokenStorage {
  /**
   * Get access token.
   */
  getAccessToken(): string | null;
  
  /**
   * Set access token.
   */
  setAccessToken(token: string): void;
  
  /**
   * Get refresh token.
   */
  getRefreshToken(): string | null;
  
  /**
   * Set refresh token.
   */
  setRefreshToken(token: string): void;
  
  /**
   * Clear all tokens.
   */
  clearTokens(): void;
  
  /**
   * Check if user is authenticated (has tokens).
   */
  hasTokens(): boolean;
}

/**
 * Memory storage implementation (most secure).
 * Tokens are lost on page refresh.
 */
class MemoryStorage implements TokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setRefreshToken(token: string): void {
    this.refreshToken = token;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  hasTokens(): boolean {
    return this.accessToken !== null && this.refreshToken !== null;
  }
}

/**
 * LocalStorage implementation (persistent but XSS vulnerable).
 */
class LocalStorageImpl implements TokenStorage {
  private readonly accessTokenKey = "auth_access_token";
  private readonly refreshTokenKey = "auth_refresh_token";

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  setAccessToken(token: string): void {
    localStorage.setItem(this.accessTokenKey, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.refreshTokenKey, token);
  }

  clearTokens(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  hasTokens(): boolean {
    return this.getAccessToken() !== null && this.getRefreshToken() !== null;
  }
}

/**
 * SessionStorage implementation (tab-scoped, XSS vulnerable).
 */
class SessionStorageImpl implements TokenStorage {
  private readonly accessTokenKey = "auth_access_token";
  private readonly refreshTokenKey = "auth_refresh_token";

  getAccessToken(): string | null {
    return sessionStorage.getItem(this.accessTokenKey);
  }

  setAccessToken(token: string): void {
    sessionStorage.setItem(this.accessTokenKey, token);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.refreshTokenKey);
  }

  setRefreshToken(token: string): void {
    sessionStorage.setItem(this.refreshTokenKey, token);
  }

  clearTokens(): void {
    sessionStorage.removeItem(this.accessTokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
  }

  hasTokens(): boolean {
    return this.getAccessToken() !== null && this.getRefreshToken() !== null;
  }
}

/**
 * Create token storage with specified strategy.
 */
export function createTokenStorage(strategy: StorageStrategy = "localStorage"): TokenStorage {
  switch (strategy) {
    case "memory":
      return new MemoryStorage();
    case "localStorage":
      return new LocalStorageImpl();
    case "sessionStorage":
      return new SessionStorageImpl();
    default:
      return new LocalStorageImpl();
  }
}

/**
 * Default token storage instance.
 * Uses localStorage by default for persistence across page refreshes.
 * 
 * SECURITY NOTE: For production applications, consider:
 * 1. Using memory storage with session restoration from backend
 * 2. Using httpOnly cookies (requires backend support)
 * 3. Implementing token refresh on app initialization
 */
export const tokenStorage = createTokenStorage("localStorage");
