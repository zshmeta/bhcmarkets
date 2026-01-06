/**
 * WebSocket Server
 * ================
 *
 * Real-time WebSocket server for:
 * - Order book updates
 * - Trade notifications
 * - Order status updates
 *
 * PROTOCOL:
 * - Client sends: subscribe/unsubscribe messages
 * - Server sends: incremental updates, snapshots
 *
 * CHANNELS:
 * - orderbook:{symbol} - Order book depth updates
 * - trades:{symbol} - Real-time trade feed
 * - orders:{accountId} - Private order updates
 */

import { WebSocketServer, WebSocket, type RawData } from 'ws';
import { createServer, type Server as HttpServer } from 'http';
import type {
  ClientMessage,
  ServerMessage,
  OrderBookUpdateMessage,
  TradeMessage,
  OrderUpdateMessage,
} from '../../types/order.types.js';
import type { OrderBookSnapshot, OrderBookUpdate } from '../matching/order-book.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

const log = logger.child({ component: 'websocket-server' });

// ============================================================================
// TYPES
// ============================================================================

interface ClientConnection {
  ws: WebSocket;
  subscriptions: Set<string>;
  accountId?: string;
  isAlive: boolean;
  connectedAt: number;
}

interface BroadcastMetrics {
  messagesSent: number;
  messagesDropped: number;
  lastBroadcast: number;
}

// ============================================================================
// WEBSOCKET SERVER
// ============================================================================

export class OrderEngineWebSocket {
  private wss: WebSocketServer | null = null;
  private httpServer: HttpServer | null = null;
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private channelSubscribers: Map<string, Set<WebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metrics: BroadcastMetrics = {
    messagesSent: 0,
    messagesDropped: 0,
    lastBroadcast: 0,
  };

  // Callbacks for getting data
  private getOrderBookSnapshot?: (symbol: string, depth?: number) => OrderBookSnapshot | null;

