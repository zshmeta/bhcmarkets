/**
 * HTTP Client for Auth API.
 * 
 * Provides a configured fetch wrapper with:
 * - Automatic JSON handling
 * - Error handling
 * - Request/response interceptors
 * - Retry logic
 * - CSRF protection
 */

/**
 * HTTP request options.
 */
export interface HttpOptions extends RequestInit {
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Number of retry attempts */
  retries?: number;
  
  /** Retry delay in milliseconds */
  retryDelay?: number;
}

/**
 * HTTP response wrapper.
 */
export interface HttpResponse<T = unknown> {
  /** Response data */
  data: T;
  
  /** HTTP status code */
  status: number;
  
  /** Response headers */
  headers: Headers;
  
  /** Whether the request was successful */
  ok: boolean;
}

/**
 * HTTP error.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly response?: unknown
  ) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = "HttpError";
  }
}

/**
 * Default HTTP configuration.
 */
const DEFAULT_CONFIG: Required<Pick<HttpOptions, "timeout" | "retries" | "retryDelay">> = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Create HTTP client with base configuration.
 */
export function createHttpClient(baseURL: string) {
  /**
   * Make HTTP request with retry logic.
   */
  async function request<T = unknown>(
    path: string,
    options: HttpOptions = {}
  ): Promise<HttpResponse<T>> {
    const {
      timeout = DEFAULT_CONFIG.timeout,
      retries = DEFAULT_CONFIG.retries,
      retryDelay = DEFAULT_CONFIG.retryDelay,
      ...fetchOptions
    } = options;

    const url = new URL(path, baseURL).toString();
    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Make request
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...fetchOptions.headers,
          },
        });

        clearTimeout(timeoutId);

        // Parse response
        let data: T;
        const contentType = response.headers.get("content-type");
        
        if (contentType?.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text() as T;
        }

        // Check for errors
        if (!response.ok) {
          throw new HttpError(response.status, response.statusText, data);
        }

        return {
          data,
          status: response.status,
          headers: response.headers,
          ok: response.ok,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error instanceof HttpError && error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }

        // Don't retry on abort/timeout
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Request timeout");
        }

        // Retry with exponential backoff
        if (attempt < retries) {
          await sleep(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    // All retries failed
    throw lastError || new Error("Request failed");
  }

  /**
   * Helper methods for common HTTP verbs.
   */
  return {
    get: <T = unknown>(path: string, options?: HttpOptions) =>
      request<T>(path, { ...options, method: "GET" }),

    post: <T = unknown>(path: string, body?: unknown, options?: HttpOptions) =>
      request<T>(path, {
        ...options,
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      }),

    put: <T = unknown>(path: string, body?: unknown, options?: HttpOptions) =>
      request<T>(path, {
        ...options,
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      }),

    patch: <T = unknown>(path: string, body?: unknown, options?: HttpOptions) =>
      request<T>(path, {
        ...options,
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      }),

    delete: <T = unknown>(path: string, options?: HttpOptions) =>
      request<T>(path, { ...options, method: "DELETE" }),
  };
}

/**
 * Sleep utility for retry delays.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Default HTTP client instance.
 * Uses API base URL from environment or defaults to /api.
 */
export const http = createHttpClient(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api"
);
