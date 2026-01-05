/**
 * Base Collector
 * ==============
 *
 * Abstract base class that provides common functionality for all collectors:
 * - Event handling (tick, error, state change)
 * - Circuit breaker pattern
 * - Health tracking
 * - Graceful reconnection with exponential backoff
 *
 * DESIGN PATTERN: Template Method
 * Subclasses implement the abstract methods (doConnect, doDisconnect, etc.)
 * while this class handles the common lifecycle and error handling.
 *
 * CIRCUIT BREAKER PATTERN:
 * When a data source fails repeatedly, we need to stop hammering it.
 * The circuit breaker tracks failures and "opens" after a threshold,
 * refusing all requests for a cooldown period. This:
 * - Gives the upstream service time to recover
 * - Prevents wasting resources on a dead connection
 * - Allows automatic recovery after cooldown
 */

import { EventEmitter } from 'events';
import { env } from '../../config/env.js';
import type { AssetKind } from '../../config/symbols.js';
import type {
  ICollector,
  CollectorState,
  CollectorHealth,
  CollectorError,
  CollectorConfig,
  NormalizedTick,
  TickHandler,
  ErrorHandler,
  StateChangeHandler,
} from './collector.types.js';
import { logger } from '../../utils/logger.js';

/**
 * Abstract base class for all market data collectors.
 * Extend this class to create collectors for different data sources.
 */
export abstract class BaseCollector implements ICollector {
  // ============================================================
  // PUBLIC PROPERTIES (implement ICollector)
  // ============================================================

  abstract readonly name: string;
  abstract readonly supportedKinds: AssetKind[];

  // ============================================================
  // PROTECTED STATE (accessible to subclasses)
  // ============================================================

  /** Current connection state */
  protected _state: CollectorState = 'disconnected';

  /** Symbols currently subscribed to */
  protected subscribedSymbols: Set<string> = new Set();

  /** Logger instance scoped to this collector */
  protected log: typeof logger;

  // ============================================================
  // PRIVATE STATE (internal bookkeeping)
  // ============================================================

  /** Event emitter for tick/error/state events */
  private emitter = new EventEmitter();

  /** Circuit breaker: failure count */
  private failureCount = 0;

  /** Circuit breaker: when circuit opened (null = closed) */
  private circuitOpenedAt: number | null = null;

  /** Reconnection attempt counter */
  private reconnectAttempts = 0;

  /** Timer for reconnection backoff */
  private reconnectTimer: NodeJS.Timeout | null = null;

  /** Health metrics: ticks in current minute */
  private tickCount = 0;

  /** Health metrics: last tick timestamp */
  private lastTickAt?: number;

  /** Health metrics: last error message */
  private lastErrorMessage?: string;

  /** Timer for tick count reset */
  private tickCountResetTimer?: NodeJS.Timeout;

  /** Configuration */
  protected config: Required<CollectorConfig>;

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(config: CollectorConfig = {}) {
    // Merge provided config with defaults
    this.config = {
      debug: config.debug ?? false,
      reconnectDelayMs: config.reconnectDelayMs ?? 1000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? Infinity,
    };

    // Create scoped logger (will be properly initialized when name is available)
    this.log = logger;

    // Start tick count reset timer (resets every minute for TPM metric)
    this.tickCountResetTimer = setInterval(() => {
      this.tickCount = 0;
    }, 60000);
  }

  // ============================================================
  // ICollector INTERFACE IMPLEMENTATION
  // ============================================================

  get state(): CollectorState {
    return this._state;
  }

  /**
   * Start the collector.
   * Handles circuit breaker check and state transitions.
   */
  async start(): Promise<void> {
    // Update logger with actual name
    this.log = logger.child({ collector: this.name });

    // Don't start if already running
    if (this._state === 'connected' || this._state === 'connecting') {
      this.log.debug('Already connected or connecting, ignoring start()');
      return;
    }

    // Check circuit breaker
    if (this.isCircuitOpen()) {
      this.log.warn('Circuit breaker open, cannot start');
      return;
    }

    this.setState('connecting');

    try {
      await this.doConnect();
      this.setState('connected');
      this.resetCircuitBreaker();
      this.reconnectAttempts = 0;
      this.log.info('Connected successfully');
    } catch (error) {
      this.handleConnectionFailure(error as Error);
    }
  }

