/**
 * Enterprise-grade auth error codes with detailed descriptions.
 * 
 * These error codes are part of the auth domain's public API contract.
 * They are used to communicate auth failures across system boundaries.
 */

/**
 * All possible auth error codes in the system.
 * Each code represents a specific failure mode.
 */
export type AuthErrorCode =
  // Registration errors
  | "EMAIL_ALREADY_REGISTERED"
  | "EMAIL_INVALID"
  | "PASSWORD_TOO_WEAK"
  | "PASSWORD_BREACHED"
  | "REGISTRATION_DISABLED"
  
  // Authentication errors
  | "INVALID_CREDENTIALS"
  | "USER_NOT_ACTIVE"
  | "USER_SUSPENDED"
  | "USER_DELETED"
  | "ACCOUNT_LOCKED"
  | "TOO_MANY_ATTEMPTS"
  
  // Session errors
  | "SESSION_NOT_FOUND"
  | "SESSION_REVOKED"
  | "SESSION_EXPIRED"
  | "SESSION_INVALID"
  | "CONCURRENT_SESSION_LIMIT"
  
  // Token errors
  | "REFRESH_TOKEN_INVALID"
  | "REFRESH_TOKEN_REUSED"
  | "REFRESH_TOKEN_EXPIRED"
  | "ACCESS_TOKEN_INVALID"
  | "ACCESS_TOKEN_EXPIRED"
  | "TOKEN_SIGNATURE_INVALID"
  
  // User errors
  | "UNKNOWN_USER"
  | "USER_NOT_FOUND"
  
  // Password errors
  | "PASSWORD_MISMATCH"
  | "PASSWORD_HISTORY_CONFLICT"
  | "PASSWORD_EXPIRED"
  
  // MFA errors
  | "MFA_REQUIRED"
  | "MFA_CODE_INVALID"
  | "MFA_CODE_EXPIRED"
  | "MFA_NOT_ENABLED"
  | "MFA_ALREADY_ENABLED"
  | "RECOVERY_CODE_INVALID"
  
  // Email verification errors
  | "EMAIL_NOT_VERIFIED"
  | "VERIFICATION_TOKEN_INVALID"
  | "VERIFICATION_TOKEN_EXPIRED"
  
  // Password reset errors
  | "RESET_TOKEN_INVALID"
  | "RESET_TOKEN_EXPIRED"
  | "RESET_TOKEN_USED"
  
  // Security errors
  | "SUSPICIOUS_ACTIVITY"
  | "RATE_LIMIT_EXCEEDED"
  | "IP_BLOCKED"
  | "DEVICE_NOT_RECOGNIZED"
  
  // Generic errors
  | "INTERNAL_ERROR"
  | "VALIDATION_ERROR"
  | "CONFIGURATION_ERROR";

/**
 * Human-readable descriptions for each error code.
 * Used for logging, debugging, and developer communication.
 */
export const AUTH_ERROR_DESCRIPTIONS: Record<AuthErrorCode, string> = {
  // Registration
  EMAIL_ALREADY_REGISTERED: "An account with this email already exists",
  EMAIL_INVALID: "The email address is invalid",
  PASSWORD_TOO_WEAK: "Password does not meet minimum security requirements",
  PASSWORD_BREACHED: "This password has been found in a data breach and cannot be used",
  REGISTRATION_DISABLED: "New registrations are currently disabled",
  
  // Authentication
  INVALID_CREDENTIALS: "Invalid email or password",
  USER_NOT_ACTIVE: "User account is not active",
  USER_SUSPENDED: "User account has been suspended",
  USER_DELETED: "User account has been deleted",
  ACCOUNT_LOCKED: "Account is temporarily locked due to too many failed login attempts",
  TOO_MANY_ATTEMPTS: "Too many authentication attempts, please try again later",
  
  // Sessions
  SESSION_NOT_FOUND: "Session not found or has been revoked",
  SESSION_REVOKED: "Session has been revoked",
  SESSION_EXPIRED: "Session has expired",
  SESSION_INVALID: "Session is invalid",
  CONCURRENT_SESSION_LIMIT: "Maximum number of concurrent sessions reached",
  
  // Tokens
  REFRESH_TOKEN_INVALID: "Refresh token is invalid",
  REFRESH_TOKEN_REUSED: "Refresh token has already been used (possible security breach)",
  REFRESH_TOKEN_EXPIRED: "Refresh token has expired",
  ACCESS_TOKEN_INVALID: "Access token is invalid",
  ACCESS_TOKEN_EXPIRED: "Access token has expired",
  TOKEN_SIGNATURE_INVALID: "Token signature verification failed",
  
  // Users
  UNKNOWN_USER: "User not found",
  USER_NOT_FOUND: "User account not found",
  
  // Passwords
  PASSWORD_MISMATCH: "Current password is incorrect",
  PASSWORD_HISTORY_CONFLICT: "Password has been used recently and cannot be reused",
  PASSWORD_EXPIRED: "Password has expired and must be changed",
  
  // MFA
  MFA_REQUIRED: "Multi-factor authentication is required",
  MFA_CODE_INVALID: "MFA verification code is invalid",
  MFA_CODE_EXPIRED: "MFA verification code has expired",
  MFA_NOT_ENABLED: "MFA is not enabled for this account",
  MFA_ALREADY_ENABLED: "MFA is already enabled for this account",
  RECOVERY_CODE_INVALID: "Recovery code is invalid or has already been used",
  
  // Email verification
  EMAIL_NOT_VERIFIED: "Email address has not been verified",
  VERIFICATION_TOKEN_INVALID: "Email verification token is invalid",
  VERIFICATION_TOKEN_EXPIRED: "Email verification token has expired",
  
  // Password reset
  RESET_TOKEN_INVALID: "Password reset token is invalid",
  RESET_TOKEN_EXPIRED: "Password reset token has expired",
  RESET_TOKEN_USED: "Password reset token has already been used",
  
  // Security
  SUSPICIOUS_ACTIVITY: "Suspicious activity detected, session terminated",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded, please try again later",
  IP_BLOCKED: "Access from this IP address has been blocked",
  DEVICE_NOT_RECOGNIZED: "Device not recognized, additional verification required",
  
  // Generic
  INTERNAL_ERROR: "An internal error occurred",
  VALIDATION_ERROR: "Request validation failed",
  CONFIGURATION_ERROR: "Auth service configuration error",
};

