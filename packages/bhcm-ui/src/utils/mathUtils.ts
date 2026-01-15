/* ═══════════════════════════════════════════════════════════
 * MATH UTILITIES
 * ═══════════════════════════════════════════════════════════
 * Common math helper functions.
 */

/**
 * Clamp a value between min and max bounds.
 */
export const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

/**
 * Linear interpolation between two values.
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0-1)
 */
export const lerp = (a: number, b: number, t: number): number => {
    return a + (b - a) * t;
};

/**
 * Map a value from one range to another.
 */
export const mapRange = (
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
): number => {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};
