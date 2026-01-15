import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadEnv } from './env';

describe('loadEnv', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should load ORDER_ENGINE_URL from environment', () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgres://localhost:5432/db',
      JWT_SECRET: 'secret',
      ORDER_ENGINE_URL: 'http://custom-engine:4000',
    };

    const config = loadEnv();
    expect((config as any).orderEngineUrl).toBe('http://custom-engine:4000');
  });

  it('should use default ORDER_ENGINE_URL if not provided', () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgres://localhost:5432/db',
      JWT_SECRET: 'secret',
      // ORDER_ENGINE_URL missing
    };

    const config = loadEnv();
    expect((config as any).orderEngineUrl).toBe('http://localhost:4000');
  });
});
