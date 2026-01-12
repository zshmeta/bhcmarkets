/**
 * Order Engine Service
 * ====================
 *
 * Production-ready order matching engine service.
 *
 * COMPONENTS:
 * - Matching Engine: Price-time priority order matching
 * - Order Manager: Order lifecycle, validation, persistence
 * - WebSocket Server: Real-time order book & trade streaming
 * - REST API: HTTP endpoints for order operations
 * - Health Service: Monitoring and metrics
 *
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────┐
 * │                   Order Engine                       │
 * ├─────────────────────────────────────────────────────┤
 * │  ┌───────────────┐  ┌──────────────────────────┐   │
 * │  │   REST API    │  │    WebSocket Server      │   │
 * │  │  (Port 4000)  │  │      (Port 4040)         │   │
 * │  └───────┬───────┘  └────────────┬─────────────┘   │
 * │          │                       │                  │
 * │          └───────────┬───────────┘                  │
 * │                      ▼                              │
 * │          ┌───────────────────────┐                  │
 * │          │    Order Manager      │                  │
 * │          │  - Validation         │                  │
 * │          │  - Persistence        │                  │
 * │          │  - Stop Orders        │                  │
 * │          └───────────┬───────────┘                  │
 * │                      ▼                              │
 * │          ┌───────────────────────┐                  │
 * │          │  Order Book Manager   │                  │
 * │          │  ┌─────────────────┐  │                  │
 * │          │  │ Matching Engine │  │                  │
 * │          │  │   (per symbol)  │  │                  │
 * │          │  └─────────────────┘  │                  │
 * │          └───────────────────────┘                  │
 * │                      │                              │
 * │          ┌───────────┴───────────┐                  │
 * │          ▼                       ▼                  │
 * │    ┌──────────┐           ┌──────────┐             │
 * │    │PostgreSQL│           │  Redis   │             │
 * │    │(orders,  │           │(pub/sub) │             │
 * │    │ trades)  │           │          │             │
 * │    └──────────┘           └──────────┘             │
 * └─────────────────────────────────────────────────────┘
 */

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { isDatabaseConnected, closeDb, isRedisConnectedWithConfig, closeRedis, subscribe, getDbClient, getPubSubWithConfig, getRedisWithConfig } from '@repo/database';
import { OrderManager } from './domains/orders/order-manager.js';
import { OrderEngineWebSocket } from './domains/stream/websocket-server.js';
import { RestApiServer } from './api/rest-api.js';
import { HealthService } from './domains/health/health-service.js';
import { PositionManager } from './domains/positions/position-manager.js';
import { TradeProcessor } from './domains/trades/trade-processor.js';
import { createLedgerService, type LedgerService } from '@repo/ledger';
import { RiskGateway } from './risk-gateway.js';

const log = logger.child({ component: 'order-engine' });

async function assertDatabaseSchema(): Promise<void> {
  // Use the shared singleton client so this check matches the rest of the service.
  const sql = await getDbClient({ connectionString: env.DATABASE_URL });

  // We check explicitly in `public` because some dev environments tweak search_path.
  // to_regclass returns NULL when the relation doesn't exist.
  const rows = await sql`
    SELECT
      to_regclass('public.orders') as orders,
      to_regclass('public.execution_trades') as execution_trades
  `;

  const row = (rows?.[0] ?? {}) as { orders?: string | null; execution_trades?: string | null };
  const missing: string[] = [];
  if (!row.orders) missing.push('orders');
  if (!row.execution_trades) missing.push('execution_trades');

  if (missing.length > 0) {
    throw new Error(
      `Database schema is missing required tables: ${missing.join(', ')}. ` +
        `Run \`bun run db:push\` for dev, or \`bun run db:generate && bun run db:migrate\` to create migrations and apply them.`
    );
  }
}

async function waitForDatabaseConnected(options?: { retryMs?: number; timeoutMs?: number }): Promise<void> {
  const retryMs = options?.retryMs ?? 2000;
  const timeoutMs = options?.timeoutMs ?? 60_000;
  const startedAt = Date.now();

  while (true) {
    try {
      // Ensure the singleton client is created and validated.
      await getDbClient({ connectionString: env.DATABASE_URL, connectTimeout: 5 });
      if (await isDatabaseConnected()) return;
    } catch {
      // If the initial connect attempt fails, ensure we don't keep a poisoned singleton.
      await closeDb().catch(() => undefined);
    }

    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error('Database not connected');
    }

    log.info('Database not connected - retrying...');
    await new Promise((resolve) => setTimeout(resolve, retryMs));
  }
}

