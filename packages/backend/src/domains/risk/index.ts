/**
 * Risk Domain - Barrel Export
 *
 * The Risk domain is responsible for protecting the house from excessive exposure
 * and ensuring users cannot trade beyond their means.
 *
 * Usage:
 * ```typescript
 * import {
 *   createRiskService,
 *   createRiskRepository,
 *   type RiskService,
 *   type RiskCheckInput,
 *   type RiskCheckResult,
 * } from '../domains/risk/index.js';
 *
 * // Create repository
 * const riskRepository = createRiskRepository(db);
 *
 * // Create service with dependencies
 * const riskService = createRiskService({
 *   repository: riskRepository,
 *   getAvailableBalance: (accountId) => accountService.getAvailableBalance(accountId),
 *   getUserPosition: (accountId, symbol) => positionService.getPosition(accountId, symbol),
 *   getHouseNetPosition: (symbol) => positionService.getHouseNetPosition(symbol),
 *   getUserTotalExposure: (userId) => positionService.getUserTotalExposure(userId),
 *   logger: console, // Optional
 * });
 *
 * // Use in order flow
 * const result = await riskService.validatePreTrade({
 *   userId: order.userId,
 *   accountId: order.accountId,
 *   symbol: order.symbol,
 *   side: order.side,
 *   type: order.type,
 *   quantity: order.quantity,
 *   price: order.price,
 * });
 *
 * if (!result.approved) {
 *   throw new Error(result.reason);
 * }
 * ```
 */

// Core types and interfaces
export type {
  UUID,
  DecimalString,
  RiskCheckInput,
  RiskCheckResult,
  RiskRejectionCode,
  SymbolRiskLimits,
  UserRiskLimits,
  PlatformRiskLimits,
  SymbolExposure,
  UserSymbolExposure,
  UserRiskMetrics,
  CircuitBreakerTrigger,
  CircuitBreakerEvent,
  RiskService,
  RiskRepository,
} from "./core/risk.types.js";

// Error class
export { RiskError, type RiskErrorCode } from "./core/risk.errors.js";

// Configuration and defaults
export {
  DEFAULT_PLATFORM_LIMITS,
  DEFAULT_CRYPTO_LIMITS,
  DEFAULT_FOREX_LIMITS,
  DEFAULT_COMMODITY_LIMITS,
  getDefaultSymbolLimits,
  getDefaultUserLimits,
  classifySymbol,
  RISK_THRESHOLDS,
} from "./core/risk.config.js";

// Service factory
export {
  createRiskService,
  type RiskServiceDependencies,
} from "./core/risk.service.js";

// Repository implementation
export { createRiskRepository } from "./repositories/risk.repository.pg.js";

