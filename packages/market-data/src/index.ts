/**
 * Market Data Service - Main Entry Point
 * =======================================
 *
 * This is the bootstrap file that wires everything together and starts
 * the market data service.
 *
 * SERVICE ARCHITECTURE:
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │                         DATA SOURCES                            │
 *   │  ┌───────────────┐              ┌───────────────────────────┐  │
 *   │  │   Binance     │ (WebSocket)  │       Yahoo Finance       │  │
 *   │  │   Collector   │              │        Collector          │  │
 *   │  │  (Crypto)     │              │  (Stocks/Forex/Indices)   │  │
 *   │  └───────┬───────┘              └────────────┬──────────────┘  │
 *   └──────────┼──────────────────────────────────┼──────────────────┘
 *              │                                   │
 *              └───────────────┬───────────────────┘
 *                              │
 *                    ┌─────────▼─────────┐
 *                    │ Collector Registry │
 *                    │ (Aggregates all   │
 *                    │  collector ticks) │
 *                    └─────────┬─────────┘
 *                              │
 *                    ┌─────────▼─────────┐
 *                    │    Normalizer     │
 *                    │ (Enriches ticks   │
 *                    │  with metadata)   │
 *                    └─────────┬─────────┘
 *                              │
 *         ┌────────────────────┼────────────────────┐
 *         │                    │                    │
 *   ┌─────▼─────┐      ┌───────▼───────┐    ┌──────▼──────┐
 *   │  Price    │      │   Candle      │    │  WebSocket  │
 *   │  Cache    │      │  Aggregator   │    │  Publisher  │
 *   │  (Redis)  │      │  (OHLCV)      │    │  (Clients)  │
 *   └─────┬─────┘      └───────┬───────┘    └──────┬──────┘
 *         │                    │                   │
 *   ┌─────▼─────┐      ┌───────▼───────┐    ┌─────▼──────┐
 *   │  REST API │      │   Database    │    │  Platform  │
 *   │  /prices  │      │   Storage     │    │    App     │
 *   └───────────┘      └───────────────┘    └────────────┘
 *
 * STARTUP SEQUENCE:
 * 1. Load configuration
 * 2. Initialize database connection
 * 3. Initialize Redis cache
 * 4. Initialize collectors (Binance, Yahoo)
 * 5. Start WebSocket server (for clients)
 * 6. Start HTTP API server
 * 7. Start collectors (begin receiving data)
 * 8. Wire up data pipeline
 *
 * SHUTDOWN SEQUENCE (graceful):
 * 1. Stop collectors (no new data)
 * 2. Flush remaining candles to DB
 * 3. Close WebSocket connections
 * 4. Close HTTP server
 * 5. Close database connection
 * 6. Close Redis connection
 */

import { env, isDev } from './config/env.js';
import { logger } from './utils/logger.js';

// Domain services
import { CollectorRegistry } from './domains/collectors/collector.registry.js';
import { NormalizerService } from './domains/normalizer/normalizer.service.js';
import { PriceCache } from './domains/cache/price.cache.js';
import { closeRedis, isRedisConnected, isUsingFallback, getRedisClient, getSubscriberClient } from './domains/cache/redis.client.js';
import { HistoricalService } from './domains/historical/historical.service.js';
import { MarketDataWebSocketServer } from './domains/stream/websocket.server.js';
import { HealthService } from './domains/health/health.service.js';
import { metrics } from './domains/health/metrics.collector.js';

// API
import { createApiServer } from './api/routes.js';

// Database
import { getDbClient, isDatabaseConnected, closeDb } from '@repo/database';

const log = logger.child({ component: 'bootstrap' });

/**
 * Main application class.
 * Manages the lifecycle of all services.
 */
class MarketDataService {
  private collectorRegistry!: CollectorRegistry;
  private normalizer!: NormalizerService;
  private priceCache!: PriceCache;
  private historicalService!: HistoricalService;
  private wsServer!: MarketDataWebSocketServer;
  private healthService!: HealthService;
  private httpServer!: ReturnType<typeof createApiServer>;

  private isRunning = false;

  /**
   * Start the market data service.
   */
  async start(): Promise<void> {
    log.info({ env: env.NODE_ENV }, 'Starting Market Data Service...');

    try {
      // Initialize components
      await this.initializeServices();

      // Wire up the data pipeline
      this.wireDataPipeline();

      // Start servers
      await this.startServers();

      // Start data collection
      await this.startDataCollection();

      this.isRunning = true;

      log.info({
        httpPort: env.MARKET_DATA_PORT,
        wsPort: env.MARKET_DATA_WS_PORT,
      }, '✅ Market Data Service started successfully');

      // Print summary
      this.printStartupSummary();

      // NOTE: Automatic backfill disabled for fast startup.
      // Historical data accumulates from live stream.
      // Chart component has Binance fallback for crypto historical data.
      // To manually trigger backfill, call: GET /api/backfill (to be implemented)

    } catch (error) {
      log.error({ error }, '❌ Failed to start service');
      await this.stop();
      process.exit(1);
    }
  }

