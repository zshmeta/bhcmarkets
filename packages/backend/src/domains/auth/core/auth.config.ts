/**
 * Enterprise-grade auth configuration management.
 * 
 * This file centralizes all auth configuration including:
 * - Feature flags
 * - Time-to-live values
 * - Limits and thresholds
 * - Integration settings
 * 
 * Configuration can be loaded from environment variables, config files,
 * or passed directly to the auth service.
 */

import type { AuthSecurityPolicies } from "./auth.policies.js";
import { DEFAULT_AUTH_POLICIES } from "./auth.policies.js";

/**
 * Core auth service configuration.
 */
export interface AuthServiceConfig {
  /** JWT signing secret for access tokens */
  jwtAccessSecret: string;
  
  /** JWT signing secret for refresh tokens (should be different from access) */
  jwtRefreshSecret: string;
  
  /** JWT issuer identifier */
  jwtIssuer: string;
  
  /** JWT audience identifier(s) */
  jwtAudience: string | string[];
  
  /** Access token time-to-live in seconds */
  accessTokenTtlSeconds: number;
  
  /** Refresh token time-to-live in seconds */
  refreshTokenTtlSeconds: number;
  
  /** Maximum concurrent sessions per user (0 = unlimited) */
  maxSessionsPerUser: number;
  
  /** Security policies */
  policies: AuthSecurityPolicies;
}

/**
 * Feature flags for auth functionality.
 */
export interface AuthFeatureFlags {
  /** Enable user registration */
  enableRegistration: boolean;
  
  /** Enable social login providers */
  enableSocialLogin: boolean;
  
  /** Enable multi-factor authentication */
  enableMfa: boolean;
  
  /** Enable email verification */
  enableEmailVerification: boolean;
  
  /** Enable password reset */
  enablePasswordReset: boolean;
  
  /** Enable device tracking */
  enableDeviceTracking: boolean;
  
  /** Enable session management UI */
  enableSessionManagement: boolean;
  
  /** Enable security alerts */
  enableSecurityAlerts: boolean;
  
  /** Enable audit logging */
  enableAuditLogging: boolean;
  
  /** Enable rate limiting */
  enableRateLimiting: boolean;
  
  /** Enable anomaly detection */
  enableAnomalyDetection: boolean;
}

/**
 * Default feature flags (enterprise features enabled).
 */
export const DEFAULT_FEATURE_FLAGS: AuthFeatureFlags = {
  enableRegistration: true,
  enableSocialLogin: false, // Requires additional setup
  enableMfa: true,
  enableEmailVerification: true,
  enablePasswordReset: true,
  enableDeviceTracking: true,
  enableSessionManagement: true,
  enableSecurityAlerts: true,
  enableAuditLogging: true,
  enableRateLimiting: true,
  enableAnomalyDetection: true,
};

/**
 * Email service configuration for auth flows.
 */
export interface EmailConfig {
  /** Email service provider */
  provider: "smtp" | "sendgrid" | "ses" | "mock";
  
  /** From email address */
  fromEmail: string;
  
  /** From display name */
  fromName: string;
  
  /** SMTP host (if using SMTP) */
  smtpHost?: string;
  
  /** SMTP port (if using SMTP) */
  smtpPort?: number;
  
  /** SMTP username (if using SMTP) */
  smtpUser?: string;
  
  /** SMTP password (if using SMTP) */
  smtpPassword?: string;
  
  /** API key for third-party providers */
  apiKey?: string;
  
  /** Base URL for email links (verification, reset, etc.) */
  baseUrl: string;
}

/**
 * Redis configuration for session storage and rate limiting.
 */
export interface RedisConfig {
  /** Redis host */
  host: string;
  
  /** Redis port */
  port: number;
  
  /** Redis password (if required) */
  password?: string;
  
  /** Redis database number */
  db: number;
  
  /** Redis key prefix */
  keyPrefix: string;
  
  /** Connection timeout in ms */
  connectTimeout: number;
}

/**
 * Complete auth configuration.
 */
export interface AuthConfig {
  /** Core service configuration */
  service: AuthServiceConfig;
  
  /** Feature flags */
  features: AuthFeatureFlags;
  
  /** Email configuration */
  email?: EmailConfig;
  
  /** Redis configuration */
  redis?: RedisConfig;
}

/**
 * Load auth configuration from environment variables.
 * 
 * Environment variables:
 * - AUTH_JWT_ACCESS_SECRET: JWT access token secret
 * - AUTH_JWT_REFRESH_SECRET: JWT refresh token secret
 * - AUTH_JWT_ISSUER: JWT issuer
 * - AUTH_JWT_AUDIENCE: JWT audience
 * - AUTH_ACCESS_TOKEN_TTL: Access token TTL in seconds
 * - AUTH_REFRESH_TOKEN_TTL: Refresh token TTL in seconds
 * - AUTH_MAX_SESSIONS: Max sessions per user
 * - AUTH_ENABLE_*: Feature flags
 */