async function waitForRedisConnected(options: { url: string; retryMs?: number; timeoutMs?: number }): Promise<void> {
  const retryMs = options?.retryMs ?? 1000;
  const timeoutMs = options?.timeoutMs ?? 30_000;
  const startedAt = Date.now();

  // Ensure pub/sub clients are created; ioredis will reconnect automatically.
  getPubSubWithConfig({ url: options.url });
  const redis = getRedisWithConfig({ url: options.url });

  while (Date.now() - startedAt < timeoutMs) {
    try {
      // A successful ping implies TCP + AUTH are both working.
      if (redis) {
        await redis.ping();
      }
      if (isRedisConnectedWithConfig({ url: options.url })) return;
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : String(err);
      if (/NOAUTH|WRONGPASS|invalid username-password pair|invalid password|ERR\s+invalid\s+password|NOPERM/i.test(msg)) {
        throw new Error(
          `Redis authentication/ACL failed (${msg}). Set REDIS_URL like redis://:PASSWORD@host:6379`
        );
      }
    }
    await new Promise((resolve) => setTimeout(resolve, retryMs));
  }

  if (!isRedisConnectedWithConfig({ url: options.url })) {
    throw new Error('Redis not connected');
  }
}

// ============================================================================
// ORDER ENGINE SERVICE
// ============================================================================

export class OrderEngineService {
  private orderManager: OrderManager | null = null;
  private wsServer: OrderEngineWebSocket | null = null;
  private restApi: RestApiServer | null = null;
  private healthService: HealthService | null = null;
  private positionManager: PositionManager | null = null;
  private tradeProcessor: TradeProcessor | null = null;
  private ledgerService: LedgerService | null = null;
  private riskGateway: RiskGateway | null = null;

