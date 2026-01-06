/**
 * Risk Service
 * ============
 *
 * Pre-trade and real-time risk management.
 *
 * RISK CHECKS:
 * 1. Order size limits
 * 2. Order value limits
 * 3. Position limits
 * 4. Margin requirements
 * 5. Daily volume limits
 * 6. Daily order count limits
 * 7. Price deviation checks
 * 8. Account status checks
 *
 * MONITORING:
 * - Real-time exposure tracking
 * - Margin level monitoring
 * - Position concentration
 * - Unusual activity detection
 */

import type {
  RiskCheck,
  PreTradeRiskAssessment,
  AccountRiskLimits,
  SymbolRiskLimits,
  AccountExposure,
  SymbolExposure,
  RiskAlert,
  RiskEvent,
} from './risk.types.js';
import type { PlaceOrderInput } from '../../types/order.types.js';
import type { LedgerService } from '../ledger/ledger-service.js';
import type { PositionManager } from '../positions/position-manager.js';
import { logger } from '../../utils/logger.js';
import { randomUUID } from 'crypto';

const log = logger.child({ component: 'risk-service' });

type RiskEventHandler = (event: RiskEvent) => void;

/**
 * Default risk limits for new accounts.
 */
const DEFAULT_ACCOUNT_LIMITS: Omit<AccountRiskLimits, 'accountId'> = {
  maxOrderSize: 100,
  maxOrderValue: 1_000_000,
  maxDailyOrders: 10000,
  maxDailyVolume: 10_000_000,
  maxOpenOrders: 100,
  maxPositionSize: 1000,
  maxPositionValue: 10_000_000,
  maxLeverage: 1, // No leverage by default
};

/**
 * Default risk limits for symbols.
 */
const DEFAULT_SYMBOL_LIMITS: Omit<SymbolRiskLimits, 'symbol'> = {
  maxOrderSize: 1000,
  maxOrderValue: 10_000_000,
  minOrderSize: 0.0001,
  minOrderValue: 1,
  maxPriceDeviation: 0.1, // 10%
  tradingEnabled: true,
  marginRequirement: 1, // 100% margin (no leverage)
};

export class RiskService {
  private accountLimits: Map<string, AccountRiskLimits> = new Map();
  private symbolLimits: Map<string, SymbolRiskLimits> = new Map();
  private accountDailyStats: Map<string, { orders: number; volume: number; date: string }> = new Map();
  private accountOpenOrders: Map<string, Set<string>> = new Map();
  private marketPrices: Map<string, number> = new Map();
  private alerts: Map<string, RiskAlert> = new Map();
  private eventHandlers: RiskEventHandler[] = [];

  private ledgerService: LedgerService | null = null;
  private positionManager: PositionManager | null = null;

  constructor() {}

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /**
   * Set ledger service for balance checks.
   */
  setLedgerService(ls: LedgerService): void {
    this.ledgerService = ls;
  }

  /**
   * Set position manager for position checks.
   */
  setPositionManager(pm: PositionManager): void {
    this.positionManager = pm;
  }

  /**
   * Set account risk limits.
   */
  setAccountLimits(limits: AccountRiskLimits): void {
    this.accountLimits.set(limits.accountId, limits);
    log.info({ accountId: limits.accountId }, 'Account risk limits updated');
  }

  /**
   * Set symbol risk limits.
   */
  setSymbolLimits(limits: SymbolRiskLimits): void {
    this.symbolLimits.set(limits.symbol, limits);
    log.info({ symbol: limits.symbol }, 'Symbol risk limits updated');
  }

  /**
   * Update market price for deviation checks.
   */
  setMarketPrice(symbol: string, price: number): void {
    this.marketPrices.set(symbol, price);
  }

  // ===========================================================================
  // PRE-TRADE RISK CHECKS
  // ===========================================================================

