/**
 * Login Controller.
 * 
 * HTTP adapter for the login use case.
 * Handles authentication requests and returns JWT tokens.
 */

import type { HttpRequest, HttpResponse } from "../../../api/types.js";
import type { AuthService } from "../core/auth.service.js";
import { validateLogin } from "../validators/auth.validator.js";
import { AuthError } from "../core/auth.errors.js";
import { extractDeviceInfo } from "../security/device.fingerprint.js";

/**
 * Create login controller.
 * 
 * @param authService - Auth service instance
 * @returns HTTP request handler
 */
export function createLoginController(authService: AuthService) {
  return async (req: HttpRequest): Promise<HttpResponse> => {
    try {
      // Validate request body
      const { email, password } = validateLogin(req.body);

      // Extract device metadata from request headers
      const device = extractDeviceInfo(req.headers || {});

      // Authenticate user
      const result = await authService.authenticate({
        email,
        password,
        device,
      });

      // Return authentication result with tokens
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