  private isRunning: boolean = false;
  private shutdownPromise: Promise<void> | null = null;

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Start the order engine service.
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      log.warn('Service already running');
      return;
    }

    log.info('Starting Order Engine Service...');

    try {
      // 1. Initialize health service
      this.healthService = new HealthService();
      this.healthService.start();

      // 2. Get database connection for ledger
      const db = await getDbClient({
        connectionString: env.DATABASE_URL,
      });

      // 2b. Ensure required tables exist before we attempt recovery.
      await assertDatabaseSchema();

      // 3. Initialize core trading domains
      this.positionManager = new PositionManager();
      this.ledgerService = createLedgerService({ db, logger: log });
      this.tradeProcessor = new TradeProcessor();

      // 4. Initialize risk gateway (lightweight pre-trade checks)
      this.riskGateway = new RiskGateway({ logger: log });
      this.riskGateway.startAutoRefresh();

      // Wire up dependencies
      this.tradeProcessor.setPositionManager(this.positionManager);
      this.tradeProcessor.setLedgerService(this.ledgerService);

      // 5. Initialize order manager
      this.orderManager = new OrderManager({
        enablePersistence: env.NODE_ENV !== 'test',
        enableEventPublishing: true,
      });

      // 4. Recover orders from database
      const recoveredCount = await this.orderManager.recoverOrders();
      log.info({ recoveredCount }, 'Orders recovered from database');

      // 5. Start WebSocket server
      this.wsServer = new OrderEngineWebSocket();
      this.wsServer.setSnapshotProvider((symbol, depth) => {
        return this.orderManager?.getOrderBookSnapshot(symbol, depth) ?? null;
      });
      await this.wsServer.start(env.ORDER_ENGINE_WS_PORT);

      // 6. Start REST API server
      this.restApi = new RestApiServer();
      this.restApi.setOrderManager(this.orderManager);
      await this.restApi.start(env.ORDER_ENGINE_PORT);

      // 7. Subscribe to market data updates (if available)
      this.subscribeToMarketData();

      // 8. Setup graceful shutdown
      this.setupShutdownHandlers();

      this.isRunning = true;
      log.info({
        restPort: env.ORDER_ENGINE_PORT,
        wsPort: env.ORDER_ENGINE_WS_PORT,
      }, '✅ Order Engine Service started');

    } catch (error) {
      // Use the standard `err` key so we get message + stack in logs.
      log.error({ err: error }, 'Failed to start Order Engine Service');
      await this.stop();
      throw error;
    }
  }

  /**
   * Stop the order engine service.
   */
  async stop(): Promise<void> {
    if (this.shutdownPromise) {
      return this.shutdownPromise;
    }

    this.shutdownPromise = this.performShutdown();
    return this.shutdownPromise;
  }

  private async performShutdown(): Promise<void> {
    log.info('Stopping Order Engine Service...');

    // Stop accepting new requests
    this.isRunning = false;

    // 1. Stop REST API (stop accepting new orders)
    if (this.restApi) {
      await this.restApi.stop();
      this.restApi = null;
    }

    // 2. Stop WebSocket server
    if (this.wsServer) {
      await this.wsServer.stop();
      this.wsServer = null;
    }

    // 3. Shutdown order manager (flushes pending trades)
    if (this.orderManager) {
      await this.orderManager.shutdown();
      this.orderManager = null;
    }

    // 4. Stop health service
    if (this.healthService) {
      this.healthService.stop();
      this.healthService = null;
    }

    // 5. Close database connection
    await closeDb();

    // 6. Close Redis connection
    await closeRedis();

    log.info('✅ Order Engine Service stopped');
  }

  // ===========================================================================
  // MARKET DATA INTEGRATION
  // ===========================================================================

  private subscribeToMarketData(): void {
    // Subscribe to price updates from market-data service
    subscribe('market:prices', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.symbol && data.price) {
          this.orderManager?.updateMarketPrice(data.symbol, data.price);
        }
      } catch (error) {
        log.warn({ error }, 'Failed to parse market price update');
      }
    });

    log.debug('Subscribed to market data updates');
  }

  // ===========================================================================
  // GRACEFUL SHUTDOWN
  // ===========================================================================

  private setupShutdownHandlers(): void {
    const shutdown = async (signal: string) => {
      log.info({ signal }, 'Received shutdown signal');
      await this.stop();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      // Fatal logs must include the stack trace so we can debug production incidents.
      log.fatal({ err: error }, 'Uncaught exception');
      this.stop().then(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason) => {
      log.error({ err: reason }, 'Unhandled rejection');
    });
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Check if service is running.
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get health information.
   */
  async getHealth() {
    return this.healthService?.getHealth();
  }

  /**
   * Get order manager instance (for testing).
   */
  getOrderManager(): OrderManager | null {
    return this.orderManager;
  }

  /**
   * Get WebSocket server instance (for testing).
   */
  getWebSocketServer(): OrderEngineWebSocket | null {
    return this.wsServer;
  }

  /**
   * Get position manager instance.
   */
  getPositionManager(): PositionManager | null {
    return this.positionManager;
  }

  /**
   * Get trade processor instance.
   */
  getTradeProcessor(): TradeProcessor | null {
    return this.tradeProcessor;
  }

  /**
   * Get ledger service instance.
   */
  getLedgerService(): LedgerService | null {
    return this.ledgerService;
  }

  /**
   * Get risk gateway instance.
   */
  getRiskGateway(): RiskGateway | null {
    return this.riskGateway;
  }
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

async function main() {
  log.info({
    nodeEnv: env.NODE_ENV,
    port: env.ORDER_ENGINE_PORT,
    wsPort: env.ORDER_ENGINE_WS_PORT,

  }, 'Order Engine configuration');


  // Check connections. Retry until connected.

  await waitForDatabaseConnected();

  // Redis is required for pub/sub between services in production-grade deployments.
  // If REDIS_URL is misconfigured or Redis is down, fail startup rather than silently degrading.
  await waitForRedisConnected({ url: env.REDIS_URL });

  // Start service
  const service = new OrderEngineService();
  await service.start();
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((error) => {
    log.fatal({ err: error }, 'Fatal error starting Order Engine');
    process.exit(1);
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export { OrderEngineService as default };

// Re-export types
export type {
  Order,
  PlaceOrderInput,
  PlaceOrderResult,
  CancelOrderResult,
  EngineOrder,
  EngineTrade,
  OrderBookSnapshot,
  OrderSide,
  OrderType,
  OrderStatus,
  TimeInForce,
} from './types/order.types.js';

// Re-export core classes
export { OrderManager, type OrderManagerConfig } from './domains/orders/order-manager.js';
export { OrderValidator, type ValidationConfig } from './domains/orders/order-validator.js';
export { MatchingEngine, type MatchResult, type MatchingEvent } from './domains/matching/matching-engine.js';
export { OrderBook, type OrderBookUpdate, type PriceLevel, type OrderBookStats } from './domains/matching/index.js';
export { OrderBookManager, type OrderBookManagerStats } from './domains/matching/order-book-manager.js';
export { OrderEngineWebSocket } from './domains/stream/websocket-server.js';
export { RestApiServer } from './api/rest-api.js';
export { HealthService, type SystemHealth, type HealthMetrics } from './domains/health/health-service.js';

// Re-export trading domains
export { PositionManager } from './domains/positions/position-manager.js';
export type {
  Position,
  PositionSide,
  EnginePosition,
  PositionSnapshot,
  PositionChangeEvent,
} from './domains/positions/position.types.js';

// Position email handler for trade notifications
export {
  createPositionEmailHandler,
  type UserResolver,
  type PositionResolver,
  type TradeHistoryResolver,
  // Keep the public API stable: external callers can keep importing PositionEmailClient.
  type EmailClient as PositionEmailClient,
  type PositionEmailHandlerConfig,
  type TradeOpenedPayload,
  type TradeClosedPayload,
} from './domains/positions/position.emails.js';

export { TradeProcessor } from './domains/trades/trade-processor.js';
export { FeeCalculator, type FeeTier } from './domains/trades/fee-calculator.js';
export type {
  Trade,
  AccountTrade,
  TradeExecution,
  FeeCalculation,
  TradeStats,
} from './domains/trades/trade.types.js';

// Re-export @repo/ledger for direct usage
export { createLedgerService } from '@repo/ledger';
export type {
  LedgerService,
  Balance,
  LedgerEntry,
  BalanceChange,
  HoldRequest,
  TradeSettlementInput,
  AccountSummary,
  LedgerEvent,
} from '@repo/ledger';

// Risk Gateway (fast pre-trade checks)
export {
  RiskGateway,
  createRiskGateway,
  getDefaultSymbolLimits,
  type RiskOrderInput,
  type CachedSymbolLimits,
  type CachedUserLimits,
  type RiskCheckResult,
  type RiskGatewayConfig,
} from './risk-gateway.js';

// Re-export config and utils
export { env } from './config/env.js';
export { logger } from './utils/logger.js';