  /**
   * Perform pre-trade risk assessment.
   */
  async assessOrder(order: PlaceOrderInput): Promise<PreTradeRiskAssessment> {
    const checks: RiskCheck[] = [];
    const accountLimits = this.getAccountLimits(order.accountId);
    const symbolLimits = this.getSymbolLimits(order.symbol);

    // Parse numeric values
    const quantity = Number(order.quantity);
    const price = order.price ? Number(order.price) : 0;

    // 1. Trading enabled check
    checks.push(this.checkTradingEnabled(order.symbol, symbolLimits));

    // 2. Symbol allowed check
    checks.push(this.checkSymbolAllowed(order.symbol, accountLimits));

    // 3. Order size check
    checks.push(this.checkOrderSize(quantity, accountLimits, symbolLimits));

    // 4. Order value check
    const orderValue = price > 0 ? price * quantity : 0;
    if (orderValue > 0) {
      checks.push(this.checkOrderValue(orderValue, accountLimits, symbolLimits));
    }

    // 5. Price deviation check (for limit orders)
    if (price > 0) {
      checks.push(this.checkPriceDeviation(order.symbol, price, symbolLimits));
    }

    // 6. Daily order count check
    checks.push(this.checkDailyOrderCount(order.accountId, accountLimits));

    // 7. Daily volume check
    if (orderValue > 0) {
      checks.push(this.checkDailyVolume(order.accountId, orderValue, accountLimits));
    }

    // 8. Open orders check
    checks.push(this.checkOpenOrders(order.accountId, accountLimits));

    // 9. Position limit check
    checks.push(this.checkPositionLimit(order, quantity, accountLimits));

    // 10. Balance check
    if (this.ledgerService && price > 0) {
      checks.push(await this.checkBalance(order, quantity, price));
    }

    // Determine if passed
    const failed = checks.filter((c) => c.result === 'failed');
    const passed = failed.length === 0;

    const assessment: PreTradeRiskAssessment = {
      passed,
      checks,
      timestamp: Date.now(),
    };

    if (!passed) {
      log.warn({
        accountId: order.accountId,
        symbol: order.symbol,
        failedChecks: failed.map((c) => c.check),
      }, 'Order failed risk checks');

      this.emit({
        type: 'risk_check_failed',
        accountId: order.accountId,
        data: { order, checks: failed },
        timestamp: Date.now(),
      });
    }

    return assessment;
  }

  // ===========================================================================
  // INDIVIDUAL RISK CHECKS
  // ===========================================================================

  private checkTradingEnabled(symbol: string, limits: SymbolRiskLimits): RiskCheck {
    return {
      check: 'trading_enabled',
      result: limits.tradingEnabled ? 'passed' : 'failed',
      message: limits.tradingEnabled ? undefined : `Trading disabled for ${symbol}`,
    };
  }

  private checkSymbolAllowed(symbol: string, limits: AccountRiskLimits): RiskCheck {
    if (limits.blockedSymbols?.includes(symbol)) {
      return {
        check: 'symbol_allowed',
        result: 'failed',
        message: `Symbol ${symbol} is blocked for this account`,
      };
    }

    if (limits.allowedSymbols && !limits.allowedSymbols.includes(symbol)) {
      return {
        check: 'symbol_allowed',
        result: 'failed',
        message: `Symbol ${symbol} is not allowed for this account`,
      };
    }

    return { check: 'symbol_allowed', result: 'passed' };
  }

  private checkOrderSize(
    quantity: number,
    accountLimits: AccountRiskLimits,
    symbolLimits: SymbolRiskLimits
  ): RiskCheck {
    if (quantity < symbolLimits.minOrderSize) {
      return {
        check: 'order_size',
        result: 'failed',
        message: `Order size ${quantity} below minimum ${symbolLimits.minOrderSize}`,
        value: quantity,
        limit: symbolLimits.minOrderSize,
      };
    }

    const maxSize = Math.min(accountLimits.maxOrderSize, symbolLimits.maxOrderSize);
    if (quantity > maxSize) {
      return {
        check: 'order_size',
        result: 'failed',
        message: `Order size ${quantity} exceeds maximum ${maxSize}`,
        value: quantity,
        limit: maxSize,
      };
    }

    return { check: 'order_size', result: 'passed', value: quantity, limit: maxSize };
  }

