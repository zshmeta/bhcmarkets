/**
 * Risk Types
 * ==========
 *
 * Types for risk management and pre-trade checks.
 */

export type RiskCheckResult = 'passed' | 'failed' | 'warning';

/**
 * Risk check outcome.
 */
export interface RiskCheck {
  check: string;
  result: RiskCheckResult;
  message?: string;
  value?: number;
  limit?: number;
}

/**
 * Pre-trade risk assessment.
 */
export interface PreTradeRiskAssessment {
  passed: boolean;
  checks: RiskCheck[];
  orderId?: string;
  timestamp: number;
}

/**
 * Account risk limits.
 */
export interface AccountRiskLimits {
  accountId: string;
  maxOrderSize: number;
  maxOrderValue: number;
  maxDailyOrders: number;
  maxDailyVolume: number;
  maxOpenOrders: number;
  maxPositionSize: number;
  maxPositionValue: number;
  maxLeverage: number;
  allowedSymbols?: string[];
  blockedSymbols?: string[];
}

/**
 * Symbol risk limits.
 */
export interface SymbolRiskLimits {
  symbol: string;
  maxOrderSize: number;
  maxOrderValue: number;
  minOrderSize: number;
  minOrderValue: number;
  maxPriceDeviation: number;
  tradingEnabled: boolean;
  marginRequirement: number;
}

/**
 * Account risk exposure.
 */
export interface AccountExposure {
  accountId: string;
  totalPositionValue: number;
  totalMarginUsed: number;
  availableMargin: number;
  unrealizedPnl: number;
  dailyVolume: number;
  dailyOrders: number;
  openOrders: number;
  leverage: number;
  marginLevel: number; // equity / margin
  timestamp: number;
}

/**
 * Symbol exposure across all accounts.
 */
export interface SymbolExposure {
  symbol: string;
  totalLongQuantity: number;
  totalShortQuantity: number;
  netQuantity: number;
  totalLongValue: number;
  totalShortValue: number;
  accountCount: number;
  timestamp: number;
}

/**
 * Risk alert.
 */
export interface RiskAlert {
  id: string;
  type: 'margin_call' | 'position_limit' | 'daily_limit' | 'suspicious_activity' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  accountId?: string;
  symbol?: string;
  message: string;
  data?: Record<string, any>;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
}

/**
 * Risk event for streaming.
 */
export interface RiskEvent {
  type: 'risk_check_failed' | 'margin_warning' | 'position_limit_reached' | 'risk_alert';
  accountId: string;
  data: any;
  timestamp: number;
}
