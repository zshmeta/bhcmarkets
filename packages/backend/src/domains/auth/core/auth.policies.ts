/**
 * Enterprise-grade auth policies.
 * 
 * This file centralizes all security policies for the auth domain.
 * Policies can be adjusted without changing service logic.
 */

/**
 * Password strength requirements and validation rules.
 */
export interface PasswordPolicy {
  /** Minimum password length */
  minLength: number;
  
  /** Maximum password length (prevents DOS attacks) */
  maxLength: number;
  
  /** Require at least one uppercase letter */
  requireUppercase: boolean;
  
  /** Require at least one lowercase letter */
  requireLowercase: boolean;
  
  /** Require at least one digit */
  requireDigit: boolean;
  
  /** Require at least one special character */
  requireSpecialChar: boolean;
  
  /** List of special characters that are considered valid */
  specialChars: string;
  
  /** Prevent common passwords (dictionary check) */
  preventCommonPasswords: boolean;
  
  /** Check against known breached password databases */
  checkBreachedPasswords: boolean;
  
  /** Minimum password entropy in bits (optional advanced check) */
  minEntropy?: number;
  
  /** Maximum password age in days (0 = no expiration) */
  maxAgeInDays: number;
  
  /** Number of previous passwords to remember (prevent reuse) */
  passwordHistorySize: number;
}

/**
 * Default password policy (enterprise-grade security).
 */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialChar: true,
  specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  preventCommonPasswords: true,
  checkBreachedPasswords: false, // Requires external API, disabled by default
  minEntropy: 50, // ~50 bits is considered strong
  maxAgeInDays: 0, // No expiration by default
  passwordHistorySize: 5, // Remember last 5 passwords
};

/**
 * Session management policies.
 */
export interface SessionPolicy {
  /** Access token time-to-live in seconds */
  accessTokenTtlSeconds: number;
  
  /** Refresh token time-to-live in seconds */
  refreshTokenTtlSeconds: number;
  
  /** Maximum number of concurrent sessions per user */
  maxSessionsPerUser: number;
  
  /** Maximum number of refresh token rotations before requiring re-auth */
  maxRefreshRotations: number;
  
  /** Enable automatic session extension on activity */
  enableSlidingExpiration: boolean;
  
  /** Maximum idle time before session expires (seconds) */
  maxIdleTimeSeconds: number;
  
  /** Enable session binding to IP address */
  bindToIpAddress: boolean;
  
  /** Enable session binding to user agent */
  bindToUserAgent: boolean;
  
  /** Enable device fingerprinting */
  enableDeviceFingerprinting: boolean;
  
  /** Revoke all sessions on password change */
  revokeSessionsOnPasswordChange: boolean;
}

/**
 * Default session policy (enterprise-grade security).
 */
export const DEFAULT_SESSION_POLICY: SessionPolicy = {
  accessTokenTtlSeconds: 15 * 60, // 15 minutes
  refreshTokenTtlSeconds: 30 * 24 * 60 * 60, // 30 days
  maxSessionsPerUser: 10,
  maxRefreshRotations: 1000, // Effectively unlimited for 30 days
  enableSlidingExpiration: true,
  maxIdleTimeSeconds: 24 * 60 * 60, // 24 hours
  bindToIpAddress: false, // Can be problematic with mobile users
  bindToUserAgent: true,
  enableDeviceFingerprinting: true,
  revokeSessionsOnPasswordChange: true,
};

/**
 * Account lockout policies for failed login attempts.
 */
export interface LockoutPolicy {
  /** Enable account lockout on failed attempts */
  enabled: boolean;
  
  /** Number of failed attempts before lockout */
  maxAttempts: number;
  
  /** Lockout duration in seconds */
  lockoutDurationSeconds: number;
  
  /** Time window for counting failed attempts (seconds) */
  attemptWindowSeconds: number;
  
  /** Exponential backoff for repeated lockouts */
  useExponentialBackoff: boolean;
  
  /** Maximum lockout duration with exponential backoff (seconds) */
  maxLockoutDurationSeconds: number;
  
  /** Reset failed attempt counter on successful login */
  resetOnSuccess: boolean;
}

/**
 * Default lockout policy (enterprise-grade security).
 */
export const DEFAULT_LOCKOUT_POLICY: LockoutPolicy = {
  enabled: true,
  maxAttempts: 5,
  lockoutDurationSeconds: 15 * 60, // 15 minutes
  attemptWindowSeconds: 15 * 60, // 15 minutes
  useExponentialBackoff: true,
  maxLockoutDurationSeconds: 24 * 60 * 60, // 24 hours
  resetOnSuccess: true,
};

/**
 * Multi-factor authentication policies.
 */
export interface MfaPolicy {
  /** Enable MFA support */
  enabled: boolean;
  