  private checkOrderValue(
    value: number,
    accountLimits: AccountRiskLimits,
    symbolLimits: SymbolRiskLimits
  ): RiskCheck {
    if (value < symbolLimits.minOrderValue) {
      return {
        check: 'order_value',
        result: 'failed',
        message: `Order value ${value} below minimum ${symbolLimits.minOrderValue}`,
        value,
        limit: symbolLimits.minOrderValue,
      };
    }

    const maxValue = Math.min(accountLimits.maxOrderValue, symbolLimits.maxOrderValue);
    if (value > maxValue) {
      return {
        check: 'order_value',
        result: 'failed',
        message: `Order value ${value} exceeds maximum ${maxValue}`,
        value,
        limit: maxValue,
      };
    }

    return { check: 'order_value', result: 'passed', value, limit: maxValue };
  }

  private checkPriceDeviation(
    symbol: string,
    price: number,
    limits: SymbolRiskLimits
  ): RiskCheck {
    const marketPrice = this.marketPrices.get(symbol);

    if (!marketPrice) {
      return { check: 'price_deviation', result: 'passed', message: 'No market price available' };
    }

    const deviation = Math.abs(price - marketPrice) / marketPrice;

    if (deviation > limits.maxPriceDeviation) {
      return {
        check: 'price_deviation',
        result: 'failed',
        message: `Price ${price} deviates ${(deviation * 100).toFixed(2)}% from market price ${marketPrice}`,
        value: deviation,
        limit: limits.maxPriceDeviation,
      };
    }

    // Warning at 50% of limit
    if (deviation > limits.maxPriceDeviation * 0.5) {
      return {
        check: 'price_deviation',
        result: 'warning',
        message: `Price deviation ${(deviation * 100).toFixed(2)}% approaching limit`,
        value: deviation,
        limit: limits.maxPriceDeviation,
      };
    }

    return { check: 'price_deviation', result: 'passed', value: deviation };
  }

  private checkDailyOrderCount(accountId: string, limits: AccountRiskLimits): RiskCheck {
    const today = new Date().toISOString().split('T')[0]!;
    const stats = this.accountDailyStats.get(accountId);

    const currentCount = (stats?.date === today ? stats.orders : 0) + 1;

    if (currentCount > limits.maxDailyOrders) {
      return {
        check: 'daily_order_count',
        result: 'failed',
        message: `Daily order count ${currentCount} exceeds limit ${limits.maxDailyOrders}`,
        value: currentCount,
        limit: limits.maxDailyOrders,
      };
    }

    return { check: 'daily_order_count', result: 'passed', value: currentCount, limit: limits.maxDailyOrders };
  }

  private checkDailyVolume(accountId: string, orderValue: number, limits: AccountRiskLimits): RiskCheck {
    const today = new Date().toISOString().split('T')[0]!;
    const stats = this.accountDailyStats.get(accountId);

    const currentVolume = (stats?.date === today ? stats.volume : 0) + orderValue;

    if (currentVolume > limits.maxDailyVolume) {
      return {
        check: 'daily_volume',
        result: 'failed',
        message: `Daily volume ${currentVolume} exceeds limit ${limits.maxDailyVolume}`,
        value: currentVolume,
        limit: limits.maxDailyVolume,
      };
    }

    return { check: 'daily_volume', result: 'passed', value: currentVolume, limit: limits.maxDailyVolume };
  }