  constructor() {}

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Start the WebSocket server.
   */
  async start(port: number = env.WS_PORT): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.httpServer = createServer((req, res) => {
          // Simple health check endpoint
          if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              status: 'healthy',
              clients: this.clients.size,
              channels: this.channelSubscribers.size,
            }));
            return;
          }
          res.writeHead(404);
          res.end();
        });

        this.wss = new WebSocketServer({ server: this.httpServer });

        this.wss.on('connection', this.handleConnection.bind(this));
        this.wss.on('error', (error) => {
          log.error({ error }, 'WebSocket server error');
        });

        this.httpServer.listen(port, () => {
          log.info({ port }, 'WebSocket server started');

          // Start heartbeat
          this.heartbeatInterval = setInterval(() => {
            this.checkHeartbeats();
          }, 30000);

          resolve();
        });

        this.httpServer.on('error', (error) => {
          log.error({ error }, 'HTTP server error');
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the WebSocket server.
   */
  async stop(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all client connections
    for (const [ws, client] of this.clients) {
      ws.close(1001, 'Server shutting down');
    }
    this.clients.clear();
    this.channelSubscribers.clear();

    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          if (this.httpServer) {
            this.httpServer.close(() => {
              log.info('WebSocket server stopped');
              resolve();
            });
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /**
   * Set callback for getting order book snapshots.
   */
  setSnapshotProvider(
    provider: (symbol: string, depth?: number) => OrderBookSnapshot | null
  ): void {
    this.getOrderBookSnapshot = provider;
  }

  // ===========================================================================
  // BROADCASTING
  // ===========================================================================

  /**
   * Broadcast order book update to subscribers.
   */
  broadcastOrderBookUpdate(symbol: string, update: OrderBookUpdate): void {
    const channel = `orderbook:${symbol}`;
    const message: OrderBookUpdateMessage = {
      type: 'orderbook_update',
      symbol,
      data: update,
      timestamp: Date.now(),
    };

    this.broadcastToChannel(channel, message);
  }

  /**
   * Broadcast full order book snapshot.
   */
  broadcastOrderBookSnapshot(symbol: string, snapshot: OrderBookSnapshot): void {
    const channel = `orderbook:${symbol}`;
    const message: ServerMessage = {
      type: 'orderbook_snapshot',
      symbol,
      data: snapshot,
      timestamp: Date.now(),
    };

    this.broadcastToChannel(channel, message);
  }

  /**
   * Broadcast trade to subscribers.
   */
  broadcastTrade(symbol: string, trade: {
    price: number;
    quantity: number;
    timestamp: number;
    makerSide: 'buy' | 'sell';
  }): void {
    const channel = `trades:${symbol}`;
    const message: TradeMessage = {
      type: 'trade',
      symbol,
      data: trade,
      timestamp: Date.now(),
    };

    this.broadcastToChannel(channel, message);
  }

  /**
   * Send private order update to specific account.
   */
  sendOrderUpdate(accountId: string, update: {
    orderId: string;
    status: string;
    filledQuantity?: number;
    remainingQuantity?: number;
  }): void {
    const channel = `orders:${accountId}`;
    const message: OrderUpdateMessage = {
      type: 'order_update',
      data: update,
      timestamp: Date.now(),
    };

    this.broadcastToChannel(channel, message);
  }

  // ===========================================================================
  // METRICS
  // ===========================================================================

  /**
   * Get server statistics.
   */
  getStats(): {
    clients: number;
    channels: number;
    metrics: BroadcastMetrics;
    subscriptions: Record<string, number>;
  } {
    const subscriptions: Record<string, number> = {};

    for (const [channel, subscribers] of this.channelSubscribers) {
      subscriptions[channel] = subscribers.size;
    }

    return {
      clients: this.clients.size,
      channels: this.channelSubscribers.size,
      metrics: { ...this.metrics },
      subscriptions,
    };
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private handleConnection(ws: WebSocket, request: any): void {
    const clientIp = request.socket.remoteAddress;

    const client: ClientConnection = {
      ws,
      subscriptions: new Set(),
      isAlive: true,
      connectedAt: Date.now(),
    };

    this.clients.set(ws, client);
    log.info({ clientIp, total: this.clients.size }, 'Client connected');

    // Send welcome message
    this.send(ws, {
      type: 'connected',
      data: { message: 'Connected to Order Engine WebSocket' },
      timestamp: Date.now(),
    });

    ws.on('message', (data) => this.handleMessage(ws, client, data));
    ws.on('close', () => this.handleClose(ws, client));
    ws.on('error', (error) => this.handleError(ws, error));
    ws.on('pong', () => {
      client.isAlive = true;
    });
  }

  private handleMessage(ws: WebSocket, client: ClientConnection, data: RawData): void {
    try {
      const message: ClientMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(ws, client, message);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(ws, client, message);
          break;

        case 'ping':
          this.send(ws, { type: 'pong', timestamp: Date.now() });
          break;

        default:
          this.send(ws, {
            type: 'error',
            data: { message: 'Unknown message type' },
            timestamp: Date.now(),
          });
      }
    } catch (error) {
      log.warn({ error }, 'Failed to parse client message');
      this.send(ws, {
        type: 'error',
        data: { message: 'Invalid message format' },
        timestamp: Date.now(),
      });
    }
  }

  private handleSubscribe(ws: WebSocket, client: ClientConnection, message: any): void {
    const { channel, symbol, accountId } = message;

    // Build channel name
    let channelName: string;

    if (channel === 'orderbook' || channel === 'trades') {
      if (!symbol) {
        this.send(ws, {
          type: 'error',
          data: { message: 'Symbol required for channel subscription' },
          timestamp: Date.now(),
        });
        return;
      }
      channelName = `${channel}:${symbol}`;
    } else if (channel === 'orders') {
      if (!accountId) {
        this.send(ws, {
          type: 'error',
          data: { message: 'Account ID required for orders channel' },
          timestamp: Date.now(),
        });
        return;
      }
      channelName = `orders:${accountId}`;
      client.accountId = accountId;
    } else {
      this.send(ws, {
        type: 'error',
        data: { message: `Unknown channel: ${channel}` },
        timestamp: Date.now(),
      });
      return;
    }

    // Add to subscriptions
    client.subscriptions.add(channelName);

    // Add to channel subscribers
    let subscribers = this.channelSubscribers.get(channelName);
    if (!subscribers) {
      subscribers = new Set();
      this.channelSubscribers.set(channelName, subscribers);
    }
    subscribers.add(ws);

    log.debug({ channelName, total: subscribers.size }, 'Client subscribed');

    // Send confirmation
    this.send(ws, {
      type: 'subscribed',
      channel: channelName,
      timestamp: Date.now(),
    });

    // Send initial snapshot for orderbook
    if (channel === 'orderbook' && symbol && this.getOrderBookSnapshot) {
      const snapshot = this.getOrderBookSnapshot(symbol);
      if (snapshot) {
        this.send(ws, {
          type: 'orderbook_snapshot',
          symbol,
          data: snapshot,
          timestamp: Date.now(),
        });
      }
    }
  }

  private handleUnsubscribe(ws: WebSocket, client: ClientConnection, message: any): void {
    const { channel, symbol, accountId } = message;

    let channelName: string;
    if (channel === 'orderbook' || channel === 'trades') {
      channelName = `${channel}:${symbol}`;
    } else if (channel === 'orders') {
      channelName = `orders:${accountId || client.accountId}`;
    } else {
      return;
    }

    // Remove from subscriptions
    client.subscriptions.delete(channelName);

    // Remove from channel subscribers
    const subscribers = this.channelSubscribers.get(channelName);
    if (subscribers) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        this.channelSubscribers.delete(channelName);
      }
    }

    log.debug({ channelName }, 'Client unsubscribed');

    this.send(ws, {
      type: 'unsubscribed',
      channel: channelName,
      timestamp: Date.now(),
    });
  }

  private handleClose(ws: WebSocket, client: ClientConnection): void {
    // Remove from all channels
    for (const channelName of client.subscriptions) {
      const subscribers = this.channelSubscribers.get(channelName);
      if (subscribers) {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          this.channelSubscribers.delete(channelName);
        }
      }
    }

    this.clients.delete(ws);
    log.debug({ total: this.clients.size }, 'Client disconnected');
  }

  private handleError(ws: WebSocket, error: Error): void {
    log.error({ error }, 'WebSocket client error');
  }

  private broadcastToChannel(channel: string, message: ServerMessage): void {
    const subscribers = this.channelSubscribers.get(channel);
    if (!subscribers || subscribers.size === 0) return;

    const payload = JSON.stringify(message);
    this.metrics.lastBroadcast = Date.now();

    for (const ws of subscribers) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
          this.metrics.messagesSent++;
        } catch (error) {
          this.metrics.messagesDropped++;
        }
      }
    }
  }

  private send(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
        this.metrics.messagesSent++;
      } catch (error) {
        this.metrics.messagesDropped++;
      }
    }
  }

  private checkHeartbeats(): void {
    for (const [ws, client] of this.clients) {
      if (!client.isAlive) {
        ws.terminate();
        continue;
      }

      client.isAlive = false;
      ws.ping();
    }
  }
}
