/**
 * Market Data Context
 *
 * Provides real-time market data via native WebSocket connection
 * to the market-data service (port 4002).
 *
 * Protocol (from market-data/src/domains/stream):
 * - Subscribe: { type: "subscribe", symbols: ["BTC/USD"] }
 * - Unsubscribe: { type: "unsubscribe", symbols: ["BTC/USD"] }
 * - Ping: { type: "ping" }
 * - Server sends: { type: "tick", data: { symbol, last, bid, ask, ... } }
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

// Market data WebSocket runs on port 4002 with /ws path
const WS_URL = import.meta.env.VITE_MARKET_DATA_WS_URL || 'ws://localhost:4002/ws';

export interface MarketData {
    symbol: string;
    price: number;
    last?: number;
    bid?: number;
    ask?: number;
    change: number;
    changePercent: number;
    [key: string]: unknown;
}

interface MarketDataContextType {
    latestData: Record<string, MarketData>;
    subscribe: (symbol: string) => void;
    unsubscribe: (symbol: string) => void;
    isConnected: boolean;
}

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined);

export const MarketDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [latestData, setLatestData] = useState<Record<string, MarketData>>({});
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const subCounts = useRef<Record<string, number>>({});
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
    const connectRef = useRef<() => void>(() => {});

    const sendMessage = useCallback((message: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[MarketData] WebSocket connected');
                setIsConnected(true);

                // Resubscribe to all active symbols
                const activeSymbols = Object.entries(subCounts.current)
                    .filter(([, count]) => count > 0)
                    .map(([symbol]) => symbol);

                if (activeSymbols.length > 0) {
                    sendMessage({ type: 'subscribe', symbols: activeSymbols });
                }
            };

            ws.onclose = (event) => {
                console.log('[MarketData] WebSocket closed:', event.code, event.reason);
                setIsConnected(false);
                wsRef.current = null;

                // Reconnect after 3 seconds using ref to avoid circular dependency
                if (!reconnectTimeout.current) {
                    reconnectTimeout.current = setTimeout(() => {
                        reconnectTimeout.current = null;
                        connectRef.current();
                    }, 3000);
                }
            };

            ws.onerror = (error) => {
                console.error('[MarketData] WebSocket error:', error);
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === 'tick' && message.data) {
                        const data = message.data;
                        setLatestData(prev => ({
                            ...prev,
                            [data.symbol]: {
                                symbol: data.symbol,
                                price: data.last || data.price || 0,
                                last: data.last,
                                bid: data.bid,
                                ask: data.ask,
                                change: data.change || 0,
                                changePercent: data.changePercent || 0,
                                ...data,
                            }
                        }));
                    } else if (message.type === 'subscribed') {
                        console.log('[MarketData] Subscribed to:', message.symbols);
                    } else if (message.type === 'error') {
                        console.error('[MarketData] Server error:', message.message);
                    }
                } catch (e) {
                    console.error('[MarketData] Failed to parse message:', e);
                }
            };
        } catch (error) {
            console.error('[MarketData] Failed to connect:', error);
        }
    }, [sendMessage]);

    // Keep connectRef updated so the onclose handler can call the latest connect function
    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    useEffect(() => {
        connect();

        // Ping every 25 seconds to keep connection alive
        const pingInterval = setInterval(() => {
            sendMessage({ type: 'ping' });
        }, 25000);

        return () => {
            clearInterval(pingInterval);
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            wsRef.current?.close();
        };
    }, [connect, sendMessage]);

    const subscribe = useCallback((symbol: string) => {
        if (!subCounts.current[symbol]) subCounts.current[symbol] = 0;
        subCounts.current[symbol]++;

        if (subCounts.current[symbol] === 1) {
            sendMessage({ type: 'subscribe', symbols: [symbol] });
        }
    }, [sendMessage]);

    const unsubscribe = useCallback((symbol: string) => {
        if (!subCounts.current[symbol]) return;
        subCounts.current[symbol]--;

        if (subCounts.current[symbol] <= 0) {
            subCounts.current[symbol] = 0;
            sendMessage({ type: 'unsubscribe', symbols: [symbol] });
        }
    }, [sendMessage]);

    return (
        <MarketDataContext.Provider value={{ latestData, subscribe, unsubscribe, isConnected }}>
            {children}
        </MarketDataContext.Provider>
    );
};

export const useMarketDataContext = () => {
    const context = useContext(MarketDataContext);
    if (!context) throw new Error("useMarketDataContext must be used within MarketDataProvider");
    return context;
};
