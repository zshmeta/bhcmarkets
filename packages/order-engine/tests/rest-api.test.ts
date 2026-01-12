import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// We mock DB connectivity so these tests are pure HTTP endpoint tests.
const isDatabaseConnected = vi.fn<() => Promise<boolean>>();

vi.mock('@repo/database', () => {
  return {
    isDatabaseConnected,
  };
});

describe('order-engine REST API', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    // Default to "DB down" so DB-gated endpoints return 503.
    isDatabaseConnected.mockResolvedValue(false);

    const mod = await import('../src/api/rest-api.js');
    server = new mod.RestApiServer();

    await server.start(0);
    const port = server.getListeningPort();
    expect(typeof port).toBe('number');
    expect(port).toBeGreaterThan(0);

    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
  });

  it('GET /health returns 200 with service metadata', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toMatchObject({
      status: 'healthy',
      service: 'order-engine',
    });
    expect(typeof json.timestamp).toBe('number');
  });

  it('GET /stats returns 503 when not initialized', async () => {
    const res = await fetch(`${baseUrl}/stats`);
    expect(res.status).toBe(503);

    const json = await res.json();
    expect(json).toEqual({ error: 'Service not initialized' });
  });

  it('POST /orders returns 503 when DB is not connected', async () => {
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // body content doesn't matter; DB gate happens first
        symbol: 'BTC/USD',
        side: 'buy',
        type: 'limit',
        price: 50000,
        quantity: 0.1,
        accountId: 'acc_test',
      }),
    });

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json).toEqual({ error: 'Database not connected' });
  });

  it('DELETE /orders/:id returns 503 when DB is not connected', async () => {
    const res = await fetch(`${baseUrl}/orders/ord_test`, {
      method: 'DELETE',
      headers: {
        'X-Account-ID': 'acc_test',
      },
    });

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json).toEqual({ error: 'Database not connected' });
  });

  it('unknown route returns 404', async () => {
    const res = await fetch(`${baseUrl}/does-not-exist`);
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json).toEqual({ error: 'Not found' });
  });
});
