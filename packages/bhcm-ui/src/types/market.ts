/**
 * Market-related types used by trading components.
 * Stub file for design preview - minimal definitions.
 */

export interface Level2BookLevel {
    price: string;
    quantity: string;
}

export interface Level2BookData {
    symbol: string;
    bids: Level2BookLevel[];
    asks: Level2BookLevel[];
    lastUpdateId?: number;
}

export interface MarketMetrics {
    symbol: string;
    bid: string;
    ask: string;
    mid: string;
    spread: string;
    spreadBps: number;
    volume24h?: string;
    high24h?: string;
    low24h?: string;
}

export interface Ticker {
    symbol: string;
    price: string;
    priceChange24h?: number;
    volume24h?: string;
}

export interface Trade {
    id: string;
    price: string;
    quantity: string;
    time: number;
    isBuyerMaker: boolean;
}


export type DataConfidenceLevel = 'live' | 'degraded' | 'stale' | 'resyncing';

export type NetworkEventType =
    | 'connected'
    | 'disconnected'
    | 'reconnecting'
    | 'latency_spike'
    | 'latency_normal'
    | 'gap_detected'
    | 'resync_start'
    | 'resync_complete'
    | 'rate_drop'
    | 'rate_normal';

export interface NetworkEvent {
    type: NetworkEventType;
    timestamp: number;
    details?: string;
}
