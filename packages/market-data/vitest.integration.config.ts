import { defineConfig } from 'vitest/config';

/**
 * Vitest config for integration tests.
 * 
 * Run with: npm run test:integration
 * 
 * These tests make REAL network calls to external APIs (Binance, Yahoo).
 */
export default defineConfig({
    test: {
        // Only run integration tests
        include: ['tests/**/*.integration.test.ts'],
        exclude: [],

        // Environment
        environment: 'node',

        // Globals
        globals: true,

        // Longer timeouts for network calls
        testTimeout: 15000,
        hookTimeout: 15000,

        // Run tests sequentially to avoid rate limiting
        sequence: {
            shuffle: false,
        },
    },
});
