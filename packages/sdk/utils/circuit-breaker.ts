/**
 * Reusable Circuit Breaker
 * ========================
 *
 * A standalone circuit breaker utility that can protect any async operation
 * from cascading failures.
 *
 * STATES:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is open, requests fail immediately (service is down)
 * - HALF_OPEN: Testing if service has recovered
 *
 * USAGE:
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 60000,
 * });
 *
 * try {
 *   const result = await breaker.execute(() => fetchData());
 * } catch (error) {
 *   if (error instanceof CircuitOpenError) {
 *     // Circuit is open, fail fast
 *   }
 * }
 * ```
 */

/**
 * Circuit breaker states.
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Configuration options for the circuit breaker.
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit (default: 5) */
  failureThreshold?: number;

  /** Time to wait before testing recovery in ms (default: 60000) */
  resetTimeout?: number;

  /** Number of successes needed to close from half-open (default: 2) */
  successThreshold?: number;

  /** Custom failure detector - return true if error should count as failure */
  isFailure?: (error: unknown) => boolean;

  /** Called when state changes */
  onStateChange?: (from: CircuitState, to: CircuitState) => void;

  /** Name for logging purposes */
  name?: string;
}

/**
 * Default options for circuit breaker.
 */
const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeout: 60000,
  successThreshold: 2,
  isFailure: () => true,
  onStateChange: () => {},
  name: 'circuit-breaker',
};

/**
 * Error thrown when circuit breaker is open.
 */
export class CircuitOpenError extends Error {
  readonly name = 'CircuitOpenError';
  readonly circuitName: string;

  constructor(circuitName: string) {
    super(`Circuit breaker '${circuitName}' is open`);
    this.circuitName = circuitName;
  }
}

/**
 * Circuit breaker implementation.
 *
 * Protects operations from cascading failures by failing fast
 * when a service is unhealthy.
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Execute a function through the circuit breaker.
   *
   * @param fn - Async function to execute
   * @returns Result of the function
   * @throws CircuitOpenError if circuit is open
   * @throws Original error if function fails
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we should allow the request
    if (!this.canExecute()) {
      throw new CircuitOpenError(this.options.name);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      if (this.options.isFailure(error)) {
        this.onFailure();
      }
      throw error;
    }
  }

  /**
   * Check if a request can be executed.
   */
  private canExecute(): boolean {
    if (this.state === 'closed') {
      return true;
    }

    if (this.state === 'open') {
      // Check if reset timeout has passed
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
        this.transitionTo('half-open');
        return true;
      }
      return false;
    }

    // half-open: allow limited requests to test recovery
    return true;
  }

  /**
   * Handle successful execution.
   */
  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.transitionTo('closed');
      }
    } else if (this.state === 'closed') {
      // Reset failure count on success
      this.failures = 0;
    }
  }

  /**
   * Handle failed execution.
   */
  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.failures++;

    if (this.state === 'half-open') {
      // Any failure in half-open state opens the circuit
      this.transitionTo('open');
    } else if (this.failures >= this.options.failureThreshold) {
      this.transitionTo('open');
    }
  }

  /**
   * Transition to a new state.
   */
  private transitionTo(newState: CircuitState): void {
    if (this.state === newState) return;

    const oldState = this.state;
    this.state = newState;
    this.failures = 0;
    this.successes = 0;

    this.options.onStateChange(oldState, newState);
  }

  // ============================================================
  // PUBLIC ACCESSORS
  // ============================================================

  /**
   * Get current circuit state.
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit is open.
   */
  isOpen(): boolean {
    return this.state === 'open';
  }

  /**
   * Check if circuit is closed (healthy).
   */
  isClosed(): boolean {
    return this.state === 'closed';
  }

  /**
   * Check if circuit is half-open (testing recovery).
   */
  isHalfOpen(): boolean {
    return this.state === 'half-open';
  }

  /**
   * Manually reset the circuit to closed state.
   */
  reset(): void {
    this.transitionTo('closed');
    this.lastFailureTime = 0;
  }

  /**
   * Manually open the circuit.
   */
  trip(): void {
    this.transitionTo('open');
    this.lastFailureTime = Date.now();
  }

  /**
   * Get circuit breaker statistics.
   */
  getStats(): {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime: number;
  } {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
    };
  }
}
