/**
 * Market Data Types
 * 
 * Defines market data structures for ticks, OHLC, and order book.
 */

/** Real-time price tick */
export interface Tick {
    /** Symbol */
    symbol: string;

    /** Bid price (sell price) */
    bid: number;

    /** Ask price (buy price) */
    ask: number;

    /** Spread (ask - bid) */
    spread: number;

    /** Last traded price */
    last: number;

    /** Tick timestamp */
    timestamp: number;

    /** Volume at this tick */
    volume?: number;

    /** Price direction since last tick */
    direction: 'up' | 'down' | 'unchanged';
}

/** OHLC candlestick data */
export interface OHLC {
    /** Candle open time (Unix timestamp in seconds) */
    time: number;

    /** Open price */
    open: number;

    /** High price */
    high: number;

    /** Low price */
    low: number;

    /** Close price */
    close: number;

    /** Volume */
    volume?: number;
}

/** Chart timeframe */
export type Timeframe =
    | '1m' | '5m' | '15m' | '30m'  // Minutes
    | '1h' | '4h'                   // Hours
    | '1d' | '1w' | '1M';          // Day, Week, Month

/** Order book price level */
export interface OrderBookLevel {
    /** Price at this level */
    price: number;

    /** Quantity at this level */
    quantity: number;

    /** Cumulative quantity up to this level */
    cumulative: number;

    /** Total value at this level (price * quantity) */
    total: number;
}

/** OrderBook snapshot */
export interface OrderBookData {
    /** Symbol */
    symbol: string;

    /** Bid levels (sorted by price descending) */
    bids: OrderBookLevel[];

    /** Ask levels (sorted by price ascending) */
    asks: OrderBookLevel[];

    /** Best bid price */
    bestBid: number;

    /** Best ask price */
    bestAsk: number;

    /** Current spread */
    spread: number;

    /** Mid price */
    midPrice: number;

    /** Snapshot timestamp */
    timestamp: number;
}

/** Market statistics (24h) */
export interface MarketStats {
    /** Symbol */
    symbol: string;

    /** Current price */
    price: number;

    /** 24h change in price */
    change24h: number;

    /** 24h change percentage */
    changePercent24h: number;

    /** 24h high */
    high24h: number;

    /** 24h low */
    low24h: number;

    /** 24h volume */
    volume24h: number;

    /** 24h volume in quote currency */
    volumeQuote24h: number;

    /** Number of trades in 24h */
    trades24h: number;

    /** Last update timestamp */
    lastUpdate: number;
}

/** Depth chart point */
export interface DepthPoint {
    /** Price level */
    price: number;

    /** Cumulative quantity */
    quantity: number;
}

/** Depth chart data */
export interface DepthChartData {
    /** Bid depth points */
    bids: DepthPoint[];

    /** Ask depth points */
    asks: DepthPoint[];
}
