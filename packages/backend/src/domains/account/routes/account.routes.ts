/**
 * Account Routes - HTTP API Endpoints
 *
 * This file defines the REST API routes for the account domain.
 * Routes are thin - they parse requests, call the service, and format responses.
 *
 * Authentication:
 * All routes require authentication. The userId is extracted from the JWT token.
 *
 * Routes:
 * - GET    /accounts           - List user's accounts
 * - GET    /accounts/:id       - Get specific account
 * - POST   /accounts           - Create new account
 * - POST   /accounts/:id/deposit   - Deposit funds (admin only in production)
 * - POST   /accounts/:id/withdraw  - Withdraw funds
 */

import type { Router, RouteContext } from "../../../api/types.js";
import type { AccountServiceInterface } from "../core/account.types.js";
import type { TokenManager } from "../../auth/tokens/tokens.js";
import { AccountError } from "../core/account.errors.js";
import {
  createAccountSchema,
  balanceOperationSchema,
  uuidParamSchema,
} from "../validators/account.validators.js";
import { extractBearerToken, verifyAccessToken } from "../../../api/middleware.js";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Dependencies required by account routes.
 */
export interface AccountRouteDependencies {
  accountService: AccountServiceInterface;
  tokenManager: TokenManager;
}

/**
 * Logger interface (matches our minimal logger).
 */
