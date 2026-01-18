/**
 * Retry Utility
 * =============
 *
 * Provides retry functionality with exponential backoff,
 * jitter, and customizable retry conditions.
 *
 * USAGE:
 * ```typescript
 * // Simple retry
 * const result = await retry(() => fetchData(), { maxAttempts: 3 });
 *
 * // With custom options
 * const result = await retry(
 *   () => fetchData(),
 *   {
 *     maxAttempts: 5,
 *     initialDelay: 1000,
 *     isRetryable: (error) => error.code !== 'FATAL',
 *     onRetry: (error, attempt) => console.log(`Attempt ${attempt} failed`),
 *   }
 * );
 *
 * // Wrap a function
 * const retryableFetch = withRetry(fetchData, { maxAttempts: 3 });
 * const result = await retryableFetch();
 * ```
 */

/**
 * Configuration options for retry behavior.
 */
export interface RetryOptions {
    /** Maximum number of attempts (default: 3) */
    maxAttempts?: number;

    /** Initial delay in milliseconds (default: 1000) */
    initialDelay?: number;

    /** Maximum delay in milliseconds (default: 30000) */
    maxDelay?: number;

    /** Multiplier for exponential backoff (default: 2) */
    backoffMultiplier?: number;

    /** Add randomness to prevent thundering herd (default: true) */
    jitter?: boolean;

    /** Jitter factor - max random addition as percentage of delay (default: 0.25) */
    jitterFactor?: number;

    /** Determine if error is retryable (default: always true) */
    isRetryable?: (error: unknown, attempt: number) => boolean;

    /** Called before each retry */
    onRetry?: (error: unknown, attempt: number, delay: number) => void;

    /** Abort signal for cancellation */
    signal?: AbortSignal;
}

/**
 * Default retry options.
 */
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'signal'>> = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    jitterFactor: 0.25,
    isRetryable: () => true,
    onRetry: () => { },
};

/**
 * Error thrown when all retry attempts are exhausted.
 */
export class RetryExhaustedError extends Error {
    readonly name = 'RetryExhaustedError';
    readonly attempts: number;
    readonly lastError: unknown;

    constructor(attempts: number, lastError: unknown) {
        const message = lastError instanceof Error ? lastError.message : String(lastError);
        super(`All ${attempts} retry attempts exhausted. Last error: ${message}`);
        this.attempts = attempts;
        this.lastError = lastError;
    }
}

/**
 * Simple sleep function.
 *
 * @param ms - Milliseconds to sleep
 * @param signal - Optional abort signal
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new Error('Aborted'));
            return;
        }

        const timeout = setTimeout(resolve, ms);

        signal?.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('Aborted'));
        });
    });
}

/**
 * Calculate delay with optional jitter.
 */
function calculateDelay(
    attempt: number,
    options: Required<Omit<RetryOptions, 'signal'>>
): number {
    // Exponential backoff
    let delay = Math.min(
        options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1),
        options.maxDelay
    );

    // Add jitter to prevent thundering herd
    if (options.jitter) {
        const jitterAmount = delay * options.jitterFactor;
        delay = delay + Math.random() * jitterAmount;
    }

    return Math.floor(delay);
}

/**
 * Retry an async function with exponential backoff.
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Result of the function
 * @throws RetryExhaustedError if all attempts fail
 * @throws Original error if not retryable
 */
export async function retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: unknown;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        // Check for abort
        if (options.signal?.aborted) {
            throw new Error('Retry aborted');
        }

        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if we should retry
            const isLastAttempt = attempt === opts.maxAttempts;
            const canRetry = opts.isRetryable(error, attempt);

            if (isLastAttempt || !canRetry) {
                throw error;
            }

            // Calculate delay and wait
            const delay = calculateDelay(attempt, opts);
            opts.onRetry(error, attempt, delay);

            await sleep(delay, options.signal);
        }
    }

    // Should never reach here, but TypeScript needs this
    throw new RetryExhaustedError(opts.maxAttempts, lastError);
}

/**
 * Create a retry-wrapped version of an async function.
 *
 * @param fn - Function to wrap
 * @param options - Retry configuration
 * @returns Wrapped function with retry behavior
 *
 * @example
 * ```typescript
 * const fetchWithRetry = withRetry(fetchData, { maxAttempts: 3 });
 * const data = await fetchWithRetry(url);
 * ```
 */
export function withRetry<A extends unknown[], R>(
    fn: (...args: A) => Promise<R>,
    options: RetryOptions = {}
): (...args: A) => Promise<R> {
    return (...args: A) => retry(() => fn(...args), options);
}

/**
 * Retry with specific error types.
 *
 * @param fn - Function to retry
 * @param errorTypes - Error constructors that are retryable
 * @param options - Additional retry options
 */
export function retryOnErrors<T>(
    fn: () => Promise<T>,
    errorTypes: Array<new (...args: never[]) => Error>,
    options: Omit<RetryOptions, 'isRetryable'> = {}
): Promise<T> {
    return retry(fn, {
        ...options,
        isRetryable: (error) => {
            return errorTypes.some((ErrorType) => error instanceof ErrorType);
        },
    });
}
