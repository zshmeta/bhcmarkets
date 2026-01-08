/**
 * Authentication Middleware
 * Validates API key for incoming requests
 */

import type { EmailWorkerEnv } from '../types';

export interface AuthResult {
  authenticated: boolean;
  error?: string;
}

/**
 * Validate API key authentication
 */
export function validateApiKey(request: Request, env: EmailWorkerEnv): AuthResult {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return {
      authenticated: false,
      error: 'Missing X-API-Key header',
    };
  }

  // Use timing-safe comparison to prevent timing attacks
  if (!timingSafeEqual(apiKey, env.API_KEY)) {
    return {
      authenticated: false,
      error: 'Invalid API key',
    };
  }

  return { authenticated: true };
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do the comparison to keep timing consistent
    const dummy = 'x'.repeat(a.length);
    compareStrings(dummy, a);
    return false;
  }
  return compareStrings(a, b);
}

function compareStrings(a: string, b: string): boolean {
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
