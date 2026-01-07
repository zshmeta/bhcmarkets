/**
 * Health Service
 * ==============
 *
 * Monitors the health of all order engine components.
 */

import { isDatabaseConnected, getDbClient, isRedisConnected, isUsingFallback } from '@repo/database';
import { logger } from '../../utils/logger.js';

const log = logger.child({ component: 'health-service' });

// ============================================================================
// TYPES
// ============================================================================

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  message?: string;
  lastCheck: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  components: ComponentHealth[];
  timestamp: number;
}

export interface HealthMetrics {
  ordersProcessed: number;
  ordersRejected: number;
  tradesExecuted: number;
  avgProcessingTime: number;
  peakProcessingTime: number;
  lastOrderTime: number;
}

// ============================================================================
// HEALTH SERVICE
// ============================================================================

export class HealthService {
  private startTime: number = Date.now();
  private metrics: HealthMetrics = {
    ordersProcessed: 0,
    ordersRejected: 0,
    tradesExecuted: 0,
    avgProcessingTime: 0,
    peakProcessingTime: 0,
    lastOrderTime: 0,
  };

  private processingTimes: number[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private lastHealth: SystemHealth | null = null;

  constructor() {}

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Start periodic health checks.
   */
  start(intervalMs: number = 30000): void {
    this.checkInterval = setInterval(() => {
      this.performHealthCheck().catch((error) => {
        log.error({ error }, 'Health check failed');
      });
    }, intervalMs);

    log.info({ intervalMs }, 'Health service started');
  }

  /**
   * Stop health checks.
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    log.info('Health service stopped');
  }

  // ===========================================================================
  // METRICS RECORDING
  // ===========================================================================

  /**
   * Record an order processing event.
   */
  recordOrderProcessed(processingTimeMs: number): void {
    this.metrics.ordersProcessed++;
    this.metrics.lastOrderTime = Date.now();

    this.processingTimes.push(processingTimeMs);
    if (this.processingTimes.length > 1000) {
      this.processingTimes.shift();
    }

    this.metrics.avgProcessingTime =
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;

    if (processingTimeMs > this.metrics.peakProcessingTime) {
      this.metrics.peakProcessingTime = processingTimeMs;
    }
  }

  /**
   * Record an order rejection.
   */
  recordOrderRejected(): void {
    this.metrics.ordersRejected++;
  }

  /**
   * Record a trade execution.
   */
  recordTradeExecuted(): void {
    this.metrics.tradesExecuted++;
  }

  // ===========================================================================
  // HEALTH CHECKS
  // ===========================================================================

  /**
   * Perform a complete health check.
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const components: ComponentHealth[] = [];
    const now = Date.now();

    // Check database
    components.push(await this.checkDatabase());

    // Check Redis
    components.push(await this.checkRedis());

    // Check processing metrics
    components.push(this.checkProcessing());

    // Determine overall status
    const unhealthyCount = components.filter((c) => c.status === 'unhealthy').length;
    const degradedCount = components.filter((c) => c.status === 'degraded').length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      status = 'unhealthy';
    } else if (degradedCount > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    this.lastHealth = {
      status,
      uptime: now - this.startTime,
      components,
      timestamp: now,
    };

    return this.lastHealth;
  }

  /**
   * Get current health (cached or fresh).
   */
  async getHealth(forceRefresh: boolean = false): Promise<SystemHealth> {
    if (forceRefresh || !this.lastHealth || Date.now() - this.lastHealth.timestamp > 5000) {
      return this.performHealthCheck();
    }
    return this.lastHealth;
  }

  /**
   * Get current metrics.
   */
  getMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Get uptime in milliseconds.
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  // ===========================================================================
  // COMPONENT CHECKS
  // ===========================================================================

  private async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();

    try {
      const connected = await isDatabaseConnected();
      const latency = Date.now() - start;

      if (connected) {
        // Also test a simple query
        const sql = getDbClient();
        await sql`SELECT 1`;

        return {
          name: 'database',
          status: latency > 100 ? 'degraded' : 'healthy',
          latency,
          lastCheck: Date.now(),
        };
      }

      return {
        name: 'database',
        status: 'unhealthy',
        message: 'Database connection failed',
        lastCheck: Date.now(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - start,
        lastCheck: Date.now(),
      };
    }
  }

  private async checkRedis(): Promise<ComponentHealth> {
    const start = Date.now();

    try {
      const connected = await isRedisConnected();
      const latency = Date.now() - start;
      const usingFallback = isUsingFallback();

      if (usingFallback) {
        return {
          name: 'redis',
          status: 'degraded',
          message: 'Using in-memory fallback',
          lastCheck: Date.now(),
        };
      }

      if (connected) {
        return {
          name: 'redis',
          status: latency > 50 ? 'degraded' : 'healthy',
          latency,
          lastCheck: Date.now(),
        };
      }

      return {
        name: 'redis',
        status: 'unhealthy',
        message: 'Redis connection failed',
        lastCheck: Date.now(),
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - start,
        lastCheck: Date.now(),
      };
    }
  }

  private checkProcessing(): ComponentHealth {
    const { avgProcessingTime, peakProcessingTime, lastOrderTime } = this.metrics;

    // Check if processing is slow
    if (avgProcessingTime > 100) {
      return {
        name: 'processing',
        status: 'degraded',
        message: `High average processing time: ${avgProcessingTime.toFixed(2)}ms`,
        lastCheck: Date.now(),
      };
    }

    if (peakProcessingTime > 1000) {
      return {
        name: 'processing',
        status: 'degraded',
        message: `Peak processing time: ${peakProcessingTime}ms`,
        lastCheck: Date.now(),
      };
    }

    return {
      name: 'processing',
      status: 'healthy',
      message: `Avg: ${avgProcessingTime.toFixed(2)}ms, Peak: ${peakProcessingTime}ms`,
      lastCheck: Date.now(),
    };
  }
}