  /**
   * Stop the collector.
   * Cleans up all resources.
   */
  async stop(): Promise<void> {
    this.log.info('Stopping collector');

    // Clear any pending reconnection
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Clear tick count timer
    if (this.tickCountResetTimer) {
      clearInterval(this.tickCountResetTimer);
      this.tickCountResetTimer = undefined;
    }

    try {
      await this.doDisconnect();
    } catch (error) {
      this.log.error({ error }, 'Error during disconnect');
    }

    this.setState('stopped');
    this.subscribedSymbols.clear();
  }

  /**
   * Subscribe to symbols.
   * Validates symbols and delegates to subclass.
   */
  async subscribe(symbols: string[]): Promise<void> {
    if (this._state !== 'connected') {
      throw new Error(`Cannot subscribe: collector is ${this._state}`);
    }

    // Filter to only new symbols
    const newSymbols = symbols.filter(s => !this.subscribedSymbols.has(s));
    if (newSymbols.length === 0) {
      this.log.debug('All symbols already subscribed');
      return;
    }

    this.log.info({ symbols: newSymbols }, 'Subscribing to symbols');

    await this.doSubscribe(newSymbols);
    newSymbols.forEach(s => this.subscribedSymbols.add(s));
  }

  /**
   * Unsubscribe from symbols.
   */
  async unsubscribe(symbols: string[]): Promise<void> {
    const toRemove = symbols.filter(s => this.subscribedSymbols.has(s));
    if (toRemove.length === 0) return;

    this.log.info({ symbols: toRemove }, 'Unsubscribing from symbols');

    await this.doUnsubscribe(toRemove);
    toRemove.forEach(s => this.subscribedSymbols.delete(s));
  }

  /**
   * Register tick handler.
   */
  onTick(handler: TickHandler): void {
    this.emitter.on('tick', handler);
  }

  /**
   * Register error handler.
   */
  onError(handler: ErrorHandler): void {
    this.emitter.on('error', handler);
  }

  /**
   * Register state change handler.
   */
  onStateChange(handler: StateChangeHandler): void {
    this.emitter.on('stateChange', handler);
  }

  /**
   * Get current health status.
   */
  getHealth(): CollectorHealth {
    return {
      name: this.name,
      state: this._state,
      subscribedSymbols: this.subscribedSymbols.size,
      ticksPerMinute: this.tickCount,
      lastTickAt: this.lastTickAt,
      lastError: this.lastErrorMessage,
      circuitBreakerOpen: this.isCircuitOpen(),
    };
  }

  // ============================================================
  // ABSTRACT METHODS (subclasses must implement)
  // ============================================================

  /**
   * Establish connection to the data source.
   * Called by start() after state/circuit checks pass.
   */
  protected abstract doConnect(): Promise<void>;

  /**
   * Disconnect from the data source.
   * Called by stop().
   */
  protected abstract doDisconnect(): Promise<void>;

  /**
   * Subscribe to specific symbols at the source.
   * The base class tracks subscriptions, this just does the actual subscription.
   */
  protected abstract doSubscribe(symbols: string[]): Promise<void>;

  /**
   * Unsubscribe from specific symbols at the source.
   */
  protected abstract doUnsubscribe(symbols: string[]): Promise<void>;

  // ============================================================
  // PROTECTED METHODS (for subclasses to use)
  // ============================================================

  /**
   * Emit a normalized tick.
   * Subclasses call this when they receive data from their source.
   */
  protected emitTick(tick: NormalizedTick): void {
    this.tickCount++;
    this.lastTickAt = Date.now();
    this.emitter.emit('tick', tick);
  }

  /**
   * Emit an error.
   * Subclasses call this when something goes wrong.
   */
  protected emitError(error: CollectorError): void {
    this.lastErrorMessage = error.message;
    this.emitter.emit('error', error);

    // Count failure for circuit breaker (only for retryable errors)
    if (error.retryable) {
      this.recordFailure();
    }
  }

