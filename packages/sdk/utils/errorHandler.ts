// Error handling utilities

/**
 * Handle API errors gracefully
 */
export function handleApiError(error: unknown, context?: string): void {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API Error${context ? ` - ${context}` : ''}]:`, message);
}

/**
 * Log errors with context
 */
export function logError(error: unknown, context?: string): void {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    console.error(`[Error${context ? ` - ${context}` : ''}]:`, message);
    if (stack) {
        console.debug('Stack:', stack);
    }
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T>(
    fn: () => Promise<T>,
    context?: string
): Promise<T | null> {
    return fn().catch((error) => {
        handleApiError(error, context);
        return null;
    });
}
