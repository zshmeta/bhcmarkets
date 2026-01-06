/**
 * Risk Domain - Error Definitions
 *
 * Custom error class for risk-related failures.
 * These errors should generally NOT reach the user directly - instead,
 * the RiskCheckResult should be used for user-facing rejections.
 *
 * These errors are for internal/system failures during risk processing.
 */

export type RiskErrorCode =
  | "RISK_CHECK_FAILED" // Generic risk check failure
  | "PRICE_FEED_UNAVAILABLE" // Cannot get market price
  | "EXPOSURE_CALCULATION_ERROR" // Error calculating exposure
  | "LIMITS_NOT_CONFIGURED" // Symbol/user limits not set up
  | "CIRCUIT_BREAKER_ERROR" // Error managing circuit breaker
  | "RATE_LIMIT_ERROR" // Error checking rate limits
  | "DATABASE_ERROR"; // Database operation failed

export const RISK_ERROR_DESCRIPTIONS: Record<RiskErrorCode, string> = {
  RISK_CHECK_FAILED: "Risk check could not be completed.",
  PRICE_FEED_UNAVAILABLE: "Market price feed is unavailable.",
  EXPOSURE_CALCULATION_ERROR: "Failed to calculate exposure.",
  LIMITS_NOT_CONFIGURED: "Risk limits are not configured for this symbol/user.",
  CIRCUIT_BREAKER_ERROR: "Circuit breaker operation failed.",
  RATE_LIMIT_ERROR: "Rate limit check failed.",
  DATABASE_ERROR: "Database operation failed during risk check.",
};

export const RISK_ERROR_HTTP_STATUS: Record<RiskErrorCode, number> = {
  RISK_CHECK_FAILED: 500,
  PRICE_FEED_UNAVAILABLE: 503,
  EXPOSURE_CALCULATION_ERROR: 500,
  LIMITS_NOT_CONFIGURED: 500,
  CIRCUIT_BREAKER_ERROR: 500,
  RATE_LIMIT_ERROR: 500,
  DATABASE_ERROR: 500,
};

/**
 * Internal error class for risk system failures.
 *
 * Note: For order rejections due to risk, use RiskCheckResult instead.
 * This error class is for when the risk system itself fails.
 */
export class RiskError extends Error {
  public readonly code: RiskErrorCode;
  public readonly httpStatus: number;
  public readonly context?: Record<string, unknown>;

  constructor(code: RiskErrorCode, context?: Record<string, unknown>) {
    super(RISK_ERROR_DESCRIPTIONS[code]);
    this.name = "RiskError";
    this.code = code;
    this.httpStatus = RISK_ERROR_HTTP_STATUS[code];
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RiskError);
    }
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      ...(this.context && { details: this.context }),
    };
  }
}