  /**
   * Stop the service gracefully.
   */
  async stop(): Promise<void> {
    log.info('🛑 Stopping Market Data Service...');

    try {
      // Stop data collection first
      if (this.collectorRegistry) {
        await this.collectorRegistry.stop();
      }

      // Flush historical data
      if (this.historicalService) {
        await this.historicalService.stop();
      }

      // Stop WebSocket server
      if (this.wsServer) {
        await this.wsServer.stop();
      }

      // Stop HTTP server
      if (this.httpServer) {
        await new Promise<void>((resolve) => {
          this.httpServer.close(() => resolve());
        });
      }

      // Close connections
      await closeDb();
      await closeRedis();

      this.isRunning = false;
      log.info('✅ Service stopped gracefully');

    } catch (error) {
      log.error({ error }, 'Error during shutdown');
    }
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  /**
   * Initialize all service components.
   */
  private async initializeServices(): Promise<void> {
    log.info('Initializing services...');

    // 1. Database connection
    log.info('Connecting to database...');
    await getDbClient({ connectionString: env.DATABASE_URL });
    log.info('Database connected');

    // 1b. Redis connection (required for cache + pub/sub)
    log.info('Connecting to Redis...');
    await getRedisClient();
    await getSubscriberClient();
    log.info('Redis connected');


    // 2. Initialize components
    this.collectorRegistry = new CollectorRegistry();
    this.normalizer = new NormalizerService();
    this.priceCache = new PriceCache();
    this.historicalService = new HistoricalService();
    this.wsServer = new MarketDataWebSocketServer();
    this.healthService = new HealthService();

    // 3. Initialize collector registry
    await this.collectorRegistry.initialize();

    // 4. Initialize historical service (needs DB)
    await this.historicalService.initialize();

    // 5. Set up health providers
    this.setupHealthProviders();

    log.info('Services initialized');
  }

  /**
   * Wire up the data pipeline.
   *
   * Data flow:
   * Collectors → Registry → Normalizer → [Cache, Publisher, Historical]
   */
  private wireDataPipeline(): void {
    log.info('Wiring data pipeline...');

    // Collector Registry → Normalizer
    this.collectorRegistry.onTick((tick) => {
      const enriched = this.normalizer.process(tick);
      if (!enriched) return;

      // Update metrics
      metrics.increment('ticks.received');

      // Fan out to downstream services
      // 1. Update price cache
      this.priceCache.set(enriched).catch((err) => {
        log.error({ error: err }, 'Failed to update cache');
      });

      // 2. Update candle builder
      this.historicalService.processTick(enriched);

      // 3. Publish to WebSocket clients
      const published = this.wsServer.getPublisher().publish(enriched);
      metrics.increment('ticks.published', published);
    });

    log.info('Data pipeline wired');
  }

  /**
   * Start HTTP and WebSocket servers.
   */
  private async startServers(): Promise<void> {
    log.info('Starting servers...');

    // Start WebSocket server
    await this.wsServer.start();

    // Create and start HTTP server
    this.httpServer = createApiServer({
      priceCache: this.priceCache,
      historicalService: this.historicalService,
      healthService: this.healthService,
    });

    await new Promise<void>((resolve) => {
      this.httpServer.listen(env.MARKET_DATA_PORT, () => {
        log.info({ port: env.MARKET_DATA_PORT }, 'HTTP API server listening');
        resolve();
      });
    });
  }

  /**
   * Start data collectors.
   */
  private async startDataCollection(): Promise<void> {
    log.info('Starting data collection...');
    await this.collectorRegistry.start();
  }

  /**
   * Set up health monitoring providers.
   */
  private setupHealthProviders(): void {
    this.healthService.setProviders({
      getCollectorHealth: () => {
        const health = this.collectorRegistry.getHealth();
        return {
          status: health.status,
          totalTicksPerMinute: health.totalTicksPerMinute,
          collectors: health.collectors.map(c => ({
            name: c.name,
            state: c.state,
            ticksPerMinute: c.ticksPerMinute,
            lastTickAt: c.lastTickAt,
          })),
        };
      },
      getCacheHealth: () => {
        const stats = this.priceCache.getStats();
        return {
          redisConnected: isRedisConnected(),
          usingFallback: isUsingFallback(),
          hitRate: stats.hitRate,
        };
      },
      getWebSocketHealth: () => {
        const stats = this.wsServer.getStats();
        return {
          isRunning: stats.isRunning,
          connections: stats.connections.totalClients,
          subscriptions: stats.connections.totalSubscriptions,
        };
      },
      getDatabaseHealth: isDatabaseConnected,
    });
  }

  /**
   * Print a nice startup summary.
   */
  private printStartupSummary(): void {
    const divider = '═'.repeat(50);

    console.log(`
╔${divider}╗
║  📈 BHC Markets - Market Data Service           ║
╠${divider}╣
║  HTTP API:     http://localhost:${env.MARKET_DATA_PORT.toString().padEnd(5)}            ║
║  WebSocket:    ws://localhost:${env.MARKET_DATA_WS_PORT.toString().padEnd(5)}/ws          ║
╠${divider}╣
║  Endpoints:                                       ║
║    GET  /health           Health status           ║
║    GET  /api/prices       All prices              ║
║    GET  /api/candles/:sym Historical candles      ║
║    GET  /api/symbols      Available symbols       ║
╠${divider}╣
║  WebSocket Commands:                              ║
║    { "type": "subscribe", "symbols": ["BTC/USD"] }║
║    { "type": "unsubscribe", "symbols": [...] }    ║
║    { "type": "ping" }                             ║
╚${divider}╝
`);
  }
}

// ============================================================
// MAIN EXECUTION
// ============================================================

const service = new MarketDataService();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  log.info('Received SIGINT');
  await service.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.info('Received SIGTERM');
  await service.stop();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.fatal({ reason }, 'Unhandled rejection');
  process.exit(1);
});

// Start the service
service.start().catch((error) => {
  log.fatal({ error }, 'Failed to start service');
  process.exit(1);
});
