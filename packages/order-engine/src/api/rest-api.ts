/**
 * REST API Routes
 * ===============
 *
 * HTTP API for the order engine.
 *
 * ENDPOINTS:
 *
 * Orders:
 * - POST   /orders           - Place new order
 * - DELETE /orders/:id       - Cancel order
 * - GET    /orders/:id       - Get order by ID
 * - GET    /orders           - Get orders (with filters)
 *
 * Order Book:
 * - GET    /orderbook/:symbol         - Get order book snapshot
 * - GET    /orderbook/:symbol/depth   - Get order book depth
 *
 * Trades:
 * - GET    /trades/:symbol   - Get recent trades
 * - GET    /trades/account   - Get account trades
 *
 * Health:
 * - GET    /health           - Service health
 * - GET    /stats            - Service statistics
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'http';
import { URL } from 'url';
import type { OrderManager } from '../orders/order-manager.js';
import { getOrdersByAccount, getTradesByAccount, getRecentTrades } from '../orders/order-repository.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

const log = logger.child({ component: 'rest-api' });

// ============================================================================
// TYPES
// ============================================================================

type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
  query: URLSearchParams,
  body: any
) => Promise<void>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

// ============================================================================
// REST API SERVER
// ============================================================================

export class RestApiServer {
  private server: Server | null = null;
  private routes: Route[] = [];
  private orderManager: OrderManager | null = null;

  constructor() {
    this.setupRoutes();
  }

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Start the REST API server.
   */
  async start(port: number = env.PORT): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        this.handleRequest(req, res).catch((error) => {
          log.error({ error }, 'Unhandled request error');
          this.sendError(res, 500, 'Internal server error');
        });
      });

      this.server.on('error', (error) => {
        log.error({ error }, 'REST API server error');
        reject(error);
      });

      this.server.listen(port, () => {
        log.info({ port }, 'REST API server started');
        resolve();
      });
    });
  }

  /**
   * Stop the REST API server.
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          log.info('REST API server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /**
   * Set the order manager instance.
   */
  setOrderManager(manager: OrderManager): void {
    this.orderManager = manager;
  }

  // ===========================================================================
  // ROUTING
  // ===========================================================================

  private setupRoutes(): void {
    // Health
    this.addRoute('GET', '/health', this.handleHealth.bind(this));
    this.addRoute('GET', '/stats', this.handleStats.bind(this));

    // Orders
    this.addRoute('POST', '/orders', this.handlePlaceOrder.bind(this));
    this.addRoute('DELETE', '/orders/:id', this.handleCancelOrder.bind(this));
    this.addRoute('GET', '/orders/:id', this.handleGetOrder.bind(this));
    this.addRoute('GET', '/orders', this.handleGetOrders.bind(this));

    // Order Book
    this.addRoute('GET', '/orderbook/:symbol', this.handleGetOrderBook.bind(this));
    this.addRoute('GET', '/orderbook/:symbol/depth', this.handleGetOrderBookDepth.bind(this));

    // Trades
    this.addRoute('GET', '/trades/:symbol', this.handleGetTrades.bind(this));
    this.addRoute('GET', '/trades/account/:accountId', this.handleGetAccountTrades.bind(this));
  }

  private addRoute(method: string, path: string, handler: RouteHandler): void {
    const paramNames: string[] = [];
    const patternParts = path.split('/').map((part) => {
      if (part.startsWith(':')) {
        paramNames.push(part.slice(1));
        return '([^/]+)';
      }
      return part;
    });

    const pattern = new RegExp(`^${patternParts.join('/')}$`);
    this.routes.push({ method, pattern, paramNames, handler });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Account-ID');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const pathname = url.pathname;
    const query = url.searchParams;

    // Find matching route
    for (const route of this.routes) {
      if (route.method !== req.method) continue;

      const match = pathname.match(route.pattern);
      if (!match) continue;

      // Extract params
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1]!;
      });

      // Parse body for POST/PUT
      let body: any = null;
      if (req.method === 'POST' || req.method === 'PUT') {
        body = await this.parseBody(req);
      }

      // Execute handler
      return route.handler(req, res, params, query, body);
    }

    // No route found
    this.sendError(res, 404, 'Not found');
  }

  private async parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 1e6) {
          req.destroy();
          reject(new Error('Body too large'));
        }
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : null);
        } catch {
          resolve(null);
        }
      });
      req.on('error', reject);
    });
  }

  // ===========================================================================
  // HANDLERS
  // ===========================================================================

  private async handleHealth(
    _req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    this.sendJson(res, 200, {
      status: 'healthy',
      timestamp: Date.now(),
      service: 'order-engine',
    });
  }

  private async handleStats(
    _req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    if (!this.orderManager) {
      this.sendError(res, 503, 'Service not initialized');
      return;
    }

    const stats = this.orderManager.getStats();

    // Convert Map to object for JSON
    const symbolStats: Record<string, any> = {};
    stats.symbolStats.forEach((value, key) => {
      symbolStats[key] = value;
    });

    this.sendJson(res, 200, {
      ...stats,
      symbolStats,
    });
  }

  private async handlePlaceOrder(
    req: IncomingMessage,
    res: ServerResponse,
    _params: Record<string, string>,
    _query: URLSearchParams,
    body: any
  ): Promise<void> {
    if (!this.orderManager) {
      this.sendError(res, 503, 'Service not initialized');
      return;
    }

    if (!body) {
      this.sendError(res, 400, 'Request body required');
      return;
    }

    // Get account ID from header or body
    const accountId = req.headers['x-account-id'] as string || body.accountId;
    if (!accountId) {
      this.sendError(res, 400, 'Account ID required');
      return;
    }

    const result = await this.orderManager.placeOrder({
      ...body,
      accountId,
    });

    if (result.success) {
      this.sendJson(res, 201, result);
    } else {
      this.sendJson(res, 400, result);
    }
  }

  private async handleCancelOrder(
    req: IncomingMessage,
    res: ServerResponse,
    params: Record<string, string>
  ): Promise<void> {
    if (!this.orderManager) {
      this.sendError(res, 503, 'Service not initialized');
      return;
    }

    const accountId = req.headers['x-account-id'] as string;
    if (!accountId) {
      this.sendError(res, 400, 'Account ID required (X-Account-ID header)');
      return;
    }

    const result = await this.orderManager.cancelOrder(params.id!, accountId);

    if (result.success) {
      this.sendJson(res, 200, result);
    } else {
      this.sendJson(res, 400, result);
    }
  }

  private async handleGetOrder(
    _req: IncomingMessage,
    res: ServerResponse,
    params: Record<string, string>
  ): Promise<void> {
    if (!this.orderManager) {
      this.sendError(res, 503, 'Service not initialized');
      return;
    }

    const order = await this.orderManager.getOrder(params.id!);

    if (order) {
      this.sendJson(res, 200, order);
    } else {
      this.sendError(res, 404, 'Order not found');
    }
  }

  private async handleGetOrders(
    req: IncomingMessage,
    res: ServerResponse,
    _params: Record<string, string>,
    query: URLSearchParams
  ): Promise<void> {
    const accountId = req.headers['x-account-id'] as string || query.get('accountId');
    if (!accountId) {
      this.sendError(res, 400, 'Account ID required');
      return;
    }

    const symbol = query.get('symbol') || undefined;
    const status = query.get('status')?.split(',') || undefined;
    const limit = parseInt(query.get('limit') || '100', 10);
    const offset = parseInt(query.get('offset') || '0', 10);

    const orders = await getOrdersByAccount(accountId, { symbol, status, limit, offset });
    this.sendJson(res, 200, { orders, total: orders.length });
  }

  private async handleGetOrderBook(
    _req: IncomingMessage,
    res: ServerResponse,
    params: Record<string, string>,
    query: URLSearchParams
  ): Promise<void> {
    if (!this.orderManager) {
      this.sendError(res, 503, 'Service not initialized');
      return;
    }

    const depth = parseInt(query.get('depth') || '20', 10);
    const snapshot = this.orderManager.getOrderBookSnapshot(params.symbol!, depth);

    if (snapshot) {
      this.sendJson(res, 200, snapshot);
    } else {
      this.sendJson(res, 200, { symbol: params.symbol, bids: [], asks: [], timestamp: Date.now() });
    }
  }

  private async handleGetOrderBookDepth(
    _req: IncomingMessage,
    res: ServerResponse,
    params: Record<string, string>,
    query: URLSearchParams
  ): Promise<void> {
    if (!this.orderManager) {
      this.sendError(res, 503, 'Service not initialized');
      return;
    }

    const levels = parseInt(query.get('levels') || '50', 10);
    const snapshot = this.orderManager.getOrderBookSnapshot(params.symbol!, levels);

    if (snapshot) {
      // Format as depth (just price and quantity per level)
      const bids = snapshot.bids.map((b) => [b.price, b.quantity]);
      const asks = snapshot.asks.map((a) => [a.price, a.quantity]);
      this.sendJson(res, 200, { symbol: params.symbol, bids, asks, timestamp: snapshot.timestamp });
    } else {
      this.sendJson(res, 200, { symbol: params.symbol, bids: [], asks: [], timestamp: Date.now() });
    }
  }

  private async handleGetTrades(
    _req: IncomingMessage,
    res: ServerResponse,
    params: Record<string, string>,
    query: URLSearchParams
  ): Promise<void> {
    const limit = parseInt(query.get('limit') || '100', 10);
    const trades = await getRecentTrades(params.symbol!, limit);
    this.sendJson(res, 200, { trades, total: trades.length });
  }

  private async handleGetAccountTrades(
    _req: IncomingMessage,
    res: ServerResponse,
    params: Record<string, string>,
    query: URLSearchParams
  ): Promise<void> {
    const symbol = query.get('symbol') || undefined;
    const limit = parseInt(query.get('limit') || '100', 10);
    const offset = parseInt(query.get('offset') || '0', 10);

    const trades = await getTradesByAccount(params.accountId!, { symbol, limit, offset });
    this.sendJson(res, 200, { trades, total: trades.length });
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private sendJson(res: ServerResponse, status: number, data: any): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private sendError(res: ServerResponse, status: number, message: string): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  }
}
