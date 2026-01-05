/**
 * Metrics Collector
 * =================
 *
 * Collects and aggregates metrics from all components.
 *
 * NOTE: This is a simple in-memory metrics implementation.
 * For production, you'd integrate with Prometheus, DataDog, etc.
 */

import { logger } from '../../utils/logger.js';
import type { Metrics } from './health.types.js';

const log = logger.child({ component: 'metrics' });

/**
 * Simple metrics collector.
 */
class MetricsCollector {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();

  /**
   * Increment a counter.
   */
  increment(name: string, value = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  /**
   * Set a gauge value.
   */
  gauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  /**
   * Get a counter value.
   */
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  /**
   * Get a gauge value.
   */
  getGauge(name: string): number {
    return this.gauges.get(name) || 0;
  }

  /**
   * Get all metrics as an object.
   */
  getAll(): Metrics {
    return {
      // Counters
      ticksReceived: this.getCounter('ticks.received'),
      ticksPublished: this.getCounter('ticks.published'),
      candlesClosed: this.getCounter('candles.closed'),
      wsMessagesReceived: this.getCounter('ws.messages.received'),
      wsMessagesSent: this.getCounter('ws.messages.sent'),
      errors: this.getCounter('errors'),

      // Gauges
      wsConnections: this.getGauge('ws.connections'),
      activeSubscriptions: this.getGauge('ws.subscriptions'),
      cacheHitRate: this.getGauge('cache.hitrate'),
      tickLatencyMs: this.getGauge('tick.latency'),
    };
  }

  /**
   * Reset all metrics.
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
  }
}

/**
 * Global metrics instance.
 */
export const metrics = new MetricsCollector();
