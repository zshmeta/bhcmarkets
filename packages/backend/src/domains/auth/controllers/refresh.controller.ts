/**
 * Refresh Controller.
 * 
 * HTTP adapter for token refresh use case.
 * Handles refresh token rotation and access token issuance.
 */

import type { HttpRequest, HttpResponse } from "../../../api/types.js";
import type { AuthService } from "../core/auth.service.js";
import { validateRefresh } from "../validators/auth.validator.js";
import { AuthError } from "../core/auth.errors.js";
import { extractDeviceInfo } from "../security/device.fingerprint.js";

/**
 * Create refresh controller.
 * 
 * @param authService - Auth service instance
 * @returns HTTP request handler
 */
export function createRefreshController(authService: AuthService) {
  return async (req: HttpRequest): Promise<HttpResponse> => {
    try {
      // Validate request body
      const { refreshToken } = validateRefresh(req.body);

      // Extract device metadata from request headers
      const device = extractDeviceInfo(req.headers || {});

      // Refresh session and get new tokens
      const result = await authService.refreshSession({
        refreshToken,
        device,
      });

      // Return new tokens
      return {
        status: 200,
        body: result,
      };
    } catch (error: unknown) {
      // Handle validation errors
      if (error instanceof Error && error.message.startsWith("validation_error")) {
        return {
          status: 400,
          body: { error: "VALIDATION_ERROR", message: error.message },
        };
      }

      // Handle auth errors
      if (AuthError.isAuthError(error)) {
        return {
          status: error.httpStatus,
          body: error.toJSON(),
        };
      }

      // Handle unknown errors
      return {
        status: 500,
        body: { error: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      };
    }
  };
}
