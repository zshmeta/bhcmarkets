/**
 * Register Controller.
 * 
 * HTTP adapter for the registration use case.
 * Handles user registration requests.
 */

import type { HttpRequest, HttpResponse } from "../../../api/types.js";
import type { AuthService } from "../core/auth.service.js";
import { validateRegister } from "../validators/auth.validator.js";
import { AuthError } from "../core/auth.errors.js";
import { extractDeviceInfo } from "../security/device.fingerprint.js";

/**
 * Create register controller.
 * 
 * @param authService - Auth service instance
 * @returns HTTP request handler
 */
export function createRegisterController(authService: AuthService) {
  return async (req: HttpRequest): Promise<HttpResponse> => {
    try {
      // Validate request body
      const { email, password, issueSession } = validateRegister(req.body);

      // Extract device metadata from request headers
      const device = extractDeviceInfo(req.headers || {});

      // Register user
      const result = await authService.register({
        email,
        password,
        device,
        issueSession,
      });

      // Return registration result
      return {
        status: 201,
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
