/**
 * Risk Repository - PostgreSQL Implementation
 *
 * Handles persistence of risk-related data:
 * - Symbol and user risk limits
 * - Circuit breaker events
 * - Order rate limiting tracking
 * - Daily P&L tracking for loss limits
 *
 * Design Notes:
 * - Uses Drizzle ORM for type-safe queries
 * - Most risk checks use in-memory caches; this is for durability
 * - Circuit breaker events create audit trail
 */

import { eq, and, sql, gte, isNull, desc, lt } from "drizzle-orm";
import type {
  RiskRepository,
  SymbolRiskLimits,
  UserRiskLimits,
  UUID,
  CircuitBreakerEvent,
} from "../core/risk.types.js";
import type { DrizzleClient } from "@repo/database";

// Import schema tables from shared database package
import {
  symbolRiskLimits,
  userRiskLimits,
  circuitBreakerEvents,
  orderAttempts,
  dailyUserPnl,
} from "@repo/database";

// =============================================================================
// REPOSITORY IMPLEMENTATION
// =============================================================================

/**
 * Creates a PostgreSQL-backed Risk Repository.
 *
 * @param db - Drizzle database client
 * @returns RiskRepository implementation
 */
export function createRiskRepository(db: DrizzleClient): RiskRepository {
  return {
    // =========================================================================
    // SYMBOL LIMITS
    // =========================================================================

    async getSymbolLimits(symbol: string): Promise<SymbolRiskLimits | null> {
      const [row] = await db
        .select()
        .from(symbolRiskLimits)
        .where(eq(symbolRiskLimits.symbol, symbol));

      if (!row) return null;

      return {
        symbol: row.symbol,
        tradingEnabled: row.tradingEnabled,
        minOrderSize: parseFloat(row.minOrderSize),
        maxOrderSize: parseFloat(row.maxOrderSize),
        lotSize: parseFloat(row.lotSize),
        tickSize: 0.01, // TODO: Add to schema or derive from symbol
        maxPriceDeviation: parseFloat(row.maxPriceDeviation),
        maxUserPosition: parseFloat(row.maxUserPosition),
        maxHouseExposure: parseFloat(row.maxHouseExposure),
        maxHouseNotionalExposure: parseFloat(row.maxHouseNotionalExposure),
      };
    },

    async upsertSymbolLimits(limits: SymbolRiskLimits): Promise<void> {
      await db
        .insert(symbolRiskLimits)
        .values({
          symbol: limits.symbol,
          tradingEnabled: limits.tradingEnabled,
          minOrderSize: String(limits.minOrderSize),
          maxOrderSize: String(limits.maxOrderSize),
          lotSize: String(limits.lotSize),
          maxPriceDeviation: String(limits.maxPriceDeviation),
          maxUserPosition: String(limits.maxUserPosition),
          maxHouseExposure: String(limits.maxHouseExposure),
          maxHouseNotionalExposure: String(limits.maxHouseNotionalExposure),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: symbolRiskLimits.symbol,
          set: {
            tradingEnabled: limits.tradingEnabled,
            minOrderSize: String(limits.minOrderSize),
            maxOrderSize: String(limits.maxOrderSize),
            lotSize: String(limits.lotSize),
            maxPriceDeviation: String(limits.maxPriceDeviation),
            maxUserPosition: String(limits.maxUserPosition),
            maxHouseExposure: String(limits.maxHouseExposure),
            maxHouseNotionalExposure: String(limits.maxHouseNotionalExposure),
            updatedAt: new Date(),
          },
        });
    },

    async getAllSymbolLimits(): Promise<SymbolRiskLimits[]> {
      const rows = await db.select().from(symbolRiskLimits);

      return rows.map((row) => ({
        symbol: row.symbol,
        tradingEnabled: row.tradingEnabled,
        minOrderSize: parseFloat(row.minOrderSize),
        maxOrderSize: parseFloat(row.maxOrderSize),
        lotSize: parseFloat(row.lotSize),
        tickSize: 0.01, // TODO: Add to schema
        maxPriceDeviation: parseFloat(row.maxPriceDeviation),
        maxUserPosition: parseFloat(row.maxUserPosition),
        maxHouseExposure: parseFloat(row.maxHouseExposure),
        maxHouseNotionalExposure: parseFloat(row.maxHouseNotionalExposure),
      }));
    },

    // =========================================================================
    // USER LIMITS
    // =========================================================================

    async getUserLimits(userId: UUID): Promise<UserRiskLimits | null> {
      const [row] = await db
        .select()
        .from(userRiskLimits)
        .where(eq(userRiskLimits.userId, userId));

      if (!row) return null;

      return {
        userId: row.userId,
        tradingRestricted: row.tradingRestricted,
        restrictionReason: row.restrictionReason || undefined,
        maxOrdersPerMinute: row.maxOrdersPerMinute,
        dailyLossLimit: parseFloat(row.dailyLossLimit),
        maxSymbolPositionValue: parseFloat(row.maxSymbolPositionValue),
        maxTotalPositionValue: parseFloat(row.maxTotalPositionValue),
      };
    },

    async upsertUserLimits(limits: UserRiskLimits): Promise<void> {
      await db
        .insert(userRiskLimits)
        .values({
          userId: limits.userId,
          tradingRestricted: limits.tradingRestricted,
          restrictionReason: limits.restrictionReason || null,
          maxOrdersPerMinute: limits.maxOrdersPerMinute,
          dailyLossLimit: String(limits.dailyLossLimit),
          maxSymbolPositionValue: String(limits.maxSymbolPositionValue),
          maxTotalPositionValue: String(limits.maxTotalPositionValue),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userRiskLimits.userId,
          set: {
            tradingRestricted: limits.tradingRestricted,
            restrictionReason: limits.restrictionReason || null,
            maxOrdersPerMinute: limits.maxOrdersPerMinute,
            dailyLossLimit: String(limits.dailyLossLimit),
            maxSymbolPositionValue: String(limits.maxSymbolPositionValue),
            maxTotalPositionValue: String(limits.maxTotalPositionValue),
            updatedAt: new Date(),
          },
        });
    },

    // =========================================================================
    // CIRCUIT BREAKER
    // =========================================================================

    async getActiveCircuitBreaker(
      symbol?: string
    ): Promise<CircuitBreakerEvent | null> {
      let query;

      if (symbol === undefined) {
        // Platform-wide breaker: symbol is null
        query = db
          .select()
          .from(circuitBreakerEvents)
          .where(
            and(
              isNull(circuitBreakerEvents.symbol),
              isNull(circuitBreakerEvents.deactivatedAt)
            )
          );
      } else {
        // Symbol-specific breaker
        query = db
          .select()
          .from(circuitBreakerEvents)
          .where(
            and(
              eq(circuitBreakerEvents.symbol, symbol),
              isNull(circuitBreakerEvents.deactivatedAt)
            )
          );
      }

      const [row] = await query.orderBy(desc(circuitBreakerEvents.activatedAt));

      if (!row) return null;

      return {
        id: row.id,
        symbol: row.symbol || undefined,
        trigger: row.trigger as CircuitBreakerEvent["trigger"],
        reason: row.reason,
        activatedAt: row.activatedAt,
        activatedBy: row.activatedBy || undefined,
        deactivatedAt: row.deactivatedAt || undefined,
        deactivatedBy: row.deactivatedBy || undefined,
      };
    },

    async createCircuitBreakerEvent(
      event: Omit<CircuitBreakerEvent, "id">
    ): Promise<CircuitBreakerEvent> {
      const [row] = await db
        .insert(circuitBreakerEvents)
        .values({
          symbol: event.symbol || null,
          trigger: event.trigger,
          reason: event.reason,
          activatedAt: event.activatedAt,
          activatedBy: event.activatedBy || null,
        })
        .returning();

      if (!row) {
        throw new Error("Failed to create circuit breaker event");
      }

      return {
        id: row.id,
        symbol: row.symbol || undefined,
        trigger: row.trigger as CircuitBreakerEvent["trigger"],
        reason: row.reason,
        activatedAt: row.activatedAt,
        activatedBy: row.activatedBy || undefined,
      };
    },

    async deactivateCircuitBreaker(
      eventId: UUID,
      deactivatedAt: Date,
      deactivatedBy?: UUID
    ): Promise<void> {
      await db
        .update(circuitBreakerEvents)
        .set({
          deactivatedAt,
          deactivatedBy: deactivatedBy || null,
        })
        .where(eq(circuitBreakerEvents.id, eventId));
    },

    // =========================================================================
    // RATE LIMITING
    // =========================================================================

    async getRecentOrderCount(userId: UUID, since: Date): Promise<number> {
      const [result] = await db
        .select({ count: sql<string>`count(*)` })
        .from(orderAttempts)
        .where(
          and(
            eq(orderAttempts.userId, userId),
            gte(orderAttempts.attemptedAt, since)
          )
        );

      return parseInt(result?.count || "0", 10);
    },

    async recordOrderAttempt(userId: UUID, attemptedAt: Date): Promise<void> {
      await db.insert(orderAttempts).values({
        userId,
        attemptedAt,
      });
    },

    // =========================================================================
    // P&L TRACKING
    // =========================================================================

    async getTodayRealizedPnl(userId: UUID): Promise<number> {
      // Get today's date in UTC as a string for the date column
      const today = new Date().toISOString().split("T")[0]!; // "YYYY-MM-DD"

      // Query the pre-aggregated daily P&L table
      const [result] = await db
        .select()
        .from(dailyUserPnl)
        .where(
          and(
            eq(dailyUserPnl.userId, userId),
            eq(dailyUserPnl.date, today)
          )
        );

      return result ? parseFloat(result.realizedPnl) : 0;
    },

    // =========================================================================
    // CLEANUP
    // =========================================================================

    async cleanupOldOrderAttempts(olderThan: Date): Promise<number> {
      // Delete old order attempts to keep the table size manageable
      const result = await db
        .delete(orderAttempts)
        .where(lt(orderAttempts.attemptedAt, olderThan))
        .returning();

      return result.length;
    },
  };
}

export type { RiskRepository };

