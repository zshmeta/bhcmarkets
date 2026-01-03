/**
 * Sessions Controller.
 * 
 * HTTP adapter for session management.
 * Handles listing and revoking user sessions.
 */

import type { HttpRequest, HttpResponse } from "../../../api/types.js";
import type { AuthService } from "../core/auth.service.js";
import type { SessionInvalidationReason } from "../core/auth.types.js";
import { validateLogoutAll } from "../validators/auth.validator.js";
import { AuthError } from "../core/auth.errors.js";

/**
 * Create list sessions controller.
 * 
 * @param authService - Auth service instance
 * @returns HTTP request handler
 */
export function createListSessionsController(authService: AuthService) {
  return async (req: HttpRequest): Promise<HttpResponse> => {
    try {
      // Get userId from query parameters
      const userId = req.query?.["userId"];
      
      if (!userId || typeof userId !== "string") {
        return {
          status: 400,
          body: { error: "VALIDATION_ERROR", message: "userId query parameter is required" },
        };
      }

      // List active sessions for user
      const sessions = await authService.listActiveSessions(userId);

      // Return sessions
      return {
        status: 200,
        body: { sessions },
      };
    } catch (error: unknown) {
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

/**
 * Create revoke all sessions controller.
 * 
 * @param authService - Auth service instance
 * @returns HTTP request handler
 */
export function createRevokeAllSessionsController(authService: AuthService) {
  return async (req: HttpRequest): Promise<HttpResponse> => {
    try {
      // Validate request body
      const { userId, excludeSessionId, reason } = validateLogoutAll(req.body);

      // Revoke all sessions for user
      await authService.logoutAll({
        userId,
        excludeSessionId,
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
