/**
 * Connection Manager
 * ==================
 *
 * Manages WebSocket client connections and their subscriptions.
 *
 * RESPONSIBILITIES:
 * - Track connected clients
 * - Manage client subscriptions
 * - Route messages to appropriate clients
 * - Handle client disconnect cleanup
 */

import { WebSocket } from 'ws';
import { logger } from '../../utils/logger.js';
import { SYMBOL_MAP } from '../../config/symbols.js';
import type { ClientSubscription } from './stream.types.js';

const log = logger.child({ component: 'connection-manager' });

/**
 * Extended WebSocket with our custom properties.
 * We extend the WebSocket class and add custom properties.
 */
export interface ExtendedWebSocket extends WebSocket {
  /** Unique client identifier */
  clientId: string;

  /** Is this connection still alive (for ping/pong) */
  isAlive: boolean;
}

/**
 * Connection manager for WebSocket clients.
 */
export class ConnectionManager {
  /** Map of client ID to WebSocket */
  private clients = new Map<string, ExtendedWebSocket>();

  /** Map of client ID to subscription info */
  private subscriptions = new Map<string, ClientSubscription>();

  /** Map of symbol to subscribed client IDs (for efficient broadcast) */
  private symbolToClients = new Map<string, Set<string>>();

  /** Counter for generating client IDs */
  private clientIdCounter = 0;

  /**
   * Register a new client connection.
   *
   * @param ws - The WebSocket connection
   * @returns Client ID
   */
  addClient(ws: WebSocket): string {
    const clientId = this.generateClientId();
    const extWs = ws as ExtendedWebSocket;

    extWs.clientId = clientId;
    extWs.isAlive = true;

    this.clients.set(clientId, extWs);
    this.subscriptions.set(clientId, {
      clientId,
      symbols: new Set(),
      connectedAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    log.info({ clientId, totalClients: this.clients.size }, 'Client connected');

    return clientId;
  }

  /**
   * Remove a client connection.
   *
   * @param clientId - Client to remove
   */
  removeClient(clientId: string): void {
    const subscription = this.subscriptions.get(clientId);

    // Remove from symbol mappings
    if (subscription) {
      for (const symbol of subscription.symbols) {
        const clients = this.symbolToClients.get(symbol);
        if (clients) {
          clients.delete(clientId);
          if (clients.size === 0) {
            this.symbolToClients.delete(symbol);
          }
        }
      }
    }

    this.clients.delete(clientId);
    this.subscriptions.delete(clientId);

    log.info({ clientId, totalClients: this.clients.size }, 'Client disconnected');
  }

  /**
   * Get a client's WebSocket by ID.
   */
  getClient(clientId: string): ExtendedWebSocket | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Subscribe a client to symbols.
   *
   * @param clientId - Client ID
   * @param symbols - Symbols to subscribe to
   * @returns Actually subscribed symbols (valid ones)
   */
  subscribe(clientId: string, symbols: string[]): string[] {
    const subscription = this.subscriptions.get(clientId);
    if (!subscription) return [];

    const subscribed: string[] = [];

    for (const symbol of symbols) {
      // Validate symbol exists
      if (!SYMBOL_MAP.has(symbol)) {
        log.debug({ clientId, symbol }, 'Invalid symbol subscription attempt');
        continue;
      }

      // Skip if already subscribed
      if (subscription.symbols.has(symbol)) continue;

      // Add to client's subscriptions
      subscription.symbols.add(symbol);

      // Add to symbol->clients mapping
      if (!this.symbolToClients.has(symbol)) {
        this.symbolToClients.set(symbol, new Set());
      }
      this.symbolToClients.get(symbol)!.add(clientId);

      subscribed.push(symbol);
    }

    subscription.lastActiveAt = Date.now();

    log.debug({
      clientId,
      subscribed,
      totalSymbols: subscription.symbols.size,
    }, 'Client subscribed');

    return subscribed;
  }

  /**
   * Unsubscribe a client from symbols.
   *
   * @param clientId - Client ID
   * @param symbols - Symbols to unsubscribe from
   * @returns Actually unsubscribed symbols
   */
  unsubscribe(clientId: string, symbols: string[]): string[] {
    const subscription = this.subscriptions.get(clientId);
    if (!subscription) return [];

    const unsubscribed: string[] = [];

    for (const symbol of symbols) {
      if (!subscription.symbols.has(symbol)) continue;

      subscription.symbols.delete(symbol);

      const clients = this.symbolToClients.get(symbol);
      if (clients) {
        clients.delete(clientId);
        if (clients.size === 0) {
          this.symbolToClients.delete(symbol);
        }
      }

      unsubscribed.push(symbol);
    }

    subscription.lastActiveAt = Date.now();

    return unsubscribed;
  }

  /**
   * Get all client IDs subscribed to a symbol.
   * Used for broadcasting tick updates.
   *
   * @param symbol - Symbol to check
   * @returns Set of client IDs
   */
  getSubscribers(symbol: string): Set<string> {
    return this.symbolToClients.get(symbol) || new Set();
  }

  /**
   * Send a message to a specific client.
   */
  sendToClient(clientId: string, message: object): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.send(JSON.stringify(message));
      return true;
    } catch (error) {
      log.error({ error, clientId }, 'Failed to send message');
      return false;
    }
  }

  /**
   * Broadcast a message to all subscribers of a symbol.
   *
   * @param symbol - Symbol to broadcast for
   * @param message - Message to send
   * @returns Number of clients that received the message
   */
  broadcastToSymbol(symbol: string, message: object): number {
    const subscribers = this.getSubscribers(symbol);
    let sent = 0;

    const messageStr = JSON.stringify(message);

    for (const clientId of subscribers) {
      const client = this.clients.get(clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          sent++;
        } catch (error) {
          log.debug({ error, clientId }, 'Failed to broadcast to client');
        }
      }
    }

    return sent;
  }

  /**
   * Broadcast a message to all connected clients.
   */
  broadcastToAll(message: object): number {
    let sent = 0;
    const messageStr = JSON.stringify(message);

    for (const client of this.clients.values()) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          sent++;
        } catch (error) {
          // Ignore individual send failures
        }
      }
    }

    return sent;
  }

  /**
   * Get all connected clients (for ping/pong health check).
   */
  getAllClients(): ExtendedWebSocket[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get client subscription info.
   */
  getSubscription(clientId: string): ClientSubscription | undefined {
    return this.subscriptions.get(clientId);
  }

  /**
   * Get statistics about connections.
   */
  getStats(): {
    totalClients: number;
    totalSubscriptions: number;
    symbolsWithSubscribers: number;
  } {
    let totalSubscriptions = 0;
    for (const sub of this.subscriptions.values()) {
      totalSubscriptions += sub.symbols.size;
    }

    return {
      totalClients: this.clients.size,
      totalSubscriptions,
      symbolsWithSubscribers: this.symbolToClients.size,
    };
  }

  /**
   * Generate a unique client ID.
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${++this.clientIdCounter}`;
  }
}
