
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerTradingRoutes, TradingRouteDependencies } from './trading.routes.js';
import { Router, HttpMethod, HttpRequest, HttpResponse } from '../../../api/types.js';
import { TokenManager } from '../../auth/tokens/tokens.js';
import { DrizzleClient } from '@repo/database';
import { TradingService } from '../core/trading.service.js';

// Mock types
type MockRouter = Router & {
  handlers: Map<string, (req: HttpRequest) => Promise<HttpResponse>>;
};

describe('Trading Routes', () => {
  let router: MockRouter;
  let db: DrizzleClient;
  let tokenManager: TokenManager;
  let tradingService: TradingService;

  beforeEach(() => {
    // Setup mock router
    router = {
      handlers: new Map(),
      route: (method: HttpMethod, path: string, handler: (req: HttpRequest) => Promise<HttpResponse>) => {
        router.handlers.set(`${method} ${path}`, handler);
      },
    };

    // Mock dependencies
    db = {
      execute: vi.fn(),
    } as unknown as DrizzleClient;

    tokenManager = {
      verify: vi.fn(),
      decode: vi.fn(),
      parseAccessToken: vi.fn(),
    } as unknown as TokenManager;

    tradingService = {
      placeOrder: vi.fn(),
    } as unknown as TradingService;
  });

  it('should register POST /orders route', () => {
    const deps = { db, tokenManager, tradingService } as unknown as TradingRouteDependencies;
    // @ts-ignore - we are passing extra dependency that is not yet in the interface
    registerTradingRoutes(router, deps, { info: vi.fn(), error: vi.fn() });

    expect(router.handlers.has('POST /orders')).toBe(true);
  });

  it('should place an order successfully', async () => {
    const deps = { db, tokenManager, tradingService } as unknown as TradingRouteDependencies;
    // @ts-ignore
    registerTradingRoutes(router, deps, { info: vi.fn(), error: vi.fn() });

    const handler = router.handlers.get('POST /orders');
    expect(handler).toBeDefined();

    // Mock auth
    (tokenManager.parseAccessToken as any).mockResolvedValue({ sub: 'user-123' });

    // Mock db account check
    (db.execute as any).mockResolvedValue({
      rows: [{ user_id: 'user-123' }]
    });

    // Mock service response
    const mockOrderResponse = {
      success: true,
      orderId: 'order-123',
    };
    (tradingService.placeOrder as any).mockResolvedValue(mockOrderResponse);

    const request: HttpRequest = {
      body: {
        accountId: 'acc-123',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: 1.5,
      },
      headers: {
        authorization: 'Bearer valid-token',
      },
      query: {},
      params: {},
    };

    const response = await handler!(request);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockOrderResponse);
    expect(tradingService.placeOrder).toHaveBeenCalledWith('user-123', {
      accountId: 'acc-123',
      symbol: 'BTC-USD',
      side: 'buy',
      type: 'market',
      quantity: 1.5,
    });
  });

  it('should return 400 on error', async () => {
    const deps = { db, tokenManager, tradingService } as unknown as TradingRouteDependencies;
    // @ts-ignore
    registerTradingRoutes(router, deps, { info: vi.fn(), error: vi.fn() });

    const handler = router.handlers.get('POST /orders');

    // Mock auth
    (tokenManager.parseAccessToken as any).mockResolvedValue({ sub: 'user-123' });

    // Mock db account check
    (db.execute as any).mockResolvedValue({
      rows: [{ user_id: 'user-123' }]
    });

    // Mock service error
    (tradingService.placeOrder as any).mockRejectedValue(new Error('Validation failed'));

    const request: HttpRequest = {
      body: {
        accountId: 'acc-123',
        symbol: 'BTC-USD',
      },
      headers: {
        authorization: 'Bearer valid-token',
      },
      query: {},
      params: {},
    };

    const response = await handler!(request);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
