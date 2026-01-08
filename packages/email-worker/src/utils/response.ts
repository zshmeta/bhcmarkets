/**
 * Response Helpers
 * Standardized HTTP response utilities
 */

import type { SendEmailResponse, ErrorResponse } from '../types';

/**
 * Create a JSON response with proper headers
 */
export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * Create a success response
 */
export function successResponse(data: SendEmailResponse): Response {
  return jsonResponse(data, 200);
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  status: number,
  emailRef?: string,
  code?: string
): Response {
  const body: ErrorResponse = {
    success: false,
    error,
    emailRef,
    code,
  };
  return jsonResponse(body, status);
}

/**
 * Create a 400 Bad Request response
 */
export function badRequest(message: string, emailRef?: string): Response {
  return errorResponse(message, 400, emailRef, 'BAD_REQUEST');
}

/**
 * Create a 401 Unauthorized response
 */
export function unauthorized(message = 'Unauthorized'): Response {
  return errorResponse(message, 401, undefined, 'UNAUTHORIZED');
}

/**
 * Create a 404 Not Found response
 */
export function notFound(message = 'Not Found'): Response {
  return errorResponse(message, 404, undefined, 'NOT_FOUND');
}

/**
 * Create a 405 Method Not Allowed response
 */
export function methodNotAllowed(allowed: string[]): Response {
  return new Response(JSON.stringify({
    success: false,
    error: 'Method not allowed',
    code: 'METHOD_NOT_ALLOWED',
  }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      'Allow': allowed.join(', '),
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * Create a 429 Too Many Requests response
 */
export function tooManyRequests(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(JSON.stringify({
    success: false,
    error: 'Rate limit exceeded',
    code: 'RATE_LIMITED',
    retryAfter,
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * Create a 500 Internal Server Error response
 */
export function serverError(message = 'Internal server error', emailRef?: string): Response {
  return errorResponse(message, 500, emailRef, 'SERVER_ERROR');
}

/**
 * Create a 503 Service Unavailable response
 */
export function serviceUnavailable(message = 'Service temporarily unavailable', emailRef?: string): Response {
  return errorResponse(message, 503, emailRef, 'SERVICE_UNAVAILABLE');
}

/**
 * Add CORS headers to a response
 */
export function withCors(response: Response, origin = '*'): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', origin);
  newHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  newHeaders.set('Access-Control-Max-Age', '86400');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Handle CORS preflight request
 */
export function corsPreflightResponse(origin = '*'): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}
