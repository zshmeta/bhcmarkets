import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          bindings: {
            API_KEY: 'test-api-key',
            SENDER_EMAIL: 'test@example.com',
            SENDER_NAME: 'Test Platform',
            PLATFORM_NAME: 'Test Platform',
            PLATFORM_URL: 'https://test.example.com',
            SUPPORT_EMAIL: 'support@example.com',
            EMAIL_PROVIDER: 'resend',
            RESEND_API_KEY: 'test-resend-key',
          },
        },
      },
    },
  },
});
