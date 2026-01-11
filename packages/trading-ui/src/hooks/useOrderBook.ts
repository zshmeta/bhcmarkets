/**
 * useOrderBook Hook
 * 
 * Provides real-time order book data for a symbol.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { OrderBookData } from '../types';
import { createOrderBookStream, generateOrderBook } from '../mocks';

interface UseOrderBookOptions {
    /** Number of levels to display */
    levels?: number;
    /** Update interval in milliseconds */
    intervalMs?: number;
    /** Whether to start the stream immediately */
    autoStart?: boolean;
}

interface UseOrderBookReturn {
    /** Current order book data */
    orderBook: OrderBookData | null;
    /** Whether the stream is running */
    isRunning: boolean;
    /** Start the order book stream */
    start: () => void;
    /** Stop the order book stream */
    stop: () => void;
    /** Refresh order book data */
    refresh: () => void;
}

/**
 * Hook for real-time order book data.
 * 
 * @param symbol - Symbol to get order book for
 * @param options - Configuration options
 * @returns Order book data and controls
 * 
 * @example
 * ```tsx
 * const { orderBook, isRunning } = useOrderBook('EURUSD');
 * const { bids, asks, spread } = orderBook;
 * ```
 */
export function useOrderBook(
    symbol: string,
    options: UseOrderBookOptions = {}
): UseOrderBookReturn {
    const { levels = 15, intervalMs = 250, autoStart = true } = options;

    const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    const cleanupRef = useRef<(() => void) | null>(null);

    const start = useCallback(() => {
        if (cleanupRef.current) {
            cleanupRef.current();
        }

        cleanupRef.current = createOrderBookStream(
            symbol,
            (ob) => setOrderBook(ob),
            intervalMs
        );
        setIsRunning(true);
    }, [symbol, intervalMs]);

    const stop = useCallback(() => {
        if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
        }
        setIsRunning(false);
    }, []);

    const refresh = useCallback(() => {
        const newOrderBook = generateOrderBook(symbol, { levels });
        setOrderBook(newOrderBook);
    }, [symbol, levels]);

    // Auto-start on mount if enabled
    useEffect(() => {
        if (autoStart) {
            start();
        }

        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
    }, [autoStart, start]);

    // Restart when symbol changes
    useEffect(() => {
        if (isRunning) {
            start();
        } else if (autoStart) {
            start();
        }
    }, [symbol]);

    return {
        orderBook,
        isRunning,
        start,
        stop,
        refresh,
    };
}
