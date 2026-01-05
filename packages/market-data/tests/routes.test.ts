/**
 * API Routes Tests
 * ================
 *
 * Integration tests for the REST API endpoints.
 * Requires the full service to be running.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';

const BASE_URL = 'http://localhost:4001';

/**
 * Helper to make HTTP requests.
 */
async function request(path: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode || 500,
            body: JSON.parse(data),
          });
        } catch {
          resolve({
            status: res.statusCode || 500,
            body: data,
          });
        }
      });
    }).on('error', reject);
  });
}

describe('API Routes', () => {
  describe('Health Endpoints', () => {
    it('GET /health should return service health', async () => {
      const { status, body } = await request('/health');

      expect(status).toBe(200);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('uptime');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);
    });

    it('GET /health/live should return liveness status', async () => {
      const { status, body } = await request('/health/live');

      expect(status).toBe(200);
      expect(body).toHaveProperty('status', 'ok');
    });

    it('GET /health/ready should return readiness status', async () => {
      const { status, body } = await request('/health/ready');

      // May be 200 or 503 depending on service state
      expect([200, 503]).toContain(status);
      expect(body).toHaveProperty('ready');
    });
  });

  describe('Price Endpoints', () => {
    it('GET /api/prices should return price snapshot', async () => {
      const { status, body } = await request('/api/prices');

      expect(status).toBe(200);
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('prices');
      expect(typeof body.prices).toBe('object');
    });

    it('GET /api/prices/:symbol should return single price', async () => {
      // URL encode the symbol (BTC/USD -> BTC%2FUSD)
      const { status, body } = await request('/api/prices/BTC%2FUSD');

      // May be 200 or 404 depending on whether data is available
      if (status === 200) {
        expect(body).toHaveProperty('symbol', 'BTC/USD');
        expect(body).toHaveProperty('last');
        expect(body).toHaveProperty('bid');
        expect(body).toHaveProperty('ask');
      } else {
        expect(status).toBe(404);
      }
    });
  });

  describe('Candle Endpoints', () => {
    it('GET /api/candles/:symbol should return candles', async () => {
      const { status, body } = await request('/api/candles/BTC%2FUSD?timeframe=1m&limit=10');

      expect(status).toBe(200);
      expect(body).toHaveProperty('symbol', 'BTC/USD');
      expect(body).toHaveProperty('timeframe', '1m');
      expect(body).toHaveProperty('candles');
      expect(Array.isArray(body.candles)).toBe(true);
    });
  });

  describe('Symbol Endpoints', () => {
    it('GET /api/symbols should return all symbols', async () => {
      const { status, body } = await request('/api/symbols');

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      // Check symbol structure
      const symbol = body[0];
      expect(symbol).toHaveProperty('symbol');
      expect(symbol).toHaveProperty('name');
      expect(symbol).toHaveProperty('kind');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const { status, body } = await request('/unknown/route');

      expect(status).toBe(404);
      expect(body).toHaveProperty('error');
    });
  });
});
