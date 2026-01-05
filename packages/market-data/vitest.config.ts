import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run tests from the tests directory
    include: ['tests/**/*.test.ts'],

    // Exclude integration tests by default (require running service)
    exclude: ['tests/api/**/*.test.ts', 'tests/collectors/binance.collector.test.ts'],

    // Environment
    environment: 'node',

    // Globals (describe, it, expect without imports)
    globals: true,

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/types/**'],
    },

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
