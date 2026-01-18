import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Define types (copy from frontend or shared package if available)
export interface MarketData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    high: number;
    low: number;
}

interface MarketDataContextType {
    latestData: Record<string, MarketData>;
    subscribe: (symbol: string) => void;
    unsubscribe: (symbol: string) => void;
    isConnected: boolean;
}

const MarketDataContext = createContext<MarketDataContextType | null>(null);

export const MarketDataProvider = ({ children }: { children: React.ReactNode }) => {
    const [latestData, setLatestData] = useState<Record<string, MarketData>>({});
    const [isConnected, setIsConnected] = useState(false);

    // In emulator, localhost is 10.0.2.2 usually, but for physical device need IP.
    // For now defaulting to localhost or ENV.
    const URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    const socketRef = useRef<Socket | null>(null);
    const subCounts = useRef<Record<string, number>>({});

    useEffect(() => {
        const socket = io(URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Mobile WS Connected:', socket.id);
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Mobile WS Disconnected');
            setIsConnected(false);
        });

        socket.on('price_update', (update: { symbol: string, data: MarketData }) => {
            setLatestData(prev => ({
                ...prev,
                [update.symbol]: update.data
            }));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const subscribe = (symbol: string) => {
        if (!socketRef.current) return;
        const current = subCounts.current[symbol] || 0;
        subCounts.current[symbol] = current + 1;

        if (current === 0) {
            console.log('Subscribing to', symbol);
            socketRef.current.emit('subscribe', [symbol]);
        }
    };

    const unsubscribe = (symbol: string) => {
        if (!socketRef.current) return;
        const current = subCounts.current[symbol] || 0;
        if (current > 0) {
            subCounts.current[symbol] = current - 1;
            if (subCounts.current[symbol] === 0) {
                console.log('Unsubscribing from', symbol);
                socketRef.current.emit('unsubscribe', [symbol]);
            }
        }
    };

    return (
        <MarketDataContext.Provider value={{ latestData, subscribe, unsubscribe, isConnected }}>
            {children}
        </MarketDataContext.Provider>
    );
};

export const useMarketDataContext = () => {
    const ctx = useContext(MarketDataContext);
    if (!ctx) throw new Error("useMarketDataContext must be used within MarketDataProvider");
    return ctx;
};
