/**
 * Binance WebSocket Collector
 * ===========================
 *
 * Real-time cryptocurrency price collector using Binance's free WebSocket API.
 *
 * WHY BINANCE:
 * - World's largest crypto exchange by volume
 * - FREE WebSocket API with no authentication required
 * - Sub-100ms latency for price updates
 * - Comprehensive coverage (1000+ trading pairs)
 * - Reliable infrastructure with good uptime
 *
 * DATA SOURCE: Binance Combined Stream WebSocket
 * - URL: wss://stream.binance.com:9443/stream
 * - We use the "miniTicker" stream for efficient bandwidth usage
 * - Provides: last price, 24h change, 24h volume, bid/ask
 *
 * RATE LIMITS:
 * - No rate limits on WebSocket subscriptions
 * - Maximum 1024 streams per connection
 * - We're using ~20 symbols, well under the limit
 *
 * MESSAGE FORMAT (24hrMiniTicker):
 * {
 *   "e": "24hrMiniTicker",  // Event type
 *   "E": 1672515782136,     // Event time
 *   "s": "BTCUSDT",         // Symbol
 *   "c": "16500.00",        // Close price (last)
 *   "o": "16400.00",        // Open price
 *   "h": "16600.00",        // High price
 *   "l": "16300.00",        // Low price
 *   "v": "12345.67",        // Total traded base asset volume
 *   "q": "203456789.00"     // Total traded quote asset volume
 * }
 */

import { WebSocket } from 'ws';
import { BaseCollector } from './base.collector.js';
import { CRYPTO_SYMBOLS, getSymbolDef, type AssetKind } from '../../config/index.js';
import type { NormalizedTick, CollectorConfig } from './collector.types.js';

/** Binance WebSocket base URL */
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream';

/**
 * Map from Binance symbol (lowercase) to our internal symbol.
 * Pre-computed for O(1) lookup during message processing.
 *
 * Example: "btcusdt" -> "BTC/USD"
 */
const BINANCE_TO_INTERNAL = new Map<string, string>(
  CRYPTO_SYMBOLS
    .filter(s => s.sources.binance)
    .map(s => [s.sources.binance!, s.symbol])
);

/**
 * Map from internal symbol to Binance symbol.
 * Used when subscribing to streams.
 *
 * Example: "BTC/USD" -> "btcusdt"
 */
const INTERNAL_TO_BINANCE = new Map<string, string>(
  CRYPTO_SYMBOLS
    .filter(s => s.sources.binance)
    .map(s => [s.symbol, s.sources.binance!])
);

/**
 * Shape of Binance 24hr Mini Ticker message.
 * Partial typing for the fields we actually use.
 */
interface BinanceMiniTicker {
  e: '24hrMiniTicker';
  E: number;    // Event timestamp (ms)
  s: string;    // Symbol (e.g., "BTCUSDT")
  c: string;    // Close/last price
  o: string;    // Open price (24h)
  h: string;    // High (24h)
  l: string;    // Low (24h)
  v: string;    // Volume (base asset)
  q: string;    // Quote volume
}

/**
 * Shape of Binance individual ticker (more detailed, includes bid/ask).
 */
interface BinanceTicker {
  e: '24hrTicker';
  E: number;
  s: string;
  p: string;    // Price change
  P: string;    // Price change percent
  w: string;    // Weighted average price
  c: string;    // Last price
  Q: string;    // Last quantity
  b: string;    // Best bid price
  B: string;    // Best bid quantity
  a: string;    // Best ask price
  A: string;    // Best ask quantity
  o: string;    // Open price
  h: string;    // High price
  l: string;    // Low price
  v: string;    // Total traded base asset volume
  q: string;    // Total traded quote asset volume
  O: number;    // Statistics open time
  C: number;    // Statistics close time
  F: number;    // First trade ID
  L: number;    // Last trade ID
  n: number;    // Total number of trades
}

/**
 * Binance combined stream message wrapper.
 */
interface BinanceStreamMessage {
  stream: string;
  data: BinanceMiniTicker | BinanceTicker;
}

/**
 * Binance WebSocket collector for real-time cryptocurrency prices.
 */
export class BinanceCollector extends BaseCollector {
  readonly name = 'binance';
  readonly supportedKinds: AssetKind[] = ['crypto'];

  /** WebSocket connection */
  private ws: WebSocket | null = null;

  /** Pending subscription request ID */
  private subscriptionId = 0;

  /** Track which streams we've subscribed to */
  private activeStreams = new Set<string>();

  /** Heartbeat interval */
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(config?: CollectorConfig) {
    super(config);
  }

  // ============================================================
  // ABSTRACT METHOD IMPLEMENTATIONS
  // ============================================================

  /**
   * Connect to Binance WebSocket.
   *
   * We connect to the combined stream endpoint, which allows us to
   * subscribe to multiple symbols over a single connection.
   */
  protected async doConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.log.info('Connecting to Binance WebSocket...');

      this.ws = new WebSocket(BINANCE_WS_URL);

      // Connection established
      this.ws.on('open', () => {
        this.log.info('WebSocket connection established');
        this.startHeartbeat();
        resolve();
      });

      // Handle incoming messages
      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      // Handle errors
      this.ws.on('error', (error: Error) => {
        this.log.error({ error }, 'WebSocket error');

        // If we're still connecting, reject the promise
        if (this._state === 'connecting') {
          reject(error);
        } else {
          // Otherwise emit error for circuit breaker
          this.emitError({
            type: 'connection_lost',
            message: error.message,
            source: this.name,
            timestamp: Date.now(),
            retryable: true,
            originalError: error,
          });
        }
      });

