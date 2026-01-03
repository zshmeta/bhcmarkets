/**
 * Logout Controller.
 * 
 * HTTP adapter for logout use case.
 * Handles single session termination.
 */

import type { HttpRequest, HttpResponse } from "../../../api/types.js";
import type { AuthService } from "../core/auth.service.js";
import type { SessionInvalidationReason } from "../core/auth.types.js";
import { validateLogout } from "../validators/auth.validator.js";
import { AuthError } from "../core/auth.errors.js";

/**
 * Create logout controller.
 * 
 * @param authService - Auth service instance
 * @returns HTTP request handler
 */
export function createLogoutController(authService: AuthService) {
  return async (req: HttpRequest): Promise<HttpResponse> => {
    try {
      // Validate request body
      const { sessionId, userId, reason } = validateLogout(req.body);

      // Logout session
      await authService.logout({
        sessionId,
        userId,
        reason: reason as SessionInvalidationReason | undefined,
      });

      // Return success (no content)
      return {
        status: 204,
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
