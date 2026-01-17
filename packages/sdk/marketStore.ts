import { create } from 'zustand';
import type { DataConfidenceLevel, Level2BookData, MarketMetrics, Trade } from '../types/market';
import type { NetworkEvent } from '../types/market';
import { generateUUID } from './utils/uuid';
import { useWatchlistStore } from './watchlistStore';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionStatus {
	state: ConnectionState;
	latencyMs: number;
	messageRate: number;
	lastMessageTime: number;
	reconnectCount: number;
	resyncCount: number;
	gapCount: number;
	error?: string;
}

export interface MarketLogEntry {
	level: 'debug' | 'info' | 'warn' | 'error';
	category: string;
	event: string;
	data: Record<string, unknown>;
	timestamp: number;
}

export interface DataConfidence {
	level: DataConfidenceLevel;
	reason?: string;
	details: {
		wsConnected: boolean;
		sequenceContinuous: boolean;
		latencyOk: boolean;
		updateFrequencyOk: boolean;
		queueHealthy: boolean;
	};
}

export interface ExtendedMarketMetrics extends MarketMetrics {
	bidAskImbalance: number;
	microVolatility: number;
	tradeIntensity: number;
	vwap60s: string;
	liquidityScore: number;
	slippageEst: string;
	bidDepthVolume: string;
	askDepthVolume: string;
}

export interface NetworkHealthState {
	score: number;
	trend: 'improving' | 'stable' | 'degrading';
	scoreComponents: { latency: number; stability: number; throughput: number; reliability: number };
	stats: {
		sessionStartTime: number;
		uptimePercent: number;
		totalReconnects: number;
		totalGaps: number;
		avgLatency: number;
		latencyP95: number;
		minLatency: number;
		maxLatency: number;
	};
	recentEvents: NetworkEvent[];
}

interface MarketState {
	connectionStatus: ConnectionStatus;
	dataConfidence: DataConfidence;
	Level2Book: Level2BookData | null;
	metrics: ExtendedMarketMetrics | null;
	ticker: { symbol: string; price: string; priceChange24h?: number } | null;
	RecentPositions: Trade[];
	networkHealth: NetworkHealthState | null;
	logs: MarketLogEntry[];
	clearLogs: () => void;
	isLiveMode: boolean;
	setLiveMode: (isLive: boolean) => void;

	activeSymbol: string | null;

	subscribe: (symbol: string) => void;
	subscribeWatchlist: (symbols: string[]) => void;
	unsubscribe: () => void;
}

let intervalId: number | null = null;
let connectTimeoutId: number | null = null;
let socket: WebSocket | null = null;

const randomAround = (mid: number, widthBps: number) => {
	const maxDelta = mid * (widthBps / 10000);
	return mid + (Math.random() - 0.5) * 2 * maxDelta;
};

const buildBook = (mid: number, levels = 20) => {
	const bids = Array.from({ length: levels }).map((_, i) => ({
		price: (mid * (1 - (i + 1) * 0.0002)).toFixed(2),
		quantity: (0.01 + Math.random() * 0.25).toFixed(4),
	}));
	const asks = Array.from({ length: levels }).map((_, i) => ({
		price: (mid * (1 + (i + 1) * 0.0002)).toFixed(2),
		quantity: (0.01 + Math.random() * 0.25).toFixed(4),
	}));
	return { bids, asks };
};



const nowTrade = (symbol: string, mid: number): Trade => ({
	id: generateUUID(),
	symbol,
	price: randomAround(mid, 5).toFixed(2),
	quantity: (0.001 + Math.random() * 0.05).toFixed(4),
	time: Date.now(),
	isBuyerMaker: Math.random() > 0.5,
});