  /** Require MFA for all users */
  requiredForAll: boolean;
  
  /** Require MFA for admin users */
  requiredForAdmins: boolean;
  
  /** TOTP code validity window (±N periods) */
  totpWindowPeriods: number;
  
  /** TOTP period in seconds (usually 30) */
  totpPeriodSeconds: number;
  
  /** Number of recovery codes to generate */
  recoveryCodeCount: number;
  
  /** Recovery code length */
  recoveryCodeLength: number;
  
  /** Allow "remember this device" functionality */
  allowTrustedDevices: boolean;
  
  /** Trusted device validity in days */
  trustedDeviceDays: number;
}

/**
 * Default MFA policy.
 */
export const DEFAULT_MFA_POLICY: MfaPolicy = {
  enabled: true,
  requiredForAll: false,
  requiredForAdmins: true,
  totpWindowPeriods: 1, // Allow ±1 period (90 seconds total window)
  totpPeriodSeconds: 30,
  recoveryCodeCount: 10,
  recoveryCodeLength: 8,
  allowTrustedDevices: true,
  trustedDeviceDays: 30,
};

/**
 * Device fingerprinting and tracking policies.
 */
export interface DevicePolicy {
  /** Enable device fingerprinting */
  enabled: boolean;
  
  /** Track device fingerprint changes */
  trackChanges: boolean;
  
  /** Alert on new device login */
  alertOnNewDevice: boolean;
  
  /** Require additional verification on new device */
  requireVerificationOnNewDevice: boolean;
  
  /** Maximum number of trusted devices per user */
  maxTrustedDevices: number;
  
  /** Device fingerprint components to track */
  fingerprintComponents: {
    userAgent: boolean;
    screenResolution: boolean;
    timezone: boolean;
    language: boolean;
    platform: boolean;
  };
}

/**
 * Default device policy.
 */
export const DEFAULT_DEVICE_POLICY: DevicePolicy = {
  enabled: true,
  trackChanges: true,
  alertOnNewDevice: true,
  requireVerificationOnNewDevice: false, // Can be enabled for high-security environments
  maxTrustedDevices: 20,
  fingerprintComponents: {
    userAgent: true,
    screenResolution: false, // Less reliable
    timezone: true,
    language: true,
    platform: true,
  },
};

/**
 * Email verification policies.
 */
export interface EmailVerificationPolicy {
  /** Require email verification for new accounts */
  required: boolean;
  
  /** Block login until email is verified */
  blockLoginUntilVerified: boolean;
  
  /** Verification token validity in seconds */
  tokenValiditySeconds: number;
  
  /** Maximum number of verification emails per hour */
  maxEmailsPerHour: number;
  
  /** Delete unverified accounts after N days */
  deleteUnverifiedAfterDays: number;
}

/**
 * Default email verification policy.
 */
export const DEFAULT_EMAIL_VERIFICATION_POLICY: EmailVerificationPolicy = {
  required: true,
  blockLoginUntilVerified: false, // Allow login but limit functionality
  tokenValiditySeconds: 24 * 60 * 60, // 24 hours
  maxEmailsPerHour: 3,
  deleteUnverifiedAfterDays: 30,
};

/**
 * Password reset policies.
 */
export interface PasswordResetPolicy {
  /** Enable password reset functionality */
  enabled: boolean;
  
  /** Reset token validity in seconds */
  tokenValiditySeconds: number;
  
  /** Maximum number of reset emails per hour */
  maxEmailsPerHour: number;
  
  /** Invalidate all sessions on password reset */
  invalidateAllSessions: boolean;
  
  /** Require email verification after reset */
  requireEmailVerification: boolean;
  
  /** Cooldown period between reset requests (seconds) */
  cooldownSeconds: number;
}

/**
 * Default password reset policy.
 */
export const DEFAULT_PASSWORD_RESET_POLICY: PasswordResetPolicy = {
  enabled: true,
  tokenValiditySeconds: 60 * 60, // 1 hour
  maxEmailsPerHour: 3,
  invalidateAllSessions: true,
  requireEmailVerification: false,
  cooldownSeconds: 60, // 1 minute between requests
};

/**
 * Rate limiting policies.
 */
export interface RateLimitPolicy {
  /** Enable rate limiting */
  enabled: boolean;
  
  /** Login attempts per IP per time window */
  loginAttemptsPerIp: {
    maxAttempts: number;
    windowSeconds: number;
  };
  
  /** Registration attempts per IP per time window */
  registrationAttemptsPerIp: {
    maxAttempts: number;
    windowSeconds: number;
  };
  
  /** Password reset requests per IP per time window */
  resetAttemptsPerIp: {
    maxAttempts: number;
    windowSeconds: number;
  };
  
