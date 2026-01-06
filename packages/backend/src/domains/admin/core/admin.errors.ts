/**
 * Admin Domain - Error Definitions
 *
 * Admin errors are serious - they often indicate:
 * 1. Authorization failures (someone trying to do something they shouldn't)
 * 2. Invalid operations (can't suspend an already suspended user)
 * 3. Missing audit requirements (no reason provided)
 */

/**
 * Error codes for the Admin domain.
 */
export type AdminErrorCode =
  // Authorization
  | "UNAUTHORIZED" // Not authenticated
  | "FORBIDDEN" // Authenticated but not allowed
  | "INSUFFICIENT_PERMISSIONS" // Role doesn't have required permission
  // Validation
  | "INVALID_INPUT" // Bad request data
  | "REASON_REQUIRED" // Admin action requires justification
  | "INVALID_AMOUNT" // Invalid balance operation amount
  // User operations
  | "USER_NOT_FOUND"
  | "USER_ALREADY_SUSPENDED"
  | "USER_NOT_SUSPENDED"
  | "CANNOT_MODIFY_OWN_ROLE" // Admin can't change their own role
  | "CANNOT_SUSPEND_SELF" // Admin can't suspend themselves
  // Account operations
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_ALREADY_FROZEN"
  | "ACCOUNT_NOT_FROZEN"
  | "INSUFFICIENT_BALANCE" // For withdrawals
  // Symbol operations
  | "SYMBOL_NOT_FOUND"
  | "SYMBOL_ALREADY_EXISTS"
  | "SYMBOL_ALREADY_ENABLED"
  | "SYMBOL_ALREADY_DISABLED"
  // Risk operations
  | "CIRCUIT_BREAKER_ALREADY_ACTIVE"
  | "CIRCUIT_BREAKER_NOT_ACTIVE"
  // Order operations (Phase 2)
  | "ORDER_NOT_FOUND"
  | "ORDER_ALREADY_FILLED"
  | "ORDER_ALREADY_CANCELLED"
  // Position operations (Phase 2)
  | "POSITION_NOT_FOUND"
  | "POSITION_ALREADY_CLOSED"
  // System
  | "INTERNAL_ERROR";

/**
 * Admin Error class with typed error codes.
 */
export class AdminError extends Error {
  public readonly code: AdminErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly httpStatus: number;

  constructor(
    code: AdminErrorCode,
    message?: string,
    details?: Record<string, unknown>
  ) {
    super(message || getDefaultMessage(code));
    this.name = "AdminError";
    this.code = code;
    this.details = details;
    this.httpStatus = getHttpStatus(code);

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts error to JSON for API responses.
   */
  toJSON(): { error: string; code: AdminErrorCode; details?: Record<string, unknown> } {
    return {
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * Default error messages for each code.
 */
function getDefaultMessage(code: AdminErrorCode): string {
  const messages: Record<AdminErrorCode, string> = {
    UNAUTHORIZED: "Authentication required.",
    FORBIDDEN: "You do not have permission to perform this action.",
    INSUFFICIENT_PERMISSIONS:
      "Your role does not have the required permissions.",
    INVALID_INPUT: "Invalid input data.",
    REASON_REQUIRED: "A reason must be provided for this action.",
    INVALID_AMOUNT: "Invalid amount specified.",
    USER_NOT_FOUND: "User not found.",
    USER_ALREADY_SUSPENDED: "User is already suspended.",
    USER_NOT_SUSPENDED: "User is not suspended.",
    CANNOT_MODIFY_OWN_ROLE: "You cannot modify your own role.",
    CANNOT_SUSPEND_SELF: "You cannot suspend yourself.",
    ACCOUNT_NOT_FOUND: "Account not found.",
    ACCOUNT_ALREADY_FROZEN: "Account is already frozen.",
    ACCOUNT_NOT_FROZEN: "Account is not frozen.",
    INSUFFICIENT_BALANCE: "Insufficient balance for this operation.",
    SYMBOL_NOT_FOUND: "Symbol not found.",
    SYMBOL_ALREADY_EXISTS: "Symbol already exists.",
    SYMBOL_ALREADY_ENABLED: "Trading is already enabled for this symbol.",
    SYMBOL_ALREADY_DISABLED: "Trading is already disabled for this symbol.",
    CIRCUIT_BREAKER_ALREADY_ACTIVE: "Circuit breaker is already active.",
    CIRCUIT_BREAKER_NOT_ACTIVE: "Circuit breaker is not currently active.",
    ORDER_NOT_FOUND: "Order not found.",
    ORDER_ALREADY_FILLED: "Cannot cancel a filled order.",
    ORDER_ALREADY_CANCELLED: "Order is already cancelled.",
    POSITION_NOT_FOUND: "Position not found.",
    POSITION_ALREADY_CLOSED: "Position is already closed.",
    INTERNAL_ERROR: "An internal error occurred.",
  };
  return messages[code];
}

/**
 * HTTP status codes for each error code.
 */
function getHttpStatus(code: AdminErrorCode): number {
  const statusMap: Record<AdminErrorCode, number> = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    INSUFFICIENT_PERMISSIONS: 403,
    INVALID_INPUT: 400,
    REASON_REQUIRED: 400,
    INVALID_AMOUNT: 400,
    USER_NOT_FOUND: 404,
    USER_ALREADY_SUSPENDED: 409,
    USER_NOT_SUSPENDED: 409,
    CANNOT_MODIFY_OWN_ROLE: 400,
    CANNOT_SUSPEND_SELF: 400,
    ACCOUNT_NOT_FOUND: 404,
    ACCOUNT_ALREADY_FROZEN: 409,
    ACCOUNT_NOT_FROZEN: 409,
    INSUFFICIENT_BALANCE: 400,
    SYMBOL_NOT_FOUND: 404,
    SYMBOL_ALREADY_EXISTS: 409,
    SYMBOL_ALREADY_ENABLED: 409,
    SYMBOL_ALREADY_DISABLED: 409,
    CIRCUIT_BREAKER_ALREADY_ACTIVE: 409,
    CIRCUIT_BREAKER_NOT_ACTIVE: 409,
    ORDER_NOT_FOUND: 404,
    ORDER_ALREADY_FILLED: 409,
    ORDER_ALREADY_CANCELLED: 409,
    POSITION_NOT_FOUND: 404,
    POSITION_ALREADY_CLOSED: 409,
    INTERNAL_ERROR: 500,
  };
  return statusMap[code];
}

/**
 * Type guard to check if an error is an AdminError.
 */
export function isAdminError(error: unknown): error is AdminError {
  return error instanceof AdminError;
}
