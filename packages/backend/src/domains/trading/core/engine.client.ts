import { logger } from '../../../config/logger.js';

export interface PlaceOrderInput {
  accountId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'GTD';
  clientOrderId?: string;
}

export interface EngineTrade {
  price: number;
  quantity: number;
  timestamp: number;
}

export interface EnginePlaceOrderResponse {
  success: boolean;
  orderId?: string;
  status?: string;
  filledQuantity?: number;
  remainingQuantity?: number;
  averagePrice?: number;
  trades?: EngineTrade[];
  errors?: string[];
  error?: string;
  message?: string;
}

export interface EngineCancelOrderResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export interface EngineClient {
  placeOrder(input: PlaceOrderInput): Promise<{ success: boolean; orderId?: string; error?: string }>;
  cancelOrder(orderId: string, accountId: string): Promise<{ success: boolean; error?: string }>;
}

export class HttpEngineClient implements EngineClient {
  constructor(private readonly baseUrl: string) {}

  async placeOrder(input: PlaceOrderInput): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Account-ID': input.accountId,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        // Try to parse error message
        try {
          const data = await response.json() as EnginePlaceOrderResponse;
          const errorMessage = data.message || data.error || (data.errors ? data.errors.join(', ') : undefined) || response.statusText;
          return { success: false, error: errorMessage };
        } catch {
          return { success: false, error: response.statusText };
        }
      }

      const data = await response.json() as EnginePlaceOrderResponse;
      return { success: true, orderId: data.orderId };
    } catch (e) {
      logger.error('Failed to place order', { error: e, input });
      return { success: false, error: 'Engine unavailable' };
    }
  }

  async cancelOrder(orderId: string, accountId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'X-Account-ID': accountId,
        },
      });

      if (!response.ok) {
        try {
            const data = await response.json() as EngineCancelOrderResponse;
            return { success: false, error: data.message || data.error || response.statusText };
        } catch {
             return { success: false, error: response.statusText };
        }
      }

      return { success: true };
    } catch (e) {
      logger.error('Failed to cancel order', { error: e, orderId, accountId });
      return { success: false, error: 'Engine unavailable' };
    }
  }
}
