  /**
 * Auth Routes.
 *
 * Defines HTTP routes for authentication endpoints.
 * Routes are thin adapters that delegate to controllers.
 */

import type { Router } from "../../../api/types.js";
import type { AuthService } from "../core/auth.service.js";
import { createLoginController } from "../controllers/login.controller.js";
import { createRegisterController } from "../controllers/register.controller.js";
import { createRefreshController } from "../controllers/refresh.controller.js";
import { createLogoutController } from "../controllers/logout.controller.js";
import type { DbHealth } from "../../../infra/db-health.js";
import {
  createListSessionsController,
  createRevokeAllSessionsController,
} from "../controllers/sessions.controller.js";
import {
  createGenerateCodeController,
  createExchangeCodeController,
} from "../controllers/code.controller.js";
import {
  createRequestPasswordResetController,
  createConfirmPasswordResetController,
} from "../controllers/password.controller.js";

/**
 * Logger interface (minimal).
 */
type LoggerLike = {
  error: (msg: string, meta?: Record<string, unknown>) => void;
};

/**
 * Register all auth routes on the given router.
 *
 * @param router - HTTP router instance
 * @param services - Service dependencies
 * @param logger - Logger instance
 */
export function registerAuthRoutes(
  router: Router,
  services: { auth: AuthService; dbHealth: DbHealth },
  logger: LoggerLike
): void {
  // Create controllers
  const loginController = createLoginController(services.auth);
  const registerController = createRegisterController(services.auth);
  const refreshController = createRefreshController(services.auth);
  const logoutController = createLogoutController(services.auth);
  const listSessionsController = createListSessionsController(services.auth);
  const revokeAllSessionsController = createRevokeAllSessionsController(services.auth);

  const requireDb = (handler: (req: any) => Promise<any>) => {
    return async (req: any) => {
      const connected = await services.dbHealth.isConnected();
      if (!connected) {
        logger.error("db_not_connected", { path: (req as any)?.path ?? "unknown" });
        return {
          status: 503,
          body: {
            error: "SERVICE_UNAVAILABLE",
            message: "Database not connected",
          },
        };
      }
      return handler(req);
    };
  };

  // Register routes
  // Authentication endpoints
  router.route("POST", "/auth/login", requireDb(loginController));
  router.route("POST", "/auth/register", requireDb(registerController));
  router.route("POST", "/auth/refresh", requireDb(refreshController));
  router.route("POST", "/auth/code", requireDb(createGenerateCodeController(services.auth)));
  router.route("POST", "/auth/exchange", requireDb(createExchangeCodeController(services.auth)));
  router.route("POST", "/auth/forgot-password", requireDb(createRequestPasswordResetController(services.auth)));
  router.route("POST", "/auth/reset-password", requireDb(createConfirmPasswordResetController(services.auth)));


  // Session management endpoints
  router.route("POST", "/auth/logout", requireDb(logoutController));
  router.route("POST", "/auth/logout-all", requireDb(revokeAllSessionsController));
  router.route("GET", "/auth/sessions", requireDb(listSessionsController));

}