/**
 * HTTP status codes for each error type.
 * Used by controllers to map domain errors to HTTP responses.
 */
export const AUTH_ERROR_HTTP_STATUS: Record<AuthErrorCode, number> = {
  // Registration - 400 Bad Request or 409 Conflict
  EMAIL_ALREADY_REGISTERED: 409,
  EMAIL_INVALID: 400,
  PASSWORD_TOO_WEAK: 400,
  PASSWORD_BREACHED: 400,
  REGISTRATION_DISABLED: 403,
  
  // Authentication - 401 Unauthorized or 403 Forbidden
  INVALID_CREDENTIALS: 401,
  USER_NOT_ACTIVE: 403,
  USER_SUSPENDED: 403,
  USER_DELETED: 403,
  ACCOUNT_LOCKED: 403,
  TOO_MANY_ATTEMPTS: 429,
  
  // Sessions - 401 Unauthorized
  SESSION_NOT_FOUND: 401,
  SESSION_REVOKED: 401,
  SESSION_EXPIRED: 401,
  SESSION_INVALID: 401,
  CONCURRENT_SESSION_LIMIT: 409,
  
  // Tokens - 401 Unauthorized
  REFRESH_TOKEN_INVALID: 401,
  REFRESH_TOKEN_REUSED: 401,
  REFRESH_TOKEN_EXPIRED: 401,
  ACCESS_TOKEN_INVALID: 401,
  ACCESS_TOKEN_EXPIRED: 401,
  TOKEN_SIGNATURE_INVALID: 401,
  
  // Users - 404 Not Found
  UNKNOWN_USER: 404,
  USER_NOT_FOUND: 404,
  
  // Passwords - 400 Bad Request or 401 Unauthorized
  PASSWORD_MISMATCH: 401,
  PASSWORD_HISTORY_CONFLICT: 400,
  PASSWORD_EXPIRED: 403,
  
  // MFA - 401 Unauthorized or 400 Bad Request
  MFA_REQUIRED: 401,
  MFA_CODE_INVALID: 401,
  MFA_CODE_EXPIRED: 401,
  MFA_NOT_ENABLED: 400,
  MFA_ALREADY_ENABLED: 409,
  RECOVERY_CODE_INVALID: 401,
  
  // Email verification - 400 Bad Request or 403 Forbidden
  EMAIL_NOT_VERIFIED: 403,
  VERIFICATION_TOKEN_INVALID: 400,
  VERIFICATION_TOKEN_EXPIRED: 400,
  
  // Password reset - 400 Bad Request
  RESET_TOKEN_INVALID: 400,
  RESET_TOKEN_EXPIRED: 400,
  RESET_TOKEN_USED: 400,
  
  // Security - 403 Forbidden or 429 Too Many Requests
  SUSPICIOUS_ACTIVITY: 403,
  RATE_LIMIT_EXCEEDED: 429,
  IP_BLOCKED: 403,
  DEVICE_NOT_RECOGNIZED: 403,
  
  // Generic - 500 Internal Server Error or 400 Bad Request
  INTERNAL_ERROR: 500,
  VALIDATION_ERROR: 400,
  CONFIGURATION_ERROR: 500,
};

/**
 * Enterprise-grade auth error class.
 * 
 * Provides structured error information including:
 * - Error code (for programmatic handling)
 * - Human-readable message (for logging/debugging)
 * - HTTP status code (for API responses)
 * - Additional metadata (for detailed logging)
 */
export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly httpStatus: number;
  public readonly metadata?: Record<string, unknown>;

  constructor(
    code: AuthErrorCode,
    message?: string,
    metadata?: Record<string, unknown>
  ) {
    // Use custom message if provided, otherwise use default description
    super(message ?? AUTH_ERROR_DESCRIPTIONS[code]);
    
    this.name = "AuthError";
    this.code = code;
    this.httpStatus = AUTH_ERROR_HTTP_STATUS[code];
    this.metadata = metadata;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }

  /**
   * Convert error to JSON for API responses.
   * Does not include sensitive information.
   */
  toJSON() {
    return {
      error: this.code,
      message: this.message,
      ...(this.metadata && { details: this.metadata }),
    };
  }

  /**
   * Check if an error is an AuthError
   */
  static isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError;
  }
}