  /** Token refresh attempts per session per time window */
  refreshAttemptsPerSession: {
    maxAttempts: number;
    windowSeconds: number;
  };
}

/**
 * Default rate limiting policy.
 */
export const DEFAULT_RATE_LIMIT_POLICY: RateLimitPolicy = {
  enabled: true,
  loginAttemptsPerIp: {
    maxAttempts: 10,
    windowSeconds: 15 * 60, // 15 minutes
  },
  registrationAttemptsPerIp: {
    maxAttempts: 3,
    windowSeconds: 60 * 60, // 1 hour
  },
  resetAttemptsPerIp: {
    maxAttempts: 5,
    windowSeconds: 60 * 60, // 1 hour
  },
  refreshAttemptsPerSession: {
    maxAttempts: 100,
    windowSeconds: 60 * 60, // 1 hour (allows ~1 refresh per minute)
  },
};

/**
 * Anomaly detection policies.
 */
export interface AnomalyDetectionPolicy {
  /** Enable anomaly detection */
  enabled: boolean;
  
  /** Detect token reuse (indicates token theft) */
  detectTokenReuse: boolean;
  
  /** Detect impossible travel (login from distant locations) */
  detectImpossibleTravel: boolean;
  
  /** Maximum travel speed in km/h to consider possible */
  maxTravelSpeedKmh: number;
  
  /** Detect concurrent sessions from different locations */
  detectConcurrentLocations: boolean;
  
  /** Detect unusual login times (outside normal patterns) */
  detectUnusualLoginTimes: boolean;
  
  /** Action to take on anomaly detection */
  onAnomalyDetected: "log" | "alert" | "challenge" | "block";
}

/**
 * Default anomaly detection policy.
 */
export const DEFAULT_ANOMALY_DETECTION_POLICY: AnomalyDetectionPolicy = {
  enabled: true,
  detectTokenReuse: true,
  detectImpossibleTravel: true,
  maxTravelSpeedKmh: 1000, // ~speed of commercial aircraft
  detectConcurrentLocations: true,
  detectUnusualLoginTimes: false, // Requires ML/pattern learning
  onAnomalyDetected: "alert", // Log and send alert, but don't block
};

/**
 * Combined security policies for the auth domain.
 */
export interface AuthSecurityPolicies {
  password: PasswordPolicy;
  session: SessionPolicy;
  lockout: LockoutPolicy;
  mfa: MfaPolicy;
  device: DevicePolicy;
  emailVerification: EmailVerificationPolicy;
  passwordReset: PasswordResetPolicy;
  rateLimit: RateLimitPolicy;
  anomalyDetection: AnomalyDetectionPolicy;
}

/**
 * Default auth security policies (enterprise-grade).
 * 
 * These can be overridden via configuration or environment variables.
 */
export const DEFAULT_AUTH_POLICIES: AuthSecurityPolicies = {
  password: DEFAULT_PASSWORD_POLICY,
  session: DEFAULT_SESSION_POLICY,
  lockout: DEFAULT_LOCKOUT_POLICY,
  mfa: DEFAULT_MFA_POLICY,
  device: DEFAULT_DEVICE_POLICY,
  emailVerification: DEFAULT_EMAIL_VERIFICATION_POLICY,
  passwordReset: DEFAULT_PASSWORD_RESET_POLICY,
  rateLimit: DEFAULT_RATE_LIMIT_POLICY,
  anomalyDetection: DEFAULT_ANOMALY_DETECTION_POLICY,
};

/**
 * Validate password against policy.
 * Returns an array of validation errors, or empty array if valid.
 */
export function validatePasswordAgainstPolicy(
  password: string,
  policy: PasswordPolicy
): string[] {
  const errors: string[] = [];

  // Length checks
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }
  if (password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`);
  }

  // Character requirements
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (policy.requireDigit && !/\d/.test(password)) {
    errors.push("Password must contain at least one digit");
  }
  if (policy.requireSpecialChar) {
    const specialCharRegex = new RegExp(`[${policy.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharRegex.test(password)) {
      errors.push(`Password must contain at least one special character (${policy.specialChars})`);
    }
  }

  return errors;
}

/**
 * Calculate password entropy (simplified Shannon entropy).
 * Returns entropy in bits.
 */
export function calculatePasswordEntropy(password: string): number {
  if (password.length === 0) return 0;

  // Count unique characters
  const uniqueChars = new Set(password).size;
  
  // Estimate character space
  let charSpace = 0;
  if (/[a-z]/.test(password)) charSpace += 26;
  if (/[A-Z]/.test(password)) charSpace += 26;
  if (/\d/.test(password)) charSpace += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charSpace += 32; // Approximate special chars
  
  // Entropy = log2(charSpace^length)
  // Simplified: length * log2(charSpace)
  return password.length * Math.log2(charSpace);
}