export function loadAuthConfigFromEnv(): Partial<AuthConfig> {
  const config: Partial<AuthConfig> = {
    service: {
      jwtAccessSecret: process.env.AUTH_JWT_ACCESS_SECRET || "",
      jwtRefreshSecret: process.env.AUTH_JWT_REFRESH_SECRET || "",
      jwtIssuer: process.env.AUTH_JWT_ISSUER || "bhcmarkets",
      jwtAudience: process.env.AUTH_JWT_AUDIENCE || "bhcmarkets-api",
      accessTokenTtlSeconds: parseInt(process.env.AUTH_ACCESS_TOKEN_TTL || "900", 10), // 15 minutes
      refreshTokenTtlSeconds: parseInt(process.env.AUTH_REFRESH_TOKEN_TTL || "2592000", 10), // 30 days
      maxSessionsPerUser: parseInt(process.env.AUTH_MAX_SESSIONS || "10", 10),
      policies: DEFAULT_AUTH_POLICIES,
    },
    features: {
      enableRegistration: process.env.AUTH_ENABLE_REGISTRATION !== "false",
      enableSocialLogin: process.env.AUTH_ENABLE_SOCIAL_LOGIN === "true",
      enableMfa: process.env.AUTH_ENABLE_MFA !== "false",
      enableEmailVerification: process.env.AUTH_ENABLE_EMAIL_VERIFICATION !== "false",
      enablePasswordReset: process.env.AUTH_ENABLE_PASSWORD_RESET !== "false",
      enableDeviceTracking: process.env.AUTH_ENABLE_DEVICE_TRACKING !== "false",
      enableSessionManagement: process.env.AUTH_ENABLE_SESSION_MANAGEMENT !== "false",
      enableSecurityAlerts: process.env.AUTH_ENABLE_SECURITY_ALERTS !== "false",
      enableAuditLogging: process.env.AUTH_ENABLE_AUDIT_LOGGING !== "false",
      enableRateLimiting: process.env.AUTH_ENABLE_RATE_LIMITING !== "false",
      enableAnomalyDetection: process.env.AUTH_ENABLE_ANOMALY_DETECTION !== "false",
    },
  };

  // Email configuration (if provided)
  if (process.env.EMAIL_FROM) {
    config.email = {
      provider: (process.env.EMAIL_PROVIDER as any) || "smtp",
      fromEmail: process.env.EMAIL_FROM,
      fromName: process.env.EMAIL_FROM_NAME || "BHC Markets",
      smtpHost: process.env.SMTP_HOST,
      smtpPort: parseInt(process.env.SMTP_PORT || "587", 10),
      smtpUser: process.env.SMTP_USER,
      smtpPassword: process.env.SMTP_PASSWORD,
      apiKey: process.env.EMAIL_API_KEY,
      baseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
    };
  }

  // Redis configuration (if provided)
  if (process.env.REDIS_HOST) {
    config.redis = {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0", 10),
      keyPrefix: process.env.REDIS_KEY_PREFIX || "auth:",
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || "5000", 10),
    };
  }

  return config;
}

/**
 * Validate auth configuration.
 * Throws an error if configuration is invalid or incomplete.
 */
export function validateAuthConfig(config: Partial<AuthConfig>): void {
  const errors: string[] = [];

  // Validate service configuration
  if (!config.service) {
    errors.push("Service configuration is required");
  } else {
    if (!config.service.jwtAccessSecret) {
      errors.push("JWT access secret is required");
    } else if (config.service.jwtAccessSecret.length < 32) {
      errors.push("JWT access secret must be at least 32 characters");
    }

    if (!config.service.jwtRefreshSecret) {
      errors.push("JWT refresh secret is required");
    } else if (config.service.jwtRefreshSecret.length < 32) {
      errors.push("JWT refresh secret must be at least 32 characters");
    }

    if (config.service.jwtAccessSecret === config.service.jwtRefreshSecret) {
      errors.push("JWT access and refresh secrets must be different");
    }

    if (!config.service.jwtIssuer) {
      errors.push("JWT issuer is required");
    }

    if (!config.service.jwtAudience) {
      errors.push("JWT audience is required");
    }

    if (config.service.accessTokenTtlSeconds < 60) {
      errors.push("Access token TTL must be at least 60 seconds");
    }

    if (config.service.accessTokenTtlSeconds > config.service.refreshTokenTtlSeconds) {
      errors.push("Access token TTL cannot exceed refresh token TTL");
    }

    if (config.service.maxSessionsPerUser < 0) {
      errors.push("Max sessions per user must be non-negative");
    }
  }

  // Validate email configuration (if email features are enabled)
  if (config.features?.enableEmailVerification || config.features?.enablePasswordReset) {
    if (!config.email) {
      errors.push("Email configuration is required when email features are enabled");
    } else {
      if (!config.email.fromEmail) {
        errors.push("Email from address is required");
      }
      if (!config.email.baseUrl) {
        errors.push("Email base URL is required");
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Auth configuration validation failed:\n${errors.join("\n")}`);
  }
}

/**
 * Create a complete auth configuration with defaults.
 * 
 * This function merges provided configuration with defaults and validates the result.
 */
export function createAuthConfig(partial: Partial<AuthConfig>): AuthConfig {
  // Load environment variables
  const envConfig = loadAuthConfigFromEnv();

  // Merge configurations (priority: partial > env > defaults)
  const config: AuthConfig = {
    service: {
      ...envConfig.service,
      ...partial.service,
      policies: {
        ...DEFAULT_AUTH_POLICIES,
        ...envConfig.service?.policies,
        ...partial.service?.policies,
      },
    } as AuthServiceConfig,
    features: {
      ...DEFAULT_FEATURE_FLAGS,
      ...envConfig.features,
      ...partial.features,
    },
    email: partial.email || envConfig.email,
    redis: partial.redis || envConfig.redis,
  };

  // Validate configuration
  validateAuthConfig(config);

  return config;
}

/**
 * Get configuration value with type safety.
 */
export function getConfigValue<T>(
  config: AuthConfig,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split(".");
  let value: any = config;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return value as T;
}
