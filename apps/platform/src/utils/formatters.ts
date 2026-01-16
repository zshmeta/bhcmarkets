import Decimal from 'decimal.js';

/* ═══════════════════════════════════════════════════════════
 * NUMBER FORMATTING UTILITIES
 * ═══════════════════════════════════════════════════════════
 * Centralized formatters using decimal.js for financial precision.
 * All functions accept string | number | Decimal for flexibility.
 */

type NumericInput = string | number | Decimal;

/**
 * Format a number with locale-aware thousands separators and fixed decimals.
 * Default: 2 decimal places with US locale format.
 */
export const formatNumber = (value: NumericInput, decimals: number = 2): string => {
    const d = new Decimal(value);
    if (d.isNaN()) return '0.00';
    const fixed = d.toFixed(decimals);
    const num = parseFloat(fixed);
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

/**
 * Format a price with dynamic decimals based on magnitude.
 * - >= 1000: 2 decimals with locale separators
 * - >= 1: 4 decimals
 * - < 1: 8 decimals (for crypto sub-penny prices)
 */
export const formatPrice = (price: NumericInput): string => {
    const d = new Decimal(price);
    if (d.isNaN() || d.isZero()) return '—';
    if (d.gte(1000)) {
        return d.toNumber().toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
    if (d.gte(1)) return d.toFixed(4);
    return d.toFixed(8);
};

/**
 * Format volume with K/M/B abbreviations.
 */
export const formatVolume = (volume: NumericInput): string => {
    const d = new Decimal(volume);
    if (d.isNaN()) return '0';
    if (d.gte(1e9)) return d.div(1e9).toFixed(1) + 'B';
    if (d.gte(1e6)) return d.div(1e6).toFixed(1) + 'M';
    if (d.gte(1e3)) return d.div(1e3).toFixed(1) + 'K';
    return d.toFixed(0);
};

/**
 * Format quantity with dynamic decimals based on magnitude.
 * - >= 1000: 2 decimals
 * - >= 1: 4 decimals
 * - < 1: 5 decimals
 */
export const formatQuantity = (qty: NumericInput): string => {
    const d = new Decimal(qty);
    if (d.isNaN()) return '0';
    if (d.gte(1000)) return d.toFixed(2);
    if (d.gte(1)) return d.toFixed(4);
    return d.toFixed(5);
};

/**
 * Format a percentage with optional sign prefix.
 * @param value - The percentage value (e.g., 5.25 for 5.25%)
 * @param decimals - Number of decimal places (default: 2)
 * @param showSign - Whether to prefix with +/- (default: true)
 */
export const formatPercent = (
    value: NumericInput,
    decimals: number = 2,
    showSign: boolean = true
): string => {
    const d = new Decimal(value);
    if (d.isNaN()) return '0.00%';
    const fixed = d.toFixed(decimals);
    const sign = showSign && d.gt(0) ? '+' : '';
    return `${sign}${fixed}%`;
};

/**
 * Format a currency value (e.g., for USDT, USD).
 * @param value - The numeric value
 * @param symbol - Currency symbol prefix (default: '$')
 * @param decimals - Number of decimal places (default: 2)
 */
export const formatCurrency = (
    value: NumericInput,
    symbol: string = '$',
    decimals: number = 2
): string => {
    const d = new Decimal(value);
    if (d.isNaN()) return `${symbol}0.00`;
    const num = parseFloat(d.toFixed(decimals));
    const formatted = num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    return `${symbol}${formatted}`;
};
