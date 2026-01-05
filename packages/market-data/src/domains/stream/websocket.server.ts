/**
 * WebSocket Server
 * ================
 *
 * Client-facing WebSocket server for real-time price streaming.
 *
 * PROTOCOL:
 * Clients connect to ws://host:port and can:
 * 1. Subscribe to symbols: { type: "subscribe", symbols: ["BTC/USD", "ETH/USD"] }
 * 2. Unsubscribe: { type: "unsubscribe", symbols: ["BTC/USD"] }
 * 3. Ping for keepalive: { type: "ping" }
 *
 * Server sends:
 * 1. Tick updates: { type: "tick", data: { symbol, last, bid, ask, ... } }
 * 2. Subscription confirmations: { type: "subscribed", symbols: [...] }
 * 3. Errors: { type: "error", code: "...", message: "..." }
 *
 * HEARTBEAT:
 * Server pings all clients every 30 seconds.
 * Clients that don't respond are disconnected.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { ConnectionManager, type ExtendedWebSocket } from './connection.manager.js';
import { SubscriptionManager } from './subscription.manager.js';
import { TickPublisher } from './tick.publisher.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import type { ClientMessage, ServerMessage, PongMessage } from './stream.types.js';

const log = logger.child({ component: 'websocket-server' });

/** Heartbeat interval in milliseconds */
const HEARTBEAT_INTERVAL_MS = 30000;

/**
 * WebSocket server for price streaming.
 */
export class MarketDataWebSocketServer {
  private wss: WebSocketServer | null = null;
  private connectionManager: ConnectionManager;
  private subscriptionManager: SubscriptionManager;
  private tickPublisher: TickPublisher;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.connectionManager = new ConnectionManager();
    this.subscriptionManager = new SubscriptionManager(this.connectionManager);
    this.tickPublisher = new TickPublisher(this.connectionManager);
  }

  /**
   * Start the WebSocket server.
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({
          port: env.WS_PORT,
          // Path for the WebSocket endpoint
          path: '/ws',
        });

        this.wss.on('connection', (ws: WebSocket) => {
          this.handleConnection(ws);
        });

        this.wss.on('error', (error: Error) => {
          log.error({ error }, 'WebSocket server error');
        });

        this.wss.on('listening', () => {
          log.info({ port: env.WS_PORT }, 'WebSocket server listening');

          // Start heartbeat
          this.startHeartbeat();

          resolve();
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
    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Close all connections
    if (this.wss) {
      for (const client of this.wss.clients) {
        client.close(1001, 'Server shutting down');
      }

      await new Promise<void>((resolve) => {
        this.wss!.close(() => {
          log.info('WebSocket server closed');
          resolve();
        });
      });

      this.wss = null;
    }
  }

  /**
   * Get the tick publisher for use by the data pipeline.
   */
  getPublisher(): TickPublisher {
    return this.tickPublisher;
  }

  /**
   * Get server statistics.
   */
  getStats(): {
    connections: ReturnType<ConnectionManager['getStats']>;
    isRunning: boolean;
  } {
    return {
      connections: this.connectionManager.getStats(),
      isRunning: this.wss !== null,
    };
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  /**
   * Handle a new client connection.
   */
  private handleConnection(ws: WebSocket): void {
    const clientId = this.connectionManager.addClient(ws);

    // Set up message handler
    ws.on('message', (data: Buffer | string) => {
      this.handleMessage(clientId, data);
    });

    // Set up close handler
    ws.on('close', () => {
      this.connectionManager.removeClient(clientId);
    });

    // Set up error handler
    ws.on('error', (error: Error) => {
      log.debug({ error, clientId }, 'Client WebSocket error');
    });

    // Set up pong handler (for heartbeat)
    ws.on('pong', () => {
      const extWs = ws as ExtendedWebSocket;
      extWs.isAlive = true;
    });

    // Send welcome message with available symbols
    this.sendToClient(clientId, {
      type: 'snapshot',
      timestamp: Date.now(),
      data: {}, // Empty snapshot, client should subscribe first
    });
  }

  /**
   * Handle an incoming message from a client.
   */
  private handleMessage(clientId: string, data: unknown): void {
    try {
      const messageStr = data instanceof Buffer ? data.toString() : String(data);
      const message = JSON.parse(messageStr) as ClientMessage;

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(clientId, message.symbols);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(clientId, message.symbols);
          break;

        case 'ping':
          this.handlePing(clientId);
          break;

        default:
          this.sendError(clientId, 'UNKNOWN_MESSAGE_TYPE', 'Unknown message type');
      }
    } catch (error) {
      log.debug({ error, clientId }, 'Failed to parse client message');
      this.sendError(clientId, 'PARSE_ERROR', 'Failed to parse message');
    }
  }

  /**
   * Handle subscribe request.
   */
  private handleSubscribe(clientId: string, symbols: string[]): void {
    const response = this.subscriptionManager.handleSubscribe(clientId, symbols);
    this.sendToClient(clientId, response);
  }

  /**
   * Handle unsubscribe request.
   */
  private handleUnsubscribe(clientId: string, symbols: string[]): void {
    const response = this.subscriptionManager.handleUnsubscribe(clientId, symbols);
    this.sendToClient(clientId, response);
  }

  /**
   * Handle ping request.
   */
  private handlePing(clientId: string): void {
    const response: PongMessage = {
      type: 'pong',
      timestamp: Date.now(),
    };
    this.sendToClient(clientId, response);
  }

  /**
   * Send a message to a client.
   */
  private sendToClient(clientId: string, message: ServerMessage): void {
    this.connectionManager.sendToClient(clientId, message);
  }

  /**
   * Send an error to a client.
   */
  private sendError(clientId: string, code: string, message: string): void {
    this.sendToClient(clientId, {
      type: 'error',
      code,
      message,
      timestamp: Date.now(),
    });
  }

  /**
   * Start the heartbeat interval.
   *
   * HEARTBEAT PATTERN:
   * 1. Server sends ping to all clients
   * 2. Clients respond with pong (handled by ws library)
   * 3. On next heartbeat, check if pong was received
   * 4. Terminate clients that didn't respond
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const clients = this.connectionManager.getAllClients();

      for (const client of clients) {
        // Check if client responded to last ping
        if (!client.isAlive) {
          log.debug({ clientId: client.clientId }, 'Client failed heartbeat, terminating');
          client.terminate();
          this.connectionManager.removeClient(client.clientId);
          continue;
        }

        // Mark as not alive, will be set to true on pong
        client.isAlive = false;

        // Send ping
        client.ping();
      }
    }, HEARTBEAT_INTERVAL_MS);
  }
}
