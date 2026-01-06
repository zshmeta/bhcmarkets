/**
 * Ledger Configuration
 * ====================
 *
 * Configuration constants for the ledger service.
 */

/**
 * Supported assets/currencies.
 * Add new assets here when enabling trading for them.
 */
export const SUPPORTED_ASSETS = [
    // Fiat currencies
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CHF',
    'AUD',
    'CAD',
    'NZD',

    // Cryptocurrencies
    'BTC',
    'ETH',
    'USDT',
    'USDC',
    'XRP',
    'SOL',
    'ADA',
    'DOGE',
    'DOT',
    'MATIC',
    'LTC',
    'BCH',
    'LINK',
    'AVAX',
    'XLM',

    // Commodities (for CFD trading)
    'XAU',  // Gold
    'XAG',  // Silver
    'XPT',  // Platinum
    'XPD',  // Palladium
    'BRENT',  // Brent Crude Oil
    'WTI',    // WTI Crude Oil
    'NATGAS', // Natural Gas
] as const;

export type SupportedAsset = typeof SUPPORTED_ASSETS[number];

/**
 * Ledger configuration constants.
 */
export const LEDGER_CONFIG = {
    /**
     * Decimal precision for different asset types.
     * This determines how many decimal places are stored/displayed.
     */
    PRECISION: {
        FIAT: 2,        // USD, EUR, etc.
        CRYPTO: 8,      // BTC, ETH, etc.
        STABLECOIN: 6,  // USDT, USDC
        COMMODITY: 2,   // XAU, XAG, etc.
    },

    /**
     * Get precision for a specific asset.
     */
    getPrecision(asset: string): number {
        const fiat = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];
        const stablecoin = ['USDT', 'USDC', 'DAI', 'BUSD'];
        const commodity = ['XAU', 'XAG', 'XPT', 'XPD', 'BRENT', 'WTI', 'NATGAS'];

        if (fiat.includes(asset)) return this.PRECISION.FIAT;
        if (stablecoin.includes(asset)) return this.PRECISION.STABLECOIN;
        if (commodity.includes(asset)) return this.PRECISION.COMMODITY;
        return this.PRECISION.CRYPTO;
    },

    /**
     * Maximum number of entries to return in a single query.
     */
    MAX_ENTRIES_PER_QUERY: 1000,

    /**
     * Default number of entries to return.
     */
    DEFAULT_ENTRIES_LIMIT: 100,

    /**
     * Hold expiration time in milliseconds (24 hours).
     * Holds older than this may be automatically released.
     */
    HOLD_EXPIRATION_MS: 24 * 60 * 60 * 1000,

    /**
     * Minimum balance threshold to consider as "zero".
     * Used to handle floating point precision issues.
     */
    ZERO_THRESHOLD: '0.00000001',
} as const;
