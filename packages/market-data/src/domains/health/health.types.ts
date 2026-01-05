/**
 * Health Types
 * ============
 *
 * Types for health monitoring and metrics.
 */

/**
 * Overall service health status.
 */
export interface ServiceHealth {
  /** Overall status */
  status: 'healthy' | 'degraded' | 'unhealthy';

  /** Service uptime in seconds */
  uptime: number;

  /** Timestamp of this health check */
  timestamp: number;

  /** Component-level health */
  components: {
    collectors: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      details: {
        name: string;
        state: string;
        ticksPerMinute: number;
        lastTickAt?: number;
      }[];
    };
    cache: {
      status: 'healthy' | 'unhealthy';
      redisConnected: boolean;
      usingFallback: boolean;
    };
    websocket: {
      status: 'healthy' | 'unhealthy';
      isRunning: boolean;
      connections: number;
    };
    database: {
      status: 'healthy' | 'unhealthy';
      connected: boolean;
    };
  };

  /** Metrics snapshot */
  metrics: {
    ticksPerMinute: number;
    candlesPerMinute: number;
    wsConnections: number;
    activeSubscriptions: number;
  };
}

/**
 * Metrics for Prometheus/monitoring export.
 */
export interface Metrics {
  // Counters
  ticksReceived: number;
  ticksPublished: number;
  candlesClosed: number;
  wsMessagesReceived: number;
  wsMessagesSent: number;
  errors: number;

  // Gauges
  wsConnections: number;
  activeSubscriptions: number;
  cacheHitRate: number;

  // Histograms (would need proper implementation)
  tickLatencyMs: number;
}
