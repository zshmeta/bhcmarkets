import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTradingStore } from './tradingStore';
import { apiClient } from '../api/apiClient';

// Mock apiClient
vi.mock('../api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('tradingStore', () => {
  beforeEach(() => {
    useTradingStore.setState({
      orders: [],
      positions: new Map(),
      isPaperTrading: true,
    });
    vi.clearAllMocks();
  });

  it('should create paper order in paper trading mode', async () => {
    const { createOrder } = useTradingStore.getState();
    const result = await createOrder({
      symbol: 'BTCUSDT',
      side: 'buy',
      type: 'limit',
      price: '50000',
      quantity: '1',
    });

    expect(result.success).toBe(true);
    expect(useTradingStore.getState().orders).toHaveLength(1);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('should call API in live trading mode', async () => {
    useTradingStore.getState().setTradingMode(false);
    
    vi.mocked(apiClient.post).mockResolvedValue({ success: true, clientOrderId: '123' });

    const { createOrder } = useTradingStore.getState();
    const result = await createOrder({
      symbol: 'BTCUSDT',
      side: 'buy',
      type: 'limit',
      price: '50000',
      quantity: '1',
    });

    expect(result.success).toBe(true);
    expect(apiClient.post).toHaveBeenCalledWith('/orders', expect.objectContaining({
      symbol: 'BTCUSDT',
      side: 'buy',
      type: 'limit',
      price: '50000',
      quantity: '1',
    }));
    // Orders in store should NOT be updated automatically for live trading unless fetchOrders is called
    expect(useTradingStore.getState().orders).toHaveLength(0);
  });

  it('should fetch orders in live mode', async () => {
    useTradingStore.getState().setTradingMode(false);
    const mockOrders = [{ clientOrderId: '1', symbol: 'BTCUSDT' }];
    vi.mocked(apiClient.get).mockResolvedValue(mockOrders);

    await useTradingStore.getState().fetchOrders();

    expect(apiClient.get).toHaveBeenCalledWith('/orders');
    expect(useTradingStore.getState().orders).toEqual(mockOrders);
  });
  
  it('should fetch positions in live mode', async () => {
    useTradingStore.getState().setTradingMode(false);
    const mockPositions = [{ symbol: 'BTCUSDT', side: 'long', quantity: '1', avgEntryPrice: '50000' }];
    vi.mocked(apiClient.get).mockResolvedValue(mockPositions);

    await useTradingStore.getState().fetchPositions();

    expect(apiClient.get).toHaveBeenCalledWith('/positions');
    const positions = useTradingStore.getState().positions;
    expect(positions.get('BTCUSDT')).toEqual(mockPositions[0]);
  });
});