  private checkOpenOrders(accountId: string, limits: AccountRiskLimits): RiskCheck {
    const openOrders = this.accountOpenOrders.get(accountId)?.size ?? 0;

    if (openOrders >= limits.maxOpenOrders) {
      return {
        check: 'open_orders',
        result: 'failed',
        message: `Open orders ${openOrders} at limit ${limits.maxOpenOrders}`,
        value: openOrders,
        limit: limits.maxOpenOrders,
      };
    }

    return { check: 'open_orders', result: 'passed', value: openOrders, limit: limits.maxOpenOrders };
  }

  private checkPositionLimit(order: PlaceOrderInput, quantity: number, limits: AccountRiskLimits): RiskCheck {
    if (!this.positionManager) {
      return { check: 'position_limit', result: 'passed', message: 'Position manager not available' };
    }

    const position = this.positionManager.getPosition(order.accountId, order.symbol);
    const currentQty = position?.quantity ?? 0;

    // Calculate new position quantity
    let newQty: number;
    if (order.side === 'buy') {
      newQty = currentQty + quantity;
    } else {
      newQty = currentQty - quantity;
    }

    if (Math.abs(newQty) > limits.maxPositionSize) {
      return {
        check: 'position_limit',
        result: 'failed',
        message: `Resulting position ${Math.abs(newQty)} exceeds limit ${limits.maxPositionSize}`,
        value: Math.abs(newQty),
        limit: limits.maxPositionSize,
      };
    }

    return { check: 'position_limit', result: 'passed', value: Math.abs(newQty), limit: limits.maxPositionSize };
  }

  private async checkBalance(order: PlaceOrderInput, quantity: number, price: number): Promise<RiskCheck> {
    if (!this.ledgerService || price <= 0) {
      return { check: 'balance', result: 'passed' };
    }

    const [baseAsset, quoteAsset] = order.symbol.split('-');
    if (!baseAsset || !quoteAsset) {
      return { check: 'balance', result: 'passed', message: 'Invalid symbol format' };
    }

    const orderValue = price * quantity;

    if (order.side === 'buy') {
      // Need quote currency to buy
      const hasBalance = this.ledgerService.hasAvailableBalance(order.accountId, quoteAsset, orderValue);
      if (!hasBalance) {
        return {
          check: 'balance',
          result: 'failed',
          message: `Insufficient ${quoteAsset} balance for order value ${orderValue}`,
        };
      }
    } else {
      // Need base currency to sell
      const hasBalance = this.ledgerService.hasAvailableBalance(order.accountId, baseAsset, quantity);
      if (!hasBalance) {
        return {
          check: 'balance',
          result: 'failed',
          message: `Insufficient ${baseAsset} balance for quantity ${quantity}`,
        };
      }
    }

    return { check: 'balance', result: 'passed' };
  }

  // ===========================================================================
  // EXPOSURE TRACKING
  // ===========================================================================

  /**
   * Get account exposure summary.
   */
  getAccountExposure(accountId: string): AccountExposure {
    const today = new Date().toISOString().split('T')[0]!;
    const stats = this.accountDailyStats.get(accountId);
    const openOrders = this.accountOpenOrders.get(accountId)?.size ?? 0;

    let totalPositionValue = 0;
    let unrealizedPnl = 0;

    if (this.positionManager) {
      const positions = this.positionManager.getAccountPositions(accountId);
      for (const pos of positions) {
        totalPositionValue += pos.marketValue;
        unrealizedPnl += pos.unrealizedPnl;
      }
    }

    return {
      accountId,
      totalPositionValue,
      totalMarginUsed: totalPositionValue, // Simplified
      availableMargin: 0, // Would need ledger integration
      unrealizedPnl,
      dailyVolume: stats?.date === today ? stats.volume : 0,
      dailyOrders: stats?.date === today ? stats.orders : 0,
      openOrders,
      leverage: 1,
      marginLevel: 1,
      timestamp: Date.now(),
    };
  }

