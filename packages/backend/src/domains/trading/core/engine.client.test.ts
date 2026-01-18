import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpEngineClient, type PlaceOrderInput } from './engine.client.js';

describe('HttpEngineClient', () => {
    let client: HttpEngineClient;
    const baseUrl = 'http://test-engine:4000';

    beforeEach(() => {
        client = new HttpEngineClient(baseUrl);
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should place an order successfully', async () => {
        const input: PlaceOrderInput = {
            accountId: 'acc-1',
            symbol: 'BTC-USD',
            side: 'buy',
            type: 'market',
            quantity: 1.5
        };

        const mockResponse = {
            ok: true,
            json: async () => ({ success: true, orderId: 'ord-123' })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await client.placeOrder(input);

        expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Account-ID': 'acc-1'
            },
            body: JSON.stringify(input)
        });
        expect(result).toEqual({ success: true, orderId: 'ord-123' });
    });

    it('should handle place order error (network)', async () => {
        const input: PlaceOrderInput = {
            accountId: 'acc-1',
            symbol: 'BTC-USD',
            side: 'buy',
            type: 'market',
            quantity: 1.5
        };

        (global.fetch as any).mockRejectedValue(new Error('Network error'));

        const result = await client.placeOrder(input);

        expect(result).toEqual({ success: false, error: 'Engine unavailable' });
    });

    it('should cancel an order successfully', async () => {
        const orderId = 'ord-123';
        const accountId = 'acc-1';

        const mockResponse = {
            ok: true,
            json: async () => ({ success: true })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await client.cancelOrder(orderId, accountId);

        expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                'X-Account-ID': accountId
            }
        });
        expect(result).toEqual({ success: true });
    });

    it('should handle non-200 responses from engine', async () => {
        const input: PlaceOrderInput = {
            accountId: 'acc-1',
            symbol: 'BTC-USD',
            side: 'buy',
            type: 'market',
            quantity: 1.5
        };

        const mockResponse = {
            ok: false,
            status: 400,
            json: async () => ({ success: false, message: 'Invalid quantity' })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await client.placeOrder(input);

        expect(result).toEqual({ success: false, error: 'Invalid quantity' });
    });

    it('should handle cancel order error', async () => {
        const orderId = 'ord-123';
        const accountId = 'acc-1';

        const mockResponse = {
            ok: false,
            status: 404,
            json: async () => ({ success: false, message: 'Order not found' })
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        const result = await client.cancelOrder(orderId, accountId);

        expect(result).toEqual({ success: false, error: 'Order not found' });
    });
});
