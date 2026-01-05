import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run tests from the tests directory
    include: ['tests/**/*.test.ts'],

    // Exclude integration tests from default run
    // Run them explicitly with: npm run test:integration
    exclude: [
      'tests/**/*.integration.test.ts',  // Integration tests
      'tests/routes.test.ts',             // Requires running HTTP server
    ],

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