export const useMarketStore = create<MarketState>((set, get) => ({
	connectionStatus: {
		state: 'disconnected',
		latencyMs: 0,
		messageRate: 0,
		lastMessageTime: 0,
		reconnectCount: 0,
		resyncCount: 0,
		gapCount: 0,
	},
	dataConfidence: {
		level: 'stale',
		reason: 'Market data not connected (simulated)',
		details: {
			wsConnected: false,
			sequenceContinuous: true,
			latencyOk: true,
			updateFrequencyOk: false,
			queueHealthy: true,
		},
	},
	Level2Book: null,
	metrics: null,
	ticker: null,
	RecentPositions: [],
	activeSymbol: null,
	logs: [
		{
			level: 'info',
			category: 'market',
			event: 'init',
			data: { mode: 'simulated' },
			timestamp: Date.now(),
		},
	],
	clearLogs: () => set({ logs: [] }),
	isLiveMode: true,
	setLiveMode: (isLive) => set({ isLiveMode: isLive }),
	networkHealth: {
		score: 45,
		trend: 'stable',
		scoreComponents: { latency: 12, stability: 14, throughput: 10, reliability: 9 },
		stats: {
			sessionStartTime: Date.now(),
			uptimePercent: 99.0,
			totalReconnects: 0,
			totalGaps: 0,
			avgLatency: 0,
			latencyP95: 0,
			minLatency: 0,
			maxLatency: 0,
		},
		recentEvents: [],
	},

	// Import watchlist store for syncing prices
	// ... (helper functions)

	// ... (existing helper function remain same)

	subscribe: (symbol) => {
		const currentState = get();

		if (intervalId) {
			window.clearInterval(intervalId);
			intervalId = null;
		}
		if (connectTimeoutId) {
			window.clearTimeout(connectTimeoutId);
			connectTimeoutId = null;
		}

		// Reset data when switching symbols to prevent stale data leaks
		set({
			Level2Book: null,
			metrics: null,
			ticker: null,
			activeSymbol: symbol, // Set active symbol
		});

		// Close socket to force fresh connection for active symbol (simplifies "mode" handling)
		// In a more advanced implementation, we would keep the socket open and just send a new subscribe message.
		if (socket) {
			socket.close();
			socket = null;
		}

		if (currentState.isLiveMode) {
			// ... (logging and status updates remain same)
			set((state) => ({
				connectionStatus: { ...state.connectionStatus, state: 'connecting', error: undefined },
				// ...
			}));

			try {
				const wsUrl = import.meta.env.VITE_MARKET_DATA_WS_URL || 'ws://localhost:6060/ws';
				socket = new WebSocket(wsUrl);

				socket.addEventListener('open', () => {
					if (socket?.readyState === WebSocket.OPEN) {
						socket.send(JSON.stringify({ type: 'subscribe', symbols: [symbol] }));
						set((state) => ({
							connectionStatus: { ...state.connectionStatus, state: 'connected', lastMessageTime: Date.now() },
							// ...
						}));
					}
				});

				socket.addEventListener('message', (event) => {
					try {
						const msg = JSON.parse(event.data);

						// Handle standard tick updates from backend
						if (msg.type === 'tick' && msg.data) {
							const { symbol: tickSymbol, last, bid, ask, changePercent, volume } = msg.data;
							const price = Number(last) || 0;

							// 1. ALWAYS Sync with Watchlist Store
							useWatchlistStore.getState().updateSymbolPrice(
								tickSymbol,
								String(price),
								changePercent,
								bid ? String(bid) : undefined,
								ask ? String(ask) : undefined
							);

							// 2. ONLY update Market Store ID if it matches the ACTIVE symbol
							if (tickSymbol === get().activeSymbol) {
								// Dynamic precision: 2 for high prices (>10), 4 for forex/low prices
								const bookMid = price;
								const precision = bookMid > 10 ? 2 : 4;

								// Update ticker
								set((prev) => ({
									ticker: { symbol: tickSymbol, price: price.toFixed(precision), priceChange24h: changePercent },
									metrics: {
										...prev.metrics,
										// Critical: Update mid price for OrderForm defaults
										mid: price.toFixed(precision),
										// Update basic metrics from tick
										volume: volume ? String(volume) : prev.metrics?.volume || '0',
										spread: (ask && bid) ? (ask - bid).toFixed(precision) : '0.00',
										spreadBps: (ask && bid && price) ? ((ask - bid) / price * 10000) : 0,
										bid: bid ? bid.toFixed(precision) : prev.metrics?.bid || '0',
										ask: ask ? ask.toFixed(precision) : prev.metrics?.ask || '0',
									} as ExtendedMarketMetrics
								}));

								// Generate synthetic Level2 based on live bid/ask
								// (Reuse bookMid from above)

								const bids = Array.from({ length: 20 }).map((_, i) => ({
									price: (bookMid * (1 - (i + 1) * 0.0002)).toFixed(precision),
									quantity: (0.01 + Math.random() * 0.25).toFixed(4),
								}));
								const asks = Array.from({ length: 20 }).map((_, i) => ({
									price: (bookMid * (1 + (i + 1) * 0.0002)).toFixed(precision),
									quantity: (0.01 + Math.random() * 0.25).toFixed(4),
								}));

								// Override top of book with real bid/ask if available
								if (bid) bids[0].price = String(bid);
								if (ask) asks[0].price = String(ask);

								set({ Level2Book: { symbol: tickSymbol, bids, asks } });

								// Update connection stats
								set((prev) => ({
									connectionStatus: {
										...prev.connectionStatus,
										lastMessageTime: Date.now(),
										messageRate: (prev.connectionStatus.messageRate + 1) / 2,
									}
								}));
							}
						}
						// ... (rest of message handling)

					} catch (e) {
						console.error('Failed to parse WS message', e);
					}
				});

				socket.addEventListener('close', () => {
					set((state) => ({
						connectionStatus: { ...state.connectionStatus, state: 'disconnected' },
						dataConfidence: {
							...state.dataConfidence,
							level: 'stale',
							reason: 'Disconnected (live)',
							details: { ...state.dataConfidence.details, wsConnected: false },
						}
					}));
				});

				socket.addEventListener('error', () => {
					set((state) => ({
						connectionStatus: { ...state.connectionStatus, state: 'error', error: 'Connection failed' }
					}));
				});

			} catch (err) {
				console.error('WS Connection error', err);
			}

			return;
		}

		// Simulated feed: generate ticks locally so UI has behavior without backend.
		const start = Date.now();
		set((state) => ({
			connectionStatus: { ...state.connectionStatus, state: 'connecting', error: undefined },
			dataConfidence: {
				...state.dataConfidence,
				level: 'resyncing',
				reason: 'Connecting (simulated)',
				details: { ...state.dataConfidence.details, wsConnected: false },
			},
			logs: [
				...state.logs,
				{
					level: 'info' as const,
					category: 'market',
					event: 'subscribe',
					data: { symbol },
					timestamp: Date.now(),
				},
			].slice(-200),
			networkHealth: state.networkHealth
				? {
					...state.networkHealth,
					recentEvents: [
						{ type: 'reconnecting' as const, timestamp: Date.now(), details: 'Starting simulated feed' },
						...state.networkHealth.recentEvents,
					].slice(0, 50),
				}
				: null,
		}));

		let mid = symbol.startsWith('ETH') ? 3125 : symbol.startsWith('SOL') ? 105 : 52450;

		connectTimeoutId = window.setTimeout(() => {
			set((state) => ({
				connectionStatus: { ...state.connectionStatus, state: 'connected', lastMessageTime: Date.now() },
				dataConfidence: {
					...state.dataConfidence,
					level: 'degraded',
					reason: 'Simulated market feed (backend not ready)',
					details: { ...state.dataConfidence.details, wsConnected: true, updateFrequencyOk: true },
				},
				logs: [
					...state.logs,
					{
						level: 'info' as const,
						category: 'market',
						event: 'connected',
						data: { symbol },
						timestamp: Date.now(),
					},
				].slice(-200),
				networkHealth: state.networkHealth
					? {
						...state.networkHealth,
						recentEvents: [
							{ type: 'connected' as const, timestamp: Date.now(), details: 'Simulated feed connected' },
							...state.networkHealth.recentEvents,
						].slice(0, 50),
					}
					: null,
			}));
			connectTimeoutId = null;
		}, 300);

		intervalId = window.setInterval(() => {
			const state = get();
			mid = randomAround(mid, 8);
			const { bids, asks } = buildBook(mid);
			const bestBid = parseFloat(bids[0]?.price || String(mid));
			const bestAsk = parseFloat(asks[0]?.price || String(mid));
			const spread = Math.max(bestAsk - bestBid, 0);
			const spreadBps = mid > 0 ? (spread / mid) * 10000 : 0;

			const trade = nowTrade(symbol, mid);
			const trades = [trade, ...state.RecentPositions].slice(0, 200);

			const latency = Math.random() * 15;
			const elapsedS = Math.max((Date.now() - start) / 1000, 1);
			const rate = Math.min(10, Math.max(1, Math.round(trades.length / elapsedS)));

			set((prev) => ({
				Level2Book: {
					symbol,
					bids,
					asks,
					lastUpdateId: (prev.Level2Book?.lastUpdateId || 0) + 1,
				},
				metrics: {
					symbol,
					bid: bestBid.toFixed(2),
					ask: bestAsk.toFixed(2),
					mid: mid.toFixed(2),
					spread: spread.toFixed(2),
					spreadBps,
					bidAskImbalance: (Math.random() - 0.5) * 0.4,
					microVolatility: Math.random() * 0.01,
					tradeIntensity: Math.round(Math.random() * 10),
					vwap60s: mid.toFixed(2),
					liquidityScore: 40 + Math.random() * 50,
					slippageEst: (Math.random() * 8).toFixed(2),
					bidDepthVolume: (Math.random() * 1000).toFixed(2),
					askDepthVolume: (Math.random() * 1000).toFixed(2),
				},
				ticker: { symbol, price: mid.toFixed(2), priceChange24h: (Math.random() - 0.5) * 5 },
				RecentPositions: trades,
				connectionStatus: {
					...prev.connectionStatus,
					state: 'connected',
					latencyMs: latency,
					messageRate: rate,
					lastMessageTime: Date.now(),
				},
				networkHealth: prev.networkHealth
					? {
						...prev.networkHealth,
						stats: {
							...prev.networkHealth.stats,
							avgLatency: (prev.networkHealth.stats.avgLatency + latency) / 2,
							latencyP95: Math.max(prev.networkHealth.stats.latencyP95, latency),
							minLatency: prev.networkHealth.stats.minLatency === 0 ? latency : Math.min(prev.networkHealth.stats.minLatency, latency),
							maxLatency: Math.max(prev.networkHealth.stats.maxLatency, latency),
						},
					}
					: null,
			}));
		}, 450);

	},

	subscribeWatchlist: (symbols: string[]) => {
		// Only send message if socket is open
		if (socket?.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ type: 'subscribe', symbols }));
		}
	},

	unsubscribe: () => {
		if (intervalId) {
			window.clearInterval(intervalId);
			intervalId = null;
		}
		if (connectTimeoutId) {
			window.clearTimeout(connectTimeoutId);
			connectTimeoutId = null;
		}

		if (socket) {
			socket.close();
			socket = null;
		}

		set((state) => ({
			connectionStatus: { ...state.connectionStatus, state: 'disconnected', messageRate: 0 },
			dataConfidence: {
				...state.dataConfidence,
				level: 'stale',
				reason: 'Disconnected',
				details: { ...state.dataConfidence.details, wsConnected: false, updateFrequencyOk: false },
			},
			logs: [
				...state.logs,
				{
					level: 'info' as const,
					category: 'market',
					event: 'disconnected',
					data: {},
					timestamp: Date.now(),
				},
			].slice(-200),
		}));
	},
}));

// Selectors
export const selectConnectionStatus = (state: MarketState) => state.connectionStatus;
export const selectMetrics = (state: MarketState) => state.metrics;
export const selectLevel2Book = (state: MarketState) => state.Level2Book;
export const selectTicker = (state: MarketState) => state.ticker;
export const selectRecentPositions = (state: MarketState) => state.RecentPositions;
export const selectTrades = selectRecentPositions;
export const selectNetworkHealth = (state: MarketState) => state.networkHealth;

export const selectBestBid = (state: MarketState) => state.metrics?.bid || '0';
export const selectBestAsk = (state: MarketState) => state.metrics?.ask || '0';

export const selectDataConfidence = (state: MarketState) => state.dataConfidence;

export const selectLogs = (state: MarketState) => state.logs;

export const selectCanTrustMetrics = (state: MarketState) => state.dataConfidence.level === 'live';
