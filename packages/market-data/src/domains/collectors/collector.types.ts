/**
 * Collector Types
 * ===============
 *
 * Type definitions for the data collection layer. These types define the
 * contract between data sources (Binance, Yahoo, etc.) and the rest of
 * the system.
 *
 * ARCHITECTURE PRINCIPLE: Source Agnostic
 * ----------------------------------------
 * The collectors normalize all incoming data to a unified format (NormalizedTick).
 * This means the rest of the application doesn't care WHERE the data came from,
 * only that it conforms to our schema. This makes it trivial to:
 * - Add new data sources
 * - Replace failing sources
 * - Run multiple sources for the same symbol (for redundancy)
 */

import type { AssetKind } from '../../config/symbols.js';

/**
 * The universal tick format used throughout the application.
 * All collectors MUST output data in this format.
 *
 * WHY THESE FIELDS:
 * - symbol: Our internal canonical symbol (e.g., "BTC/USD")
 * - bid/ask: Best prices for buy/sell (may be absent for some sources)
 * - last: Last traded price (most commonly available)
 * - volume: 24h volume if available
 * - timestamp: When this price was recorded at the source
 * - source: Which collector produced this tick (for debugging)
 */
export interface NormalizedTick {
  /** Our internal symbol (e.g., "BTC/USD") */
  symbol: string;

  /** Best bid price (buyer willing to pay) */
  bid?: number;

  /** Best ask price (seller willing to accept) */
  ask?: number;

  /** Last traded price */
  last: number;

  /** 24-hour trading volume (in base currency) */
  volume?: number;

  /** 24-hour price change percentage */
  changePercent?: number;

  /** Timestamp from source (epoch milliseconds) */
  timestamp: number;

  /** Which collector produced this tick */
  source: string;
}

/**
 * Collector lifecycle states.
 * Used for health monitoring and graceful shutdown.
 */
export type CollectorState =
  | 'disconnected'  // Not connected, not trying to connect
  | 'connecting'    // Connection attempt in progress
  | 'connected'     // Connected and receiving data
  | 'reconnecting'  // Lost connection, attempting to reconnect
  | 'error'         // In error state (circuit open)
  | 'stopped';      // Permanently stopped

/**
 * Collector health status for monitoring.
 */
export interface CollectorHealth {
  /** Collector identifier */
  name: string;

  /** Current state */
  state: CollectorState;

  /** Number of symbols being tracked */
  subscribedSymbols: number;

  /** Ticks received in the last minute */
  ticksPerMinute: number;

  /** Last successful tick timestamp */
  lastTickAt?: number;

  /** Last error message if any */
  lastError?: string;

  /** Circuit breaker status */
  circuitBreakerOpen: boolean;
}

/**
 * Error types that collectors can emit.
 * Used for error handling and circuit breaker decisions.
 */
export type CollectorErrorType =
  | 'connection_failed'     // Could not establish connection
  | 'connection_lost'       // Lost existing connection
  | 'parse_error'           // Failed to parse incoming data
  | 'rate_limited'          // Hit API rate limit
  | 'authentication_failed' // Auth failed (for sources that require it)
  | 'unknown';              // Catch-all for unexpected errors

/**
 * Structured error for collector failures.
 */
export interface CollectorError {
  type: CollectorErrorType;
  message: string;
  source: string;
  timestamp: number;
  retryable: boolean;
  originalError?: Error;
}

/**
 * Handler type for tick events.
 */
export type TickHandler = (tick: NormalizedTick) => void;

/**
 * Handler type for error events.
 */
export type ErrorHandler = (error: CollectorError) => void;

/**
 * Handler type for state change events.
 */
export type StateChangeHandler = (state: CollectorState, previousState: CollectorState) => void;

/**
 * Interface that all collectors must implement.
 *
 * DESIGN PATTERN: Strategy
 * Each collector is a different strategy for getting market data.
 * They all share the same interface, so the rest of the system
 * can work with them interchangeably.
 */
export interface ICollector {
  /** Unique name for this collector (e.g., "binance", "yahoo") */
  readonly name: string;

  /** What asset types this collector can handle */
  readonly supportedKinds: AssetKind[];

  /** Current connection state */
  readonly state: CollectorState;

  /**
   * Start the collector and connect to the data source.
   * This should be idempotent (calling multiple times is safe).
   */
  start(): Promise<void>;

  /**
   * Stop the collector and disconnect from the data source.
   * Should clean up all resources (timers, connections, etc.).
   */
  stop(): Promise<void>;

  /**
   * Subscribe to price updates for specific symbols.
   * @param symbols - Our internal symbol format (e.g., ["BTC/USD", "ETH/USD"])
   */
  subscribe(symbols: string[]): Promise<void>;

  /**
   * Unsubscribe from price updates.
   * @param symbols - Symbols to stop tracking
   */
  unsubscribe(symbols: string[]): Promise<void>;

  /**
   * Register a handler for incoming ticks.
   * Multiple handlers can be registered.
   */
  onTick(handler: TickHandler): void;

  /**
   * Register a handler for errors.
   */
  onError(handler: ErrorHandler): void;

  /**
   * Register a handler for state changes.
   */
  onStateChange(handler: StateChangeHandler): void;

  /**
   * Get current health status for monitoring.
   */
  getHealth(): CollectorHealth;
}

/**
 * Configuration for creating a collector instance.
 */
export interface CollectorConfig {
  /** Enable debug logging */
  debug?: boolean;

  /** Custom reconnect delay (default: exponential backoff) */
  reconnectDelayMs?: number;

  /** Maximum reconnect attempts before giving up (default: unlimited) */
  maxReconnectAttempts?: number;
}
