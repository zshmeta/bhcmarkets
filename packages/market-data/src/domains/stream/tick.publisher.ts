/**
 * Tick Publisher
 * ==============
 *
 * Publishes price ticks to subscribed WebSocket clients.
 *
 * DESIGN:
 * This is the "output" side of the market data pipeline.
 * Ticks flow: Collector -> Normalizer -> Cache -> Publisher -> Clients
 *
 * OPTIMIZATION:
 * Instead of sending every single tick, we throttle updates per symbol
 * to avoid overwhelming clients (especially on mobile).
 */

import { ConnectionManager } from './connection.manager.js';
import { logger } from '../../utils/logger.js';
import type { EnrichedTick } from '../normalizer/normalizer.types.js';
import type { TickMessage } from './stream.types.js';

const log = logger.child({ component: 'tick-publisher' });

/**
 * Minimum interval between tick updates per symbol (ms).
 * We won't send more than one update per symbol in this window.
 *
 * WHY THROTTLE:
 * - Binance sends ticks every ~100ms per symbol
 * - Clients don't need sub-second updates for display
 * - Reduces bandwidth and client CPU usage
 * - 250ms = 4 updates/second is plenty for smooth UI
 */
const MIN_UPDATE_INTERVAL_MS = 250;

/**
 * Tick publisher for WebSocket clients.
 */
export class TickPublisher {
  private connectionManager: ConnectionManager;

  /** Track last update time per symbol for throttling */
  private lastUpdateTime = new Map<string, number>();

  /** Metrics */
  private publishedCount = 0;
  private throttledCount = 0;

  constructor(connectionManager: ConnectionManager) {
    this.connectionManager = connectionManager;

    // Log metrics every minute
    setInterval(() => {
      if (this.publishedCount > 0 || this.throttledCount > 0) {
        log.debug({
          published: this.publishedCount,
          throttled: this.throttledCount,
          stats: this.connectionManager.getStats(),
        }, 'Publisher metrics');
      }
      this.publishedCount = 0;
      this.throttledCount = 0;
    }, 60000);
  }

  /**
   * Publish a tick to all subscribed clients.
   *
   * @param tick - Enriched tick to publish
   * @returns Number of clients that received the tick
   */
  publish(tick: EnrichedTick): number {
    // Check throttling
    const lastUpdate = this.lastUpdateTime.get(tick.symbol);
    const now = Date.now();

    if (lastUpdate && now - lastUpdate < MIN_UPDATE_INTERVAL_MS) {
      this.throttledCount++;
      return 0;
    }

    // Update throttle tracker
    this.lastUpdateTime.set(tick.symbol, now);

    // Get subscribers for this symbol
    const subscribers = this.connectionManager.getSubscribers(tick.symbol);

    if (subscribers.size === 0) {
      return 0;
    }

    // Build tick message
    const message: TickMessage = {
      type: 'tick',
      timestamp: tick.timestamp,
      data: {
        symbol: tick.symbol,
        last: tick.last,
        bid: tick.bid,
        ask: tick.ask,
        changePercent: tick.changePercent,
        volume: tick.volume,
      },
    };

    // Broadcast to subscribers
    const sent = this.connectionManager.broadcastToSymbol(tick.symbol, message);

    this.publishedCount += sent;

    return sent;
  }

  /**
   * Publish multiple ticks (batch).
   */
  publishBatch(ticks: EnrichedTick[]): number {
    let total = 0;
    for (const tick of ticks) {
      total += this.publish(tick);
    }
    return total;
  }

  /**
   * Get the minimum update interval (for client info).
   */
  getMinUpdateInterval(): number {
    return MIN_UPDATE_INTERVAL_MS;
  }

  /**
   * Clear throttle state (for testing or reset).
   */
  clearThrottleState(): void {
    this.lastUpdateTime.clear();
  }
}