      // Handle connection close
      this.ws.on('close', (code: number, reason: Buffer) => {
        this.log.warn({ code, reason: reason.toString() }, 'WebSocket closed');
        this.stopHeartbeat();

        // Only handle reconnection if we were connected
        if (this._state === 'connected') {
          this.handleConnectionLost(new Error(`WebSocket closed: ${code}`));
        }
      });

      // Timeout for initial connection
      const timeout = setTimeout(() => {
        if (this._state === 'connecting') {
          this.ws?.close();
          reject(new Error('Connection timeout'));
        }
      }, 10000);

      this.ws.on('open', () => clearTimeout(timeout));
    });
  }

  /**
   * Disconnect from Binance WebSocket.
   */
  protected async doDisconnect(): Promise<void> {
    this.stopHeartbeat();
    this.activeStreams.clear();

    if (this.ws) {
      // Send unsubscribe for all streams before closing
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
  }

  /**
   * Subscribe to symbol streams.
   *
   * Binance uses a JSON-RPC style subscription model:
   * { "method": "SUBSCRIBE", "params": ["btcusdt@miniTicker"], "id": 1 }
   */
  protected async doSubscribe(symbols: string[]): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    // Convert internal symbols to Binance stream names
    // We use @ticker for detailed bid/ask data
    const streams = symbols
      .map(s => {
        const binanceSymbol = INTERNAL_TO_BINANCE.get(s);
        if (!binanceSymbol) {
          this.log.warn({ symbol: s }, 'No Binance mapping for symbol');
          return null;
        }
        return `${binanceSymbol}@ticker`;
      })
      .filter(Boolean) as string[];

    if (streams.length === 0) {
      this.log.warn('No valid streams to subscribe to');
      return;
    }

    const subscriptionMessage = {
      method: 'SUBSCRIBE',
      params: streams,
      id: ++this.subscriptionId,
    };

    this.log.info({ streams, id: this.subscriptionId }, 'Sending subscription request');
    this.ws.send(JSON.stringify(subscriptionMessage));

    // Track active streams
    streams.forEach(s => this.activeStreams.add(s));
  }

  /**
   * Unsubscribe from symbol streams.
   */
  protected async doUnsubscribe(symbols: string[]): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const streams = symbols
      .map(s => {
        const binanceSymbol = INTERNAL_TO_BINANCE.get(s);
        return binanceSymbol ? `${binanceSymbol}@ticker` : null;
      })
      .filter(Boolean) as string[];

    if (streams.length === 0) return;

    const unsubscribeMessage = {
      method: 'UNSUBSCRIBE',
      params: streams,
      id: ++this.subscriptionId,
    };

    this.log.info({ streams }, 'Sending unsubscription request');
    this.ws.send(JSON.stringify(unsubscribeMessage));

    streams.forEach(s => this.activeStreams.delete(s));
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  /**
   * Handle incoming WebSocket message.
   *
   * Messages can be:
   * 1. Subscription confirmations (we ignore these)
   * 2. Stream data (ticker updates)
   * 3. Pong responses (heartbeat)
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());

      // Subscription response (has "result" field)
      if ('result' in message) {
        this.log.debug({ id: message.id, result: message.result }, 'Subscription response');
        return;
      }

      // Stream data (has "stream" and "data" fields)
      if ('stream' in message && 'data' in message) {
        this.handleStreamData(message as BinanceStreamMessage);
        return;
      }

      // Unknown message type
      this.log.debug({ message }, 'Unknown message type');
    } catch (error) {
      this.log.error({ error, rawData: data.toString().slice(0, 200) }, 'Failed to parse message');
      this.emitError({
        type: 'parse_error',
        message: 'Failed to parse Binance message',
        source: this.name,
        timestamp: Date.now(),
        retryable: false,
      });
    }
  }

  /**
   * Handle stream data message.
   * Convert Binance format to our normalized tick format.
   */
  private handleStreamData(message: BinanceStreamMessage): void {
    const { data } = message;

    // Get internal symbol from Binance symbol
    const binanceSymbol = data.s.toLowerCase();
    const internalSymbol = BINANCE_TO_INTERNAL.get(binanceSymbol);

    if (!internalSymbol) {
      // Unknown symbol - might be subscribed to something we don't track
      return;
    }

    // Build normalized tick
    // Handle both mini ticker and full ticker formats
    const tick: NormalizedTick = {
      symbol: internalSymbol,
      last: parseFloat(data.c),
      volume: parseFloat(data.v),
      timestamp: data.E,
      source: this.name,
    };

    // Full ticker has bid/ask
    if ('b' in data && 'a' in data) {
      const fullTicker = data as BinanceTicker;
      tick.bid = parseFloat(fullTicker.b);
      tick.ask = parseFloat(fullTicker.a);
      tick.changePercent = parseFloat(fullTicker.P);
    }

    // Emit the normalized tick
    this.emitTick(tick);
  }

  /**
   * Start heartbeat to keep connection alive.
   *
   * Binance requires a ping every 30 minutes, but we ping every
   * 30 seconds to detect connection issues faster.
   */
  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000);
  }

  /**
   * Stop heartbeat interval.
   */
  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
