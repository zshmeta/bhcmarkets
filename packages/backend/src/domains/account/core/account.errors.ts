/**
 * Account Domain - Error Definitions
 *
 * This file defines all possible errors that can occur in the account domain.
 * Each error has a unique code, HTTP status, and human-readable description.
 *
 * Usage:
 *   throw new AccountError("INSUFFICIENT_BALANCE");
 *
 * The error code can be used by the frontend to show localized messages.
 */

/**
 * All possible error codes in the account domain.
 * Use these codes for programmatic error handling and i18n.
 */
export type AccountErrorCode =
  | "ACCOUNT_NOT_FOUND"        // The requested account doesn't exist
  | "INSUFFICIENT_BALANCE"     // User doesn't have enough available funds
  | "INSUFFICIENT_LOCKED"      // Trying to unlock more than what's locked
  | "ACCOUNT_FROZEN"           // Account is locked by admin (suspicious activity, etc.)
  | "ACCOUNT_CLOSED"           // Account has been permanently closed
  | "INVALID_AMOUNT"           // Amount is zero, negative, or not a valid number
  | "INVALID_CURRENCY"         // Currency code is not supported
  | "ACCOUNT_ALREADY_EXISTS"   // User already has an account for this currency
  | "CANNOT_CLOSE_WITH_BALANCE"; // Can't close account with remaining funds

/**
 * Human-readable descriptions for each error code.
 * These are default messages; the frontend may override with localized versions.
 */
export const ACCOUNT_ERROR_DESCRIPTIONS: Record<AccountErrorCode, string> = {
  ACCOUNT_NOT_FOUND: "The requested account was not found.",
  INSUFFICIENT_BALANCE: "You don't have enough available funds for this operation.",
  INSUFFICIENT_LOCKED: "Cannot unlock more funds than are currently locked.",
  ACCOUNT_FROZEN: "This account has been frozen. Please contact support.",
  ACCOUNT_CLOSED: "This account has been closed and cannot be used.",
  INVALID_AMOUNT: "The amount must be a positive number.",
  INVALID_CURRENCY: "The specified currency is not supported.",
  ACCOUNT_ALREADY_EXISTS: "You already have an account for this currency.",
  CANNOT_CLOSE_WITH_BALANCE: "Cannot close an account that still has funds. Please withdraw first.",
};

/**
 * HTTP status codes for each error type.
 * Used by the API layer to return appropriate HTTP responses.
 */
export const ACCOUNT_ERROR_HTTP_STATUS: Record<AccountErrorCode, number> = {
  ACCOUNT_NOT_FOUND: 404,
  INSUFFICIENT_BALANCE: 400,
  INSUFFICIENT_LOCKED: 400,
  ACCOUNT_FROZEN: 403,
  ACCOUNT_CLOSED: 403,
  INVALID_AMOUNT: 400,
  INVALID_CURRENCY: 400,
  ACCOUNT_ALREADY_EXISTS: 409,
  CANNOT_CLOSE_WITH_BALANCE: 400,
};

/**
 * Custom error class for the Account domain.
 *
 * This extends the standard Error class to include:
 * - A typed error code for programmatic handling
 * - An HTTP status code for API responses
 * - Optional context data for debugging
 *
 * @example
 * ```ts
 * // Simple usage
 * throw new AccountError("INSUFFICIENT_BALANCE");
 *
 * // With additional context
 * throw new AccountError("INSUFFICIENT_BALANCE", {
 *   required: "100.00",
 *   available: "50.00",
 *   currency: "USD"
 * });
 * ```
 */
export class AccountError extends Error {
  public readonly code: AccountErrorCode;
  public readonly httpStatus: number;
  public readonly context?: Record<string, unknown>;

  constructor(code: AccountErrorCode, context?: Record<string, unknown>) {
    super(ACCOUNT_ERROR_DESCRIPTIONS[code]);
    this.name = "AccountError";
    this.code = code;
    this.httpStatus = ACCOUNT_ERROR_HTTP_STATUS[code];
    this.context = context;

    // Maintains proper stack trace in V8 environments (Node, Chrome)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AccountError);
    }
  }

  /**
   * Converts the error to a JSON-serializable object for API responses.
   */
  toJSON() {
    return {
      error: this.code,
      message: this.message,
      ...(this.context && { details: this.context }),
    };
  }
}
