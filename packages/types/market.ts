export type CurrencyCode = string; // ISO-4217 or crypto ticker

export interface SymbolInfo {
	symbol: string; // e.g., EUR/USD or AAPL or XAUUSD
	base: string;   // e.g., EUR
	quote: string;  // e.g., USD
	venue?: string; // exchange or provider
	kind: "forex" | "stock" | "commodity" | "crypto";
	tickSize?: number; // price precision
	lotSize?: number;  // quantity precision
}

export interface QuoteTick {
	symbol: string;
	bid?: number;
	ask?: number;
	last?: number;
	ts: number; // epoch ms
}

export interface Candle {
	symbol: string;
	timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
	open: number;
	high: number;
	low: number;
	close: number;
	volume?: number;
	ts: number;
}

// ===== Market Data Types (streaming / precise string decimals) =====

export interface MarketTrade {
	id: string; // Trade ID (provided by the exchange)
	symbol: string; // Trading pair, e.g. "BTCUSDT"
	price: string; // Trade price (string for precision)
	quantity: string; // Trade quantity
	quoteQty: string; // Quote amount = price * quantity
	time: number; // Trade time (ms timestamp)
	isBuyerMaker: boolean; // true = sell order filled, false = buy order filled
	localReceiveTime: number; // Local receive time
}

export interface OrderBookLevel {
	price: string; // Price level
	quantity: string; // Aggregated quantity at this level
}

export interface OrderBook {
	symbol: string;
	bids: OrderBookLevel[]; // Bids, sorted by price descending
	asks: OrderBookLevel[]; // Asks, sorted by price ascending
	lastUpdateId: number; // Last update ID (for incremental merge validation)
	localUpdateTime: number; // Local update time
	isStale: boolean; // Whether stale (no update for > 500ms)
	depth: number; // Current depth levels
}

export interface StreamCandle {
	symbol: string;
	interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
	openTime: number;
	open: string;
	high: string;
	low: string;
	close: string;
	volume: string; // Volume (base asset)
	quoteVolume: string; // Quote volume (quote asset)
	trades: number; // Number of trades
	isClosed: boolean; // Whether this candle is closed
}

// ===== Derived Metrics =====

export interface DerivedMetrics {
	mid: string; // Mid price
	spread: string; // Bid-ask spread (absolute)
	spreadBps: number; // Spread (basis points)
	bidAskImbalance: number; // Bid/ask pressure indicator, -1 to +1
	microVolatility: number; // Volatility over the past 60s
	tradeIntensity: number; // Number of trades over the past 10s
	vwap60s: string; // 60s VWAP
	liquidityScore: number; // Liquidity score 0-100
	slippageEst: string; // Slippage estimate
	lastUpdateTime: number; // Last update time
	bidDepthVolume: string; // Cumulative bid depth
	askDepthVolume: string; // Cumulative ask depth
	high24h: string; // 24h high
	low24h: string; // 24h low
	vol24h: string; // 24h volume (base asset)
	priceChange24h: string; // 24h price change
	priceChangePercent24h: string; // 24h price change percentage
}

// ===== Connection Status =====

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface ConnectionStatus {
	state: ConnectionState;
	latencyMs: number; // Latency in milliseconds
	lastMessageTime: number; // Time of last message
	reconnectCount: number; // Reconnect count
	gapCount: number; // Gap count
	resyncCount: number; // Resync count
	messageRate: number; // Message rate (msg/s)
	isStale: boolean; // Whether data is stale
}

// ===== Network Health Score =====

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
	timestamp: number;
	type: NetworkEventType;
	details?: string;
	value?: number; // Related value (e.g. latency in ms)
}

export interface NetworkHealth {
	score: number; // 0-100 overall score
	scoreComponents: {
		latency: number; // Latency score (0-30)
		stability: number; // Stability score (0-30)
		throughput: number; // Throughput score (0-20)
		reliability: number; // Reliability score (0-20)
	};
	trend: 'improving' | 'stable' | 'degrading';
	recentEvents: NetworkEvent[];
	stats: {
		avgLatency: number;
		maxLatency: number;
		minLatency: number;
		latencyP95: number;
		uptimePercent: number;
		totalReconnects: number;
		totalGaps: number;
		sessionStartTime: number;
	};
}

// ===== Data Confidence Model =====

export type DataConfidenceLevel = 'live' | 'degraded' | 'resyncing' | 'stale';

export interface DataConfidence {
	level: DataConfidenceLevel;
	reason: string;
	canTrade: boolean;
	canTrustMetrics: boolean;
	lastLiveTime: number;
	degradedSince: number;
	details: {
		wsConnected: boolean;
		sequenceContinuous: boolean;
		latencyOk: boolean;
		updateFrequencyOk: boolean;
		queueHealthy: boolean;
	};
}

export const CONFIDENCE_THRESHOLDS = {
	LIVE_UPDATE_INTERVAL: 5000,
	DEGRADED_UPDATE_INTERVAL: 12000,
	LIVE_LATENCY: 1000,
	DEGRADED_LATENCY: 2500,
	DEGRADED_MESSAGE_RATE: 0.5,
	QUEUE_WARNING: 100,
} as const;

// ===== Worker Message Types =====

export type WorkerMessageType =
	| 'SUBSCRIBE'
	| 'UNSUBSCRIBE'
	| 'ORDERBOOK_UPDATE'
	| 'TRADE_UPDATE'
	| 'METRICS_UPDATE'
	| 'CONNECTION_STATUS'
	| 'ERROR'
	| 'LOG';

export interface WorkerMessage<T = unknown> {
	type: WorkerMessageType;
	payload: T;
	timestamp: number;
}

export interface SubscribePayload {
	symbol: string;
	streams: ('depth' | 'trade')[];
}

export interface OrderBookUpdatePayload {
	orderBook: OrderBook;
	metrics: DerivedMetrics;
	lastMessageTime: number;
}

export interface TradeUpdatePayload {
	trades: MarketTrade[];
}

export interface ConnectionStatusPayload extends ConnectionStatus {
	networkHealth?: NetworkHealth;
}

export interface LogPayload {
	level: 'debug' | 'info' | 'warn' | 'error';
	category: 'ws' | 'orderbook' | 'order' | 'system';
	event: string;
	data: Record<string, unknown>;
}


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
    symbol?: string;
    price: string;
    quantity: string;
    time: number;
    isBuyerMaker: boolean;
}




export interface NetworkEvent {
    type: NetworkEventType;
    timestamp: number;
    details?: string;
}
