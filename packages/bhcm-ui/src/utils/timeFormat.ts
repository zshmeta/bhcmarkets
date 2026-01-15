/* ═══════════════════════════════════════════════════════════
 * TIME FORMATTING UTILITIES
 * ═══════════════════════════════════════════════════════════
 * Centralized time/date formatters for consistent display.
 */

/**
 * Format a timestamp to HH:mm:ss (24-hour format).
 * @param timestamp - Unix timestamp in milliseconds
 * @param includeSeconds - Whether to include seconds (default: true)
 */
export const formatTime = (timestamp: number, includeSeconds: boolean = true): string => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        ...(includeSeconds && { second: '2-digit' }),
    };
    return date.toLocaleTimeString('en-US', options);
};

/**
 * Format a timestamp to a short date (e.g., "Jan 14").
 * @param timestamp - Unix timestamp in milliseconds
 */
export const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Format a timestamp to a full datetime string for display.
 * @param timestamp - Unix timestamp in milliseconds
 */
export const formatDateTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
};

/**
 * Format time for charts (MM/DD HH:mm).
 * @param timestamp - Unix timestamp in seconds (common in chart libraries)
 */
export const formatChartTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Format time from current moment as "last update" display.
 * @param timestamp - Unix timestamp in milliseconds
 */
export const formatLastUpdateTime = (timestamp: number): string => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
};
