
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock WebSocket
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 0, // CONNECTING
};
const WS = vi.fn(function() {
  return mockWebSocket;
});
vi.stubGlobal('WebSocket', WS);

// Polyfill window
if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).window = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
  };
}

describe('marketStore', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with isLiveMode as false', async () => {
    const { useMarketStore } = await import('./marketStore');
    expect(useMarketStore.getState().isLiveMode).toBe(false);
  });

  it('can toggle live mode', async () => {
    const { useMarketStore } = await import('./marketStore');
    
    useMarketStore.getState().setLiveMode(true);
    expect(useMarketStore.getState().isLiveMode).toBe(true);
    
    useMarketStore.getState().setLiveMode(false);
    expect(useMarketStore.getState().isLiveMode).toBe(false);
  });

  it('connects to WebSocket when subscribing in live mode', async () => {
    const { useMarketStore } = await import('./marketStore');
    
    useMarketStore.getState().setLiveMode(true);
    useMarketStore.getState().subscribe('BTC-USD');

    expect(WS).toHaveBeenCalledWith('ws://localhost:3001/ws');
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('closes WebSocket when unsubscribing in live mode', async () => {
    const { useMarketStore } = await import('./marketStore');
    
    useMarketStore.getState().setLiveMode(true);
    useMarketStore.getState().subscribe('BTC-USD');
    
    useMarketStore.getState().unsubscribe();

    expect(mockWebSocket.close).toHaveBeenCalled();
    expect(useMarketStore.getState().connectionStatus.state).toBe('disconnected');
  });
});