interface Logger {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extracts and verifies the user ID from the Authorization header.
 * Throws 401 if no token or invalid token.
 */
async function authenticateRequest(
  ctx: RouteContext,
  tokenManager: TokenManager
): Promise<string> {
  const token = extractBearerToken(ctx.headers);

  if (!token) {
    return Promise.reject({ status: 401, body: { error: "Missing authorization token" } });
  }

  const claims = await verifyAccessToken(token, tokenManager);

  if (!claims) {
    return Promise.reject({ status: 401, body: { error: "Invalid or expired token" } });
  }

  return claims.sub; // userId
}

/**
 * Handles AccountError and converts to HTTP response.
 */
function handleAccountError(error: unknown): { status: number; body: unknown } {
  if (error instanceof AccountError) {
    return {
      status: error.httpStatus,
      body: error.toJSON(),
    };
  }

  // Re-throw unexpected errors
  throw error;
}

// =============================================================================
// ROUTE REGISTRATION
// =============================================================================

/**
 * Registers all account-related HTTP routes.
 *
 * @param router - The application router
 * @param deps - Service dependencies
 * @param logger - Logger instance
 */
export function registerAccountRoutes(
  router: Router,
  deps: AccountRouteDependencies,
  logger: Logger
): void {
  const { accountService, tokenManager } = deps;

  // ---------------------------------------------------------------------------
  // GET /accounts - List user's accounts
  // ---------------------------------------------------------------------------
  router.route("GET", "/accounts", async (ctx) => {
    try {
      const userId = await authenticateRequest(ctx, tokenManager);

      const accounts = await accountService.listUserAccounts(userId);

      logger.info("accounts_listed", { userId, count: accounts.length });

      return {
        status: 200,
        body: { accounts },
      };
    } catch (error) {
      return handleAccountError(error);
    }
  });

  // ---------------------------------------------------------------------------
  // GET /accounts/:id - Get specific account
  // ---------------------------------------------------------------------------
  router.route("GET", "/accounts/:id", async (ctx) => {
    try {
      const userId = await authenticateRequest(ctx, tokenManager);

      // Validate path parameter
      const params = uuidParamSchema.safeParse({ id: ctx.params?.id });
      if (!params.success) {
        return { status: 400, body: { error: "Invalid account ID format" } };
      }

      const account = await accountService.getAccountById(params.data.id);

      // Security: Ensure user owns this account
      if (account.userId !== userId) {
        return { status: 403, body: { error: "Access denied" } };
      }

      // Convert to view with available balance
      const available = (
        parseFloat(account.balance) - parseFloat(account.locked)
      ).toFixed(10);

      return {
        status: 200,
        body: {
          account: {
            ...account,
            available,
            createdAt: account.createdAt.toISOString(),
            updatedAt: account.updatedAt.toISOString(),
          },
        },
      };
    } catch (error) {
      return handleAccountError(error);
    }
  });

  // ---------------------------------------------------------------------------
  // POST /accounts - Create new account
  // ---------------------------------------------------------------------------
  router.route("POST", "/accounts", async (ctx) => {
    try {
      const userId = await authenticateRequest(ctx, tokenManager);

      // Validate request body
      const body = createAccountSchema.safeParse(ctx.body);
      if (!body.success) {
        return {
          status: 400,
          body: { error: "Invalid request", details: body.error.flatten() },
        };
      }

      const account = await accountService.createAccount({
        userId,
        currency: body.data.currency as any, // Validated in service
        accountType: body.data.accountType,
      });

      logger.info("account_created", {
        userId,
        accountId: account.id,
        currency: account.currency,
      });

      return {
        status: 201,
        body: {
          account: {
            ...account,
            available: account.balance, // New account has no locked funds
            createdAt: account.createdAt.toISOString(),
            updatedAt: account.updatedAt.toISOString(),
          },
        },
      };
    } catch (error) {
      return handleAccountError(error);
    }
  });

  // ---------------------------------------------------------------------------
  // POST /accounts/:id/deposit - Deposit funds
  // ---------------------------------------------------------------------------
  // Note: In production, this should be admin-only or triggered by payment webhook
  router.route("POST", "/accounts/:id/deposit", async (ctx) => {
    try {
      const userId = await authenticateRequest(ctx, tokenManager);

      // Validate path parameter
      const params = uuidParamSchema.safeParse({ id: ctx.params?.id });
      if (!params.success) {
        return { status: 400, body: { error: "Invalid account ID format" } };
      }

      // Validate request body
      const body = balanceOperationSchema.safeParse(ctx.body);
      if (!body.success) {
        return {
          status: 400,
          body: { error: "Invalid request", details: body.error.flatten() },
        };
      }

      // Get account and verify ownership
      const account = await accountService.getAccountById(params.data.id);
      if (account.userId !== userId) {
        // In production: Check if user is admin instead
        return { status: 403, body: { error: "Access denied" } };
      }

      const updated = await accountService.deposit({
        accountId: params.data.id,
        amount: body.data.amount,
        reference: body.data.reference,
        note: body.data.note,
      });

      logger.info("deposit_completed", {
        userId,
        accountId: updated.id,
        amount: body.data.amount,
        currency: updated.currency,
      });

      return {
        status: 200,
        body: {
          success: true,
          account: {
            ...updated,
            available: (
              parseFloat(updated.balance) - parseFloat(updated.locked)
            ).toFixed(10),
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          },
        },
      };
    } catch (error) {
      return handleAccountError(error);
    }
  });

  // ---------------------------------------------------------------------------
  // POST /accounts/:id/withdraw - Withdraw funds
  // ---------------------------------------------------------------------------
  router.route("POST", "/accounts/:id/withdraw", async (ctx) => {
    try {
      const userId = await authenticateRequest(ctx, tokenManager);

      // Validate path parameter
      const params = uuidParamSchema.safeParse({ id: ctx.params?.id });
      if (!params.success) {
        return { status: 400, body: { error: "Invalid account ID format" } };
      }

      // Validate request body
      const body = balanceOperationSchema.safeParse(ctx.body);
      if (!body.success) {
        return {
          status: 400,
          body: { error: "Invalid request", details: body.error.flatten() },
        };
      }

      // Get account and verify ownership
      const account = await accountService.getAccountById(params.data.id);
      if (account.userId !== userId) {
        return { status: 403, body: { error: "Access denied" } };
      }

      const updated = await accountService.withdraw({
        accountId: params.data.id,
        amount: body.data.amount,
        note: body.data.note,
      });

      logger.info("withdrawal_completed", {
        userId,
        accountId: updated.id,
        amount: body.data.amount,
        currency: updated.currency,
      });

      return {
        status: 200,
        body: {
          success: true,
          account: {
            ...updated,
            available: (
              parseFloat(updated.balance) - parseFloat(updated.locked)
            ).toFixed(10),
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          },
        },
      };
    } catch (error) {
      return handleAccountError(error);
    }
  });

  // ---------------------------------------------------------------------------
  // POST /accounts/:id/close - Close account
  // ---------------------------------------------------------------------------
  router.route("POST", "/accounts/:id/close", async (ctx) => {
    try {
      const userId = await authenticateRequest(ctx, tokenManager);

      // Validate path parameter
      const params = uuidParamSchema.safeParse({ id: ctx.params?.id });
      if (!params.success) {
        return { status: 400, body: { error: "Invalid account ID format" } };
      }

      // Get account and verify ownership
      const account = await accountService.getAccountById(params.data.id);
      if (account.userId !== userId) {
        return { status: 403, body: { error: "Access denied" } };
      }

      await accountService.closeAccount(params.data.id);

      logger.info("account_closed", {
        userId,
        accountId: params.data.id,
      });

      return {
        status: 200,
        body: { success: true, message: "Account closed successfully" },
      };
    } catch (error) {
      return handleAccountError(error);
    }
  });
}
