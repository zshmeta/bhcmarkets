/**
 * Collector Registry
 * ==================
 *
 * Central registry that manages all data collectors and routes ticks
 * to subscribers.
 *
 * RESPONSIBILITIES:
 * 1. Create and manage collector instances
 * 2. Route incoming ticks to the appropriate handlers
 * 3. Aggregate health status across all collectors
 * 4. Handle collector lifecycle (start/stop)
 *
 * DESIGN PATTERN: Mediator
 * The registry acts as a mediator between collectors and consumers.
 * Consumers don't need to know about individual collectors; they
 * subscribe to symbols and receive ticks through the registry.
 */

import { EventEmitter } from 'events';
import { BinanceCollector } from './binance.collector.js';
import { YahooCollector } from './yahoo.collector.js';
import { validateTick } from './tick.validator.js';
import {
  ALL_SYMBOLS,
  CRYPTO_SYMBOLS,
  FOREX_SYMBOLS,
  STOCK_SYMBOLS,
  INDEX_SYMBOLS,
  COMMODITY_SYMBOLS,
  type AssetKind,
} from '../../config/symbols.js';
import { logger } from '../../utils/logger.js';
import type {
  ICollector,
  NormalizedTick,
  CollectorHealth,
  CollectorError,
} from './collector.types.js';

/**
 * Aggregated health status for all collectors.
 */
export interface RegistryHealth {
  /** Overall status: healthy if all collectors are working */
  status: 'healthy' | 'degraded' | 'unhealthy';

  /** Total ticks per minute across all collectors */
  totalTicksPerMinute: number;

  /** Number of symbols being tracked */
  trackedSymbols: number;

  /** Individual collector health */
  collectors: CollectorHealth[];
}

/**
 * Handler for aggregated ticks.
 */
export type RegistryTickHandler = (tick: NormalizedTick) => void;

/**
 * Central collector registry.
 */
export class CollectorRegistry {
  private log = logger.child({ component: 'collector-registry' });

  /** Map of collector name to instance */
  private collectors = new Map<string, ICollector>();

  /** Event emitter for tick distribution */
  private emitter = new EventEmitter();

  /** Track total ticks for metrics */
  private tickCount = 0;
  private tickCountResetTimer?: NodeJS.Timeout;

  /** Track validation errors for monitoring */
  private validationErrors = 0;

  constructor() {
    // Reset tick count every minute
    this.tickCountResetTimer = setInterval(() => {
      if (this.tickCount > 0) {
        this.log.info({
          ticksPerMinute: this.tickCount,
          validationErrors: this.validationErrors,
        }, 'Tick rate summary');
      }
      this.tickCount = 0;
      this.validationErrors = 0;
    }, 60000);
  }

  /**
   * Initialize all collectors.
   *
   * COLLECTOR ASSIGNMENT:
   * - Binance: All crypto symbols (real-time WebSocket)
   * - Yahoo: Everything else (polling)
   */
  async initialize(): Promise<void> {
    this.log.info('Initializing collectors...');

    // Create Binance collector for crypto
    const binance = new BinanceCollector();
    this.registerCollector(binance);

    // Create Yahoo collector for traditional assets
    const yahoo = new YahooCollector();
    this.registerCollector(yahoo);

    this.log.info({
      collectors: Array.from(this.collectors.keys()),
    }, 'Collectors initialized');
  }

  /**
   * Start all collectors and subscribe to symbols.
   */
  async start(): Promise<void> {
    this.log.info('Starting all collectors...');

    // Start each collector
    for (const [name, collector] of this.collectors) {
      try {
        await collector.start();
        this.log.info({ collector: name }, 'Collector started');
      } catch (error) {
        this.log.error({ error, collector: name }, 'Failed to start collector');
      }
    }

    // Subscribe to appropriate symbols for each collector
    await this.subscribeToSymbols();

    this.log.info('All collectors started');
  }

