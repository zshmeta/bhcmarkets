/**
 * Environment Configuration.
 * 
 * Validates and exposes environment variables with type safety.
 */

/**
 * Environment configuration interface.
 */
export interface EnvConfig {
  /** API base URL */
  apiBaseUrl: string;
  
  /** App name */
  appName: string;
  
  /** Environment (development, production, test) */
  environment: string;
  
  /** Whether we're in production */
  isProduction: boolean;
  
  /** Whether we're in development */
  isDevelopment: boolean;
}

/**
 * Get environment variable with fallback.
 */
function getEnv(key: string, fallback: string): string {
  return import.meta.env[key] || fallback;
}

/**
 * Environment configuration.
 */
export const env: EnvConfig = {
  apiBaseUrl: getEnv("VITE_API_BASE_URL", "http://localhost:3001/api"),
  appName: getEnv("VITE_APP_NAME", "BHC Markets Auth"),
  environment: getEnv("MODE", "development"),
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
};

/**
 * Validate environment configuration.
 * Throws an error if required variables are missing.
 */
export function validateEnv(): void {
  const errors: string[] = [];

  // Add validation rules here
  if (!env.apiBaseUrl) {
    errors.push("VITE_API_BASE_URL is required");
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
  }
}

// Auto-validate on import
validateEnv();
