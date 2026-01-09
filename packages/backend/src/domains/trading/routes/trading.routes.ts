/**
 * Trading Routes - User-facing Order and Position Endpoints
 *
 * Provides endpoints for authenticated users to:
 * - GET /orders - List user's orders
 * - GET /orders/:id - Get specific order
 * - GET /positions - List user's positions
 * - GET /positions/:id - Get specific position
 *
 * Note: Order placement goes directly to Order Engine (port 4003).
 * These routes read from the shared database using raw SQL.
 */

import type { Router, RouteContext } from "../../../api/types.js";
import type { TokenManager } from "../../auth/tokens/tokens.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { extractBearerToken, verifyAccessToken } from "../../../api/middleware.js";

// =============================================================================
// TYPES
// =============================================================================

export interface TradingRouteDependencies {
  db: NodePgDatabase<Record<string, unknown>>;
  tokenManager: TokenManager;
}

interface Logger {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
}

interface DbOrder {
  id: string;
  account_id: string;
  symbol: string;
  side: string;
  type: string;
  status: string;
  quantity: string;
  filled_quantity: string;
  price: string | null;
  stop_price: string | null;
  time_in_force: string;
  created_at: Date;
  updated_at: Date;
}

interface DbPosition {
  id: string;
  account_id: string;
  symbol: string;
  side: string;
  quantity: string;
  entry_price: string;
  unrealized_pnl: string;
  updated_at: Date;
}

interface DbAccount {
  id: string;
  user_id: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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

function formatOrder(o: DbOrder) {
  return {
    id: o.id,
    accountId: o.account_id,
    symbol: o.symbol,
    side: o.side,
    type: o.type,
    status: o.status,
    quantity: o.quantity,
    filledQuantity: o.filled_quantity,
    price: o.price,
    stopPrice: o.stop_price,
    timeInForce: o.time_in_force,
    createdAt: new Date(o.created_at).toISOString(),
    updatedAt: new Date(o.updated_at).toISOString(),
  };
}

function formatPosition(p: DbPosition) {
  return {
    id: p.id,
    accountId: p.account_id,
    symbol: p.symbol,
    side: p.side,
    quantity: p.quantity,
    entryPrice: p.entry_price,
    unrealizedPnl: p.unrealized_pnl,
    updatedAt: new Date(p.updated_at).toISOString(),
  };
}

// =============================================================================
// ROUTE REGISTRATION
// =============================================================================

export function registerTradingRoutes(
  router: Router,
  deps: TradingRouteDependencies,
  logger: Logger
): void {
  const { db, tokenManager } = deps;

  // ---------------------------------------------------------------------------
  // GET /orders - List user's orders
  // ---------------------------------------------------------------------------
  router.route("GET", "/orders", async (ctx) => {
    try {
      const userId = await authenticateRequest(ctx, tokenManager);

      // Get user's account IDs first
      const accountsResult = await db.execute(
        sql`SELECT id FROM accounts WHERE user_id = ${userId}`
      );
      const accountIds = (accountsResult.rows as unknown as DbAccount[]).map(a => a.id);

      if (accountIds.length === 0) {
        return { status: 200, body: { orders: [] } };
      }

      // Query params for filtering
      const status = ctx.query?.status as string | undefined;
      const symbol = ctx.query?.symbol as string | undefined;
      const limit = Math.min(parseInt(ctx.query?.limit as string) || 100, 500);

      // Build query with filters
      let ordersResult;
      if (status && symbol) {
        ordersResult = await db.execute(
          sql`SELECT id, account_id, symbol, side, type, status,
                     quantity, filled_quantity, price, stop_price,
                     time_in_force, created_at, updated_at
              FROM orders
              WHERE account_id = ANY(${accountIds})
                AND status = ${status}
                AND symbol = ${symbol}
              ORDER BY created_at DESC
              LIMIT ${limit}`
        );
      } else if (status) {
        ordersResult = await db.execute(
          sql`SELECT id, account_id, symbol, side, type, status,
                     quantity, filled_quantity, price, stop_price,
                     time_in_force, created_at, updated_at
              FROM orders
              WHERE account_id = ANY(${accountIds})
                AND status = ${status}
              ORDER BY created_at DESC
              LIMIT ${limit}`
        );
      } else if (symbol) {
        ordersResult = await db.execute(
          sql`SELECT id, account_id, symbol, side, type, status,
                     quantity, filled_quantity, price, stop_price,
                     time_in_force, created_at, updated_at
              FROM orders
              WHERE account_id = ANY(${accountIds})
                AND symbol = ${symbol}
              ORDER BY created_at DESC
              LIMIT ${limit}`
        );
      } else {
        ordersResult = await db.execute(
          sql`SELECT id, account_id, symbol, side, type, status,
                     quantity, filled_quantity, price, stop_price,
                     time_in_force, created_at, updated_at
              FROM orders
              WHERE account_id = ANY(${accountIds})
              ORDER BY created_at DESC
              LIMIT ${limit}`
        );
      }

      const orderRows = ordersResult.rows as unknown as DbOrder[];

      logger.info("orders_listed", { userId, count: orderRows.length });

      return {
        status: 200,
        body: {
          orders: orderRows.map(formatOrder),
        },
      };
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'status' in error) {
        return error as { status: number; body: unknown };
      }
      logger.error("orders_list_error", { error: String(error) });
      return { status: 500, body: { error: "Internal server error" } };
    }
  });