  /**
   * Get symbol exposure across all accounts.
   */
  getSymbolExposure(symbol: string): SymbolExposure {
    let totalLongQuantity = 0;
    let totalShortQuantity = 0;
    let totalLongValue = 0;
    let totalShortValue = 0;
    let accountCount = 0;

    if (this.positionManager) {
      const positions = this.positionManager.getSymbolPositions(symbol);
      const marketPrice = this.marketPrices.get(symbol) ?? 0;

      for (const pos of positions) {
        accountCount++;
        if (pos.side === 'long') {
          totalLongQuantity += pos.quantity;
          totalLongValue += pos.quantity * marketPrice;
        } else if (pos.side === 'short') {
          totalShortQuantity += pos.quantity;
          totalShortValue += pos.quantity * marketPrice;
        }
      }
    }

    return {
      symbol,
      totalLongQuantity,
      totalShortQuantity,
      netQuantity: totalLongQuantity - totalShortQuantity,
      totalLongValue,
      totalShortValue,
      accountCount,
      timestamp: Date.now(),
    };
  }

  // ===========================================================================
  // ORDER TRACKING
  // ===========================================================================

  /**
   * Record order placed (for daily stats).
   */
  recordOrderPlaced(accountId: string, orderId: string, value: number): void {
    const today = new Date().toISOString().split('T')[0]!;
    let stats = this.accountDailyStats.get(accountId);

    if (!stats || stats.date !== today) {
      stats = { orders: 0, volume: 0, date: today };
    }

    stats.orders++;
    stats.volume += value;
    this.accountDailyStats.set(accountId, stats);

    // Track open order
    let openOrders = this.accountOpenOrders.get(accountId);
    if (!openOrders) {
      openOrders = new Set();
      this.accountOpenOrders.set(accountId, openOrders);
    }
    openOrders.add(orderId);
  }

  /**
   * Record order closed.
   */
  recordOrderClosed(accountId: string, orderId: string): void {
    const openOrders = this.accountOpenOrders.get(accountId);
    if (openOrders) {
      openOrders.delete(orderId);
    }
  }

  // ===========================================================================
  // ALERTS
  // ===========================================================================

  /**
   * Create a risk alert.
   */
  createAlert(alert: Omit<RiskAlert, 'id' | 'timestamp' | 'acknowledged'>): RiskAlert {
    const fullAlert: RiskAlert = {
      ...alert,
      id: randomUUID(),
      timestamp: Date.now(),
      acknowledged: false,
    };

    this.alerts.set(fullAlert.id, fullAlert);

    this.emit({
      type: 'risk_alert',
      accountId: alert.accountId ?? 'system',
      data: fullAlert,
      timestamp: fullAlert.timestamp,
    });

    log.warn({ alert: fullAlert }, 'Risk alert created');
    return fullAlert;
  }

  /**
   * Get active alerts.
   */
  getActiveAlerts(accountId?: string): RiskAlert[] {
    const alerts = Array.from(this.alerts.values()).filter((a) => !a.acknowledged);

    if (accountId) {
      return alerts.filter((a) => a.accountId === accountId);
    }

    return alerts;
  }

  /**
   * Acknowledge an alert.
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedAt = Date.now();
    alert.acknowledgedBy = acknowledgedBy;

    log.info({ alertId, acknowledgedBy }, 'Alert acknowledged');
    return true;
  }

  // ===========================================================================
  // EVENTS
  // ===========================================================================

  /**
   * Register event handler.
   */
  onEvent(handler: RiskEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index !== -1) this.eventHandlers.splice(index, 1);
    };
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private getAccountLimits(accountId: string): AccountRiskLimits {
    return this.accountLimits.get(accountId) ?? { accountId, ...DEFAULT_ACCOUNT_LIMITS };
  }

  private getSymbolLimits(symbol: string): SymbolRiskLimits {
    return this.symbolLimits.get(symbol) ?? { symbol, ...DEFAULT_SYMBOL_LIMITS };
  }

  private emit(event: RiskEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        log.error({ error, event }, 'Error in risk event handler');
      }
    }
  }
}
