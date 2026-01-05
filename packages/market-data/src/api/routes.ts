/**
 * REST API Routes
 * ===============
 *
 * HTTP endpoints for the market data service.
 *
 * ENDPOINTS:
 *
 * Health & Monitoring:
 * - GET /health         - Full health status
 * - GET /health/live    - Liveness probe (for k8s)
 * - GET /health/ready   - Readiness probe (for k8s)
 *
 * Price Data:
 * - GET /api/prices                    - All current prices
 * - GET /api/prices/:symbol            - Single symbol price
 *
 * Historical Data (for TradingView):
 * - GET /api/candles/:symbol           - Historical candles
 *   Query params: timeframe, from, to, limit
 *
 * Symbols:
 * - GET /api/symbols                   - All available symbols
 *
 * NOTE: We're using Node.js native HTTP server to keep dependencies minimal.
 * For production with complex routing needs, consider Fastify or Express.
 */

import http from 'http';
import { URL } from 'url';
import { env } from '../config/env.js';
import { ALL_SYMBOLS } from '../config/symbols.js';
import { logger } from '../utils/logger.js';
import { PriceCache } from '../domains/cache/price.cache.js';
import { HistoricalService } from '../domains/historical/historical.service.js';
import { HealthService } from '../domains/health/health.service.js';
import type { Timeframe } from '../domains/normalizer/data.validators.js';

const log = logger.child({ component: 'api' });

/**
 * Dependencies for the API.
 */
interface ApiDependencies {
  priceCache: PriceCache;
  historicalService: HistoricalService;
  healthService: HealthService;
}

/**
 * Create and start the HTTP API server.
 */
export function createApiServer(deps: ApiDependencies): http.Server {
  const { priceCache, historicalService, healthService } = deps;

  const server = http.createServer(async (req, res) => {
    // Set CORS headers for browser access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Parse URL
    const baseUrl = `http://${req.headers.host}`;
    const url = new URL(req.url || '/', baseUrl);
    const pathname = url.pathname;

    try {
      // Route handling
      // =====================================
      // HEALTH ENDPOINTS
      // =====================================
      if (pathname === '/health' && req.method === 'GET') {
        const health = await healthService.getHealth();
        const statusCode = health.status === 'unhealthy' ? 503 : 200;
        res.writeHead(statusCode);
        res.end(JSON.stringify(health, null, 2));
        return;
      }

      if (pathname === '/health/live' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }

      if (pathname === '/health/ready' && req.method === 'GET') {
        const ready = await healthService.isReady();
        res.writeHead(ready ? 200 : 503);
        res.end(JSON.stringify({ ready }));
        return;
      }

      // =====================================
      // PRICE ENDPOINTS
      // =====================================
      if (pathname === '/api/prices' && req.method === 'GET') {
        const snapshot = await priceCache.getSnapshot();
        res.writeHead(200);
        res.end(JSON.stringify(snapshot));
        return;
      }

      // Single symbol price: /api/prices/BTC%2FUSD (URL encoded)
      const priceMatch = pathname.match(/^\/api\/prices\/(.+)$/);
      if (priceMatch && priceMatch[1] && req.method === 'GET') {
        const symbol = decodeURIComponent(priceMatch[1]);
        const price = await priceCache.get(symbol);

        if (price) {
          res.writeHead(200);
          res.end(JSON.stringify(price));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Symbol not found or no recent data' }));
        }
        return;
      }

      // =====================================
      // CANDLE ENDPOINTS (for TradingView)
      // =====================================
      const candleMatch = pathname.match(/^\/api\/candles\/(.+)$/);
      if (candleMatch && candleMatch[1] && req.method === 'GET') {
        const symbol = decodeURIComponent(candleMatch[1]);

        // Parse query parameters
        const timeframe = (url.searchParams.get('timeframe') || '1m') as Timeframe;
        const limit = parseInt(url.searchParams.get('limit') || '100', 10);

        // Time range defaults to last N candles
        const to = parseInt(url.searchParams.get('to') || '', 10) || Date.now();
        const from = parseInt(url.searchParams.get('from') || '', 10) ||
          (to - limit * getTimeframeMs(timeframe));

        const candles = await historicalService.getCandles({
          symbol,
          timeframe,
          from,
          to,
          limit,
        });

        // Also include current in-progress candle
        const currentCandle = historicalService.getCurrentCandle(symbol);
        if (currentCandle) {
          candles.push(currentCandle);
        }

        res.writeHead(200);
        res.end(JSON.stringify({
          symbol,
          timeframe,
          count: candles.length,
          candles,
        }));
        return;
      }

      // =====================================
      // SYMBOL ENDPOINTS
      // =====================================
      if (pathname === '/api/symbols' && req.method === 'GET') {
        const symbols = ALL_SYMBOLS.map((s: typeof ALL_SYMBOLS[number]) => ({
          symbol: s.symbol,
          name: s.name,
          kind: s.kind,
          base: s.base,
          quote: s.quote,
          tickSize: s.tickSize,
        }));

        res.writeHead(200);
        res.end(JSON.stringify({ count: symbols.length, symbols }));
        return;
      }

      // =====================================
      // 404 NOT FOUND
      // =====================================
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));

    } catch (error) {
      log.error({ error, pathname }, 'API error');
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });

  return server;
}

/**
 * Get timeframe duration in milliseconds.
 */
function getTimeframeMs(timeframe: Timeframe): number {
  const map: Record<Timeframe, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
  };
  return map[timeframe] ?? map['1m'];
}
