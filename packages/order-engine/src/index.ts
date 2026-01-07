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
 * │  │  (Port 4003)  │  │      (Port 4004)         │   │
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
import { isDatabaseConnected, closeDb, isRedisConnected, closeRedis, subscribe, getDbClient } from '@repo/database';
import { OrderManager } from './domains/orders/order-manager.js';
import { OrderEngineWebSocket } from './domains/stream/websocket-server.js';
import { RestApiServer } from './api/rest-api.js';
import { HealthService } from './domains/health/health-service.js';
import { PositionManager } from './domains/positions/position-manager.js';
import { TradeProcessor } from './domains/trades/trade-processor.js';
import { createLedgerService, type LedgerService } from '@repo/ledger';
import { RiskGateway } from './risk-gateway.js';

const log = logger.child({ component: 'order-engine' });

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
      const db = await getDbClient();

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
      await this.wsServer.start(env.WS_PORT);

      // 6. Start REST API server
      this.restApi = new RestApiServer();
      this.restApi.setOrderManager(this.orderManager);
      await this.restApi.start(env.PORT);

      // 7. Subscribe to market data updates (if available)
      this.subscribeToMarketData();

      // 8. Setup graceful shutdown
      this.setupShutdownHandlers();

      this.isRunning = true;
      log.info({
        restPort: env.PORT,
        wsPort: env.WS_PORT,
      }, '✅ Order Engine Service started');

    } catch (error) {
      log.error({ error }, 'Failed to start Order Engine Service');
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
      log.fatal({ error }, 'Uncaught exception');
      this.stop().then(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason) => {
      log.error({ reason }, 'Unhandled rejection');
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
    port: env.PORT,
    wsPort: env.WS_PORT,
  }, 'Order Engine configuration');

  // Check dependencies
  const dbConnected = await isDatabaseConnected();
  const redisConnected = await isRedisConnected();

  if (!dbConnected) {
    log.warn('Database not connected - orders will not be persisted');
  }

  if (!redisConnected) {
    log.warn('Redis not connected - using in-memory fallback');
  }

  // Start service
  const service = new OrderEngineService();
  await service.start();
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((error) => {
    log.fatal({ error }, 'Fatal error starting Order Engine');
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

