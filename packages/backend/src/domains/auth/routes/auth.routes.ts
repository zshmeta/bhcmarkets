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
import {
  createListSessionsController,
  createRevokeAllSessionsController,
} from "../controllers/sessions.controller.js";
import {
  createGenerateCodeController,
  createExchangeCodeController,
} from "../controllers/code.controller.js";

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
  services: { auth: AuthService },
  logger: LoggerLike
): void {
  // Create controllers
  const loginController = createLoginController(services.auth);
  const registerController = createRegisterController(services.auth);
  const refreshController = createRefreshController(services.auth);
  const logoutController = createLogoutController(services.auth);
  const listSessionsController = createListSessionsController(services.auth);
  const revokeAllSessionsController = createRevokeAllSessionsController(services.auth);

  // Register routes
  // Authentication endpoints
  router.route("POST", "/auth/login", loginController);
  router.route("POST", "/auth/register", registerController);
  router.route("POST", "/auth/refresh", refreshController);
  router.route("POST", "/auth/code", createGenerateCodeController(services.auth));
  router.route("POST", "/auth/exchange", createExchangeCodeController(services.auth));
  
  // Session management endpoints
  router.route("POST", "/auth/logout", logoutController);
  router.route("POST", "/auth/logout-all", revokeAllSessionsController);
  router.route("GET", "/auth/sessions", listSessionsController);
}