  /**
   * Stop all collectors.
   */
  async stop(): Promise<void> {
    this.log.info('Stopping all collectors...');

    // Clear tick count timer
    if (this.tickCountResetTimer) {
      clearInterval(this.tickCountResetTimer);
    }

    // Stop each collector
    for (const [name, collector] of this.collectors) {
      try {
        await collector.stop();
        this.log.info({ collector: name }, 'Collector stopped');
      } catch (error) {
        this.log.error({ error, collector: name }, 'Error stopping collector');
      }
    }

    this.collectors.clear();
  }

  /**
   * Register a handler for all incoming ticks.
   * This is how consumers receive price updates.
   */
  onTick(handler: RegistryTickHandler): void {
    this.emitter.on('tick', handler);
  }

  /**
   * Remove a tick handler.
   */
  offTick(handler: RegistryTickHandler): void {
    this.emitter.off('tick', handler);
  }

  /**
   * Get aggregated health status.
   */
  getHealth(): RegistryHealth {
    const collectorHealths = Array.from(this.collectors.values())
      .map(c => c.getHealth());

    // Determine overall status
    const allConnected = collectorHealths.every(h => h.state === 'connected');
    const anyConnected = collectorHealths.some(h => h.state === 'connected');

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allConnected) {
      status = 'healthy';
    } else if (anyConnected) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      totalTicksPerMinute: this.tickCount,
      trackedSymbols: ALL_SYMBOLS.length,
      collectors: collectorHealths,
    };
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  /**
   * Register a collector and set up event handlers.
   */
  private registerCollector(collector: ICollector): void {
    // Set up tick handler with validation
    collector.onTick((tick) => {
      this.handleTick(tick);
    });

    // Set up error handler
    collector.onError((error) => {
      this.handleError(error);
    });

    // Set up state change handler
    collector.onStateChange((state, prevState) => {
      this.log.info({
        collector: collector.name,
        from: prevState,
        to: state,
      }, 'Collector state changed');
    });

    this.collectors.set(collector.name, collector);
  }

  /**
   * Subscribe each collector to its appropriate symbols.
   */
  private async subscribeToSymbols(): Promise<void> {
    for (const [name, collector] of this.collectors) {
      const symbols = this.getSymbolsForCollector(collector);

      if (symbols.length === 0) {
        this.log.warn({ collector: name }, 'No symbols to subscribe');
        continue;
      }

      try {
        await collector.subscribe(symbols);
        this.log.info({
          collector: name,
          symbolCount: symbols.length,
          symbols: symbols.slice(0, 5), // Log first 5
        }, 'Subscribed to symbols');
      } catch (error) {
        this.log.error({ error, collector: name }, 'Failed to subscribe');
      }
    }
  }

  /**
   * Get the list of internal symbols a collector should handle.
   */
  private getSymbolsForCollector(collector: ICollector): string[] {
    const symbols: string[] = [];

    // Add symbols based on collector's supported asset kinds
    for (const kind of collector.supportedKinds) {
      switch (kind) {
        case 'crypto':
          symbols.push(...CRYPTO_SYMBOLS.map(s => s.symbol));
          break;
        case 'forex':
          symbols.push(...FOREX_SYMBOLS.map(s => s.symbol));
          break;
        case 'stock':
          symbols.push(...STOCK_SYMBOLS.map(s => s.symbol));
          break;
        case 'index':
          symbols.push(...INDEX_SYMBOLS.map(s => s.symbol));
          break;
        case 'commodity':
          symbols.push(...COMMODITY_SYMBOLS.map(s => s.symbol));
          break;
      }
    }

    return symbols;
  }

  /**
   * Handle incoming tick with validation.
   */
  private handleTick(tick: NormalizedTick): void {
    // Validate the tick
    const validation = validateTick(tick);

    if (!validation.valid) {
      this.validationErrors++;
      this.log.debug({
        error: validation.error,
        tick,
      }, 'Tick validation failed');
      return;
    }

    // Track metrics
    this.tickCount++;

    // Emit to subscribers
    this.emitter.emit('tick', tick);
  }

  /**
   * Handle collector error.
   */
  private handleError(error: CollectorError): void {
    this.log.error({
      source: error.source,
      type: error.type,
      message: error.message,
      retryable: error.retryable,
    }, 'Collector error');
  }
}