  /**
   * Handle connection loss.
   * Subclasses call this when their connection drops.
   */
  protected handleConnectionLost(error?: Error): void {
    this.log.warn({ error }, 'Connection lost');
    this.setState('reconnecting');
    this.scheduleReconnect();
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  /**
   * Set state and emit change event.
   */
  private setState(newState: CollectorState): void {
    const oldState = this._state;
    if (oldState === newState) return;

    this._state = newState;
    this.log.debug({ from: oldState, to: newState }, 'State changed');
    this.emitter.emit('stateChange', newState, oldState);
  }

  /**
   * Handle initial connection failure.
   */
  private handleConnectionFailure(error: Error): void {
    this.log.error({ error }, 'Connection failed');
    this.recordFailure();

    this.emitError({
      type: 'connection_failed',
      message: error.message,
      source: this.name,
      timestamp: Date.now(),
      retryable: true,
      originalError: error,
    });

    this.setState('reconnecting');
    this.scheduleReconnect();
  }

  /**
   * Schedule a reconnection attempt with exponential backoff.
   *
   * EXPONENTIAL BACKOFF:
   * Each failed attempt doubles the wait time (up to a cap).
   * This prevents hammering a failing service while still
   * allowing quick recovery when the issue is transient.
   *
   * Example: 1s -> 2s -> 4s -> 8s -> 16s -> 30s (cap)
   */
  private scheduleReconnect(): void {
    // Check if we've exceeded max attempts
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log.error('Max reconnection attempts exceeded');
      this.setState('error');
      return;
    }

    // Check circuit breaker
    if (this.isCircuitOpen()) {
      const remainingMs = this.circuitOpenedAt! + env.CIRCUIT_BREAKER_TIMEOUT_MS - Date.now();
      this.log.warn({ remainingMs }, 'Circuit open, waiting for cooldown');
      this.reconnectTimer = setTimeout(() => this.attemptReconnect(), remainingMs);
      return;
    }

    // Calculate backoff delay
    const baseDelay = this.config.reconnectDelayMs;
    const backoffDelay = Math.min(
      baseDelay * Math.pow(2, this.reconnectAttempts),
      30000 // Cap at 30 seconds
    );

    this.log.info({ delayMs: backoffDelay, attempt: this.reconnectAttempts + 1 }, 'Scheduling reconnect');

    this.reconnectTimer = setTimeout(() => this.attemptReconnect(), backoffDelay);
  }

  /**
   * Attempt to reconnect.
   */
  private async attemptReconnect(): Promise<void> {
    this.reconnectAttempts++;
    this.log.info({ attempt: this.reconnectAttempts }, 'Attempting reconnection');

    try {
      await this.doConnect();

      // Success! Reset state
      this.setState('connected');
      this.resetCircuitBreaker();
      this.reconnectAttempts = 0;

      // Resubscribe to previous symbols
      if (this.subscribedSymbols.size > 0) {
        const symbols = Array.from(this.subscribedSymbols);
        this.subscribedSymbols.clear(); // Clear so subscribe() doesn't skip them
        await this.subscribe(symbols);
      }

      this.log.info('Reconnection successful');
    } catch (error) {
      this.log.error({ error }, 'Reconnection attempt failed');
      this.recordFailure();
      this.scheduleReconnect();
    }
  }

  // ============================================================
  // CIRCUIT BREAKER METHODS
  // ============================================================

  /**
   * Record a failure for circuit breaker calculation.
   */
  private recordFailure(): void {
    this.failureCount++;

    if (this.failureCount >= env.CIRCUIT_BREAKER_THRESHOLD) {
      this.openCircuit();
    }
  }

  /**
   * Open the circuit breaker.
   */
  private openCircuit(): void {
    if (this.circuitOpenedAt !== null) return; // Already open

    this.circuitOpenedAt = Date.now();
    this.setState('error');
    this.log.warn({ failureCount: this.failureCount }, 'Circuit breaker OPENED');
  }

  /**
   * Check if circuit is open.
   */
  private isCircuitOpen(): boolean {
    if (this.circuitOpenedAt === null) return false;

    // Check if cooldown period has passed
    const elapsed = Date.now() - this.circuitOpenedAt;
    if (elapsed >= env.CIRCUIT_BREAKER_TIMEOUT_MS) {
      // Cooldown complete, close circuit (half-open state)
      this.log.info('Circuit breaker cooldown complete, allowing retry');
      this.circuitOpenedAt = null;
      this.failureCount = 0;
      return false;
    }

    return true;
  }

  /**
   * Reset circuit breaker after successful operation.
   */
  private resetCircuitBreaker(): void {
    this.failureCount = 0;
    this.circuitOpenedAt = null;
  }
}