  // ---------------------------------------------------------------------------
  // GET /orders/:id - Get specific order
  // ---------------------------------------------------------------------------
  router.route("GET", "/orders/:id", async (ctx) => {
    try {
      const userId = await authenticateRequest(ctx, tokenManager);
      const orderId = ctx.params?.id;

      if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) {
        return { status: 400, body: { error: "Invalid order ID format" } };
      }

      // Get order
      const orderResult = await db.execute(
        sql`SELECT id, account_id, symbol, side, type, status,
                   quantity, filled_quantity, price, stop_price,
                   time_in_force, created_at, updated_at
            FROM orders
            WHERE id = ${orderId}
            LIMIT 1`
      );

      const order = orderResult.rows[0] as DbOrder | undefined;

      if (!order) {
        return { status: 404, body: { error: "Order not found" } };
      }

      // Verify user owns this order's account
      const accountResult = await db.execute(
        sql`SELECT user_id FROM accounts WHERE id = ${order.account_id} LIMIT 1`
      );
      const account = accountResult.rows[0] as { user_id: string } | undefined;

      if (!account || account.user_id !== userId) {
        return { status: 403, body: { error: "Access denied" } };
      }

      return {
        status: 200,
        body: {
          order: formatOrder(order),
        },
      };
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'status' in error) {
        return error as { status: number; body: unknown };
      }
      logger.error("order_get_error", { error: String(error) });
      return { status: 500, body: { error: "Internal server error" } };
    }
  });

  // ---------------------------------------------------------------------------
  // GET /positions - List user's positions
  // ---------------------------------------------------------------------------
  router.route("GET", "/positions", async (ctx) => {
    try {
      const userId = await authenticateRequest(ctx, tokenManager);

      // Get user's account IDs
      const accountsResult = await db.execute(
        sql`SELECT id FROM accounts WHERE user_id = ${userId}`
      );
      const accountIds = (accountsResult.rows as unknown as DbAccount[]).map(a => a.id);

      if (accountIds.length === 0) {
        return { status: 200, body: { positions: [] } };
      }

      // Query params
      const symbol = ctx.query?.symbol as string | undefined;

      // Get positions
      let positionsResult;
      if (symbol) {
        positionsResult = await db.execute(
          sql`SELECT id, account_id, symbol, side, quantity, entry_price, unrealized_pnl, updated_at
              FROM positions
              WHERE account_id = ANY(${accountIds})
                AND symbol = ${symbol}`
        );
      } else {
        positionsResult = await db.execute(
          sql`SELECT id, account_id, symbol, side, quantity, entry_price, unrealized_pnl, updated_at
              FROM positions
              WHERE account_id = ANY(${accountIds})`
        );
      }

      const positionRows = positionsResult.rows as unknown as DbPosition[];

      logger.info("positions_listed", { userId, count: positionRows.length });

      return {
        status: 200,
        body: {
          positions: positionRows.map(formatPosition),
        },
      };
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'status' in error) {
        return error as { status: number; body: unknown };
      }
      logger.error("positions_list_error", { error: String(error) });
      return { status: 500, body: { error: "Internal server error" } };
    }
  });

  // ---------------------------------------------------------------------------
  // GET /positions/:id - Get specific position
  // ---------------------------------------------------------------------------
  router.route("GET", "/positions/:id", async (ctx) => {
    try {
      const userId = await authenticateRequest(ctx, tokenManager);
      const positionId = ctx.params?.id;

      if (!positionId || !/^[0-9a-f-]{36}$/i.test(positionId)) {
        return { status: 400, body: { error: "Invalid position ID format" } };
      }

      // Get position
      const positionResult = await db.execute(
        sql`SELECT id, account_id, symbol, side, quantity, entry_price, unrealized_pnl, updated_at
            FROM positions
            WHERE id = ${positionId}
            LIMIT 1`
      );

      const position = positionResult.rows[0] as DbPosition | undefined;

      if (!position) {
        return { status: 404, body: { error: "Position not found" } };
      }

      // Verify user owns this position's account
      const accountResult = await db.execute(
        sql`SELECT user_id FROM accounts WHERE id = ${position.account_id} LIMIT 1`
      );
      const account = accountResult.rows[0] as { user_id: string } | undefined;

      if (!account || account.user_id !== userId) {
        return { status: 403, body: { error: "Access denied" } };
      }

      return {
        status: 200,
        body: {
          position: formatPosition(position),
        },
      };
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'status' in error) {
        return error as { status: number; body: unknown };
      }
      logger.error("position_get_error", { error: String(error) });
      return { status: 500, body: { error: "Internal server error" } };
    }
  });
}
