/**
 * Metrics Collector
 * =================
 *
 * Collects and aggregates metrics from all components.
 *
 * FEATURES:
 * - In-memory counters and gauges
 * - Prometheus text format export for scraping
 * - Simple API for incrementing and setting values
 *
 * USAGE:
 * ```typescript
 * metrics.increment('ticks.received');
 * metrics.gauge('ws.connections', 42);
 * const prometheusText = metrics.toPrometheusText();
 * ```
 */

import { logger } from '../../utils/logger.js';
import type { Metrics } from '@repo/sdk';

const log = logger.child({ component: 'metrics' });

/**
 * Metric descriptions for Prometheus HELP text.
 */
const METRIC_DESCRIPTIONS: Record<string, string> = {
  'ticks.received': 'Total number of ticks received from data sources',
  'ticks.published': 'Total number of ticks published to WebSocket clients',
  'candles.closed': 'Total number of candles completed and persisted',
  'ws.messages.received': 'Total WebSocket messages received from clients',
  'ws.messages.sent': 'Total WebSocket messages sent to clients',
  'errors': 'Total number of errors encountered',
  'ws.connections': 'Current number of active WebSocket connections',
  'ws.subscriptions': 'Current number of active symbol subscriptions',
  'cache.hitrate': 'Cache hit rate percentage',
  'tick.latency': 'Average tick processing latency in milliseconds',
};

/**
 * Simple metrics collector with Prometheus export support.
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
   * Export metrics in Prometheus text format.
   *
   * This format is compatible with Prometheus scraping.
   * Each metric includes TYPE and HELP annotations.
   *
   * @returns Prometheus exposition format text
   */
  toPrometheusText(): string {
    const lines: string[] = [];
    const prefix = 'market_data';

    // Export counters
    for (const [name, value] of this.counters) {
      const metricName = `${prefix}_${name.replace(/\./g, '_')}_total`;
      const description = METRIC_DESCRIPTIONS[name] || name;

      lines.push(`# HELP ${metricName} ${description}`);
      lines.push(`# TYPE ${metricName} counter`);
      lines.push(`${metricName} ${value}`);
      lines.push('');
    }

    // Export gauges
    for (const [name, value] of this.gauges) {
      const metricName = `${prefix}_${name.replace(/\./g, '_')}`;
      const description = METRIC_DESCRIPTIONS[name] || name;

      lines.push(`# HELP ${metricName} ${description}`);
      lines.push(`# TYPE ${metricName} gauge`);
      lines.push(`${metricName} ${value}`);
      lines.push('');
    }

    // Add process metrics
    lines.push(`# HELP ${prefix}_process_uptime_seconds Process uptime in seconds`);
    lines.push(`# TYPE ${prefix}_process_uptime_seconds gauge`);
    lines.push(`${prefix}_process_uptime_seconds ${Math.floor(process.uptime())}`);
    lines.push('');

    lines.push(`# HELP ${prefix}_process_memory_heap_bytes Process heap memory in bytes`);
    lines.push(`# TYPE ${prefix}_process_memory_heap_bytes gauge`);
    lines.push(`${prefix}_process_memory_heap_bytes ${process.memoryUsage().heapUsed}`);

    return lines.join('\n');
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
