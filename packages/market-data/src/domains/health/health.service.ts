/**
 * Health Service
 * ==============
 *
 * Provides health check endpoints and aggregates component status.
 */

import { logger } from '../../utils/logger.js';
import { metrics } from './metrics.collector.js';
import type { ServiceHealth } from './health.types.js';

const log = logger.child({ component: 'health-service' });

/**
 * Component health providers.
 * These are set during service initialization.
 */
interface HealthProviders {
  getCollectorHealth: () => {
    status: 'healthy' | 'degraded' | 'unhealthy';
    totalTicksPerMinute: number;
    collectors: {
      name: string;
      state: string;
      ticksPerMinute: number;
      lastTickAt?: number;
    }[];
  };
  getCacheHealth: () => {
    redisConnected: boolean;
    usingFallback: boolean;
    hitRate: number;
  };
  getWebSocketHealth: () => {
    isRunning: boolean;
    connections: number;
    subscriptions: number;
  };
  getDatabaseHealth: () => Promise<boolean>;
}

/**
 * Health service for monitoring and diagnostics.
 */
export class HealthService {
  private startTime = Date.now();
  private providers: Partial<HealthProviders> = {};

  /**
   * Register health providers.
   */
  setProviders(providers: Partial<HealthProviders>): void {
    this.providers = { ...this.providers, ...providers };
  }

  /**
   * Get full health status.
   */
  async getHealth(): Promise<ServiceHealth> {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    // Get component health
    const collectorHealth = this.providers.getCollectorHealth?.() || {
      status: 'unhealthy' as const,
      totalTicksPerMinute: 0,
      collectors: [],
    };

    const cacheHealth = this.providers.getCacheHealth?.() || {
      redisConnected: false,
      usingFallback: true,
      hitRate: 0,
    };

    const wsHealth = this.providers.getWebSocketHealth?.() || {
      isRunning: false,
      connections: 0,
      subscriptions: 0,
    };

    let dbConnected = false;
    try {
      dbConnected = await this.providers.getDatabaseHealth?.() || false;
    } catch (error) {
      log.error({ error }, 'Database health check failed');
    }

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (collectorHealth.status === 'unhealthy' || !wsHealth.isRunning) {
      overallStatus = 'unhealthy';
    } else if (collectorHealth.status === 'degraded' || !cacheHealth.redisConnected) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      uptime,
      timestamp: Date.now(),
      components: {
        collectors: {
          status: collectorHealth.status,
          details: collectorHealth.collectors.map(c => ({
            name: c.name,
            state: c.state,
            ticksPerMinute: c.ticksPerMinute,
            lastTickAt: c.lastTickAt,
          })),
        },
        cache: {
          status: cacheHealth.redisConnected || cacheHealth.usingFallback ? 'healthy' : 'unhealthy',
          redisConnected: cacheHealth.redisConnected,
          usingFallback: cacheHealth.usingFallback,
        },
        websocket: {
          status: wsHealth.isRunning ? 'healthy' : 'unhealthy',
          isRunning: wsHealth.isRunning,
          connections: wsHealth.connections,
        },
        database: {
          status: dbConnected ? 'healthy' : 'unhealthy',
          connected: dbConnected,
        },
      },
      metrics: {
        ticksPerMinute: collectorHealth.totalTicksPerMinute,
        candlesPerMinute: metrics.getCounter('candles.closed'),
        wsConnections: wsHealth.connections,
        activeSubscriptions: wsHealth.subscriptions,
      },
    };
  }

  /**
   * Simple liveness check (is the service running?).
   */
  isLive(): boolean {
    return true;
  }

  /**
   * Readiness check (is the service ready to serve traffic?).
   */
  async isReady(): Promise<boolean> {
    const health = await this.getHealth();
    return health.status !== 'unhealthy';
  }
}
