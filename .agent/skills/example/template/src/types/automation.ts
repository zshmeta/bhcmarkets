import { OrderSide, OrderType } from './trading';
import { DataConfidenceLevel } from './market';

// ===== Trigger Types =====

export type TriggerType = 'conditional' | 'takeProfit' | 'stopLoss' | 'alert';
export type TriggerStatus = 'armed' | 'paused' | 'blocked' | 'triggered' | 'completed' | 'failed' | 'cancelled' | 'expired';
export type TriggerOperator = 'gte' | 'lte';
export type CrossDirection = 'up' | 'down';
export type QuantityMode = 'fixed' | 'percent';

export interface Trigger {
  id: string;                    // uuid
  symbol: string;                // Trading pair
  type: TriggerType;             // Trigger type
  status: TriggerStatus;         // Current status
  statusReason?: string;         // Status reason (e.g., when blocked)
  enabled: boolean;              // Whether enabled
  condition: TriggerCondition;   // Trigger condition
  action: TriggerAction;         // Trigger action
  positionId?: string;           // Related position (for TP/SL)
  linkedTriggerId?: string;      // The other trigger linked in OCO

  // Properties kept for backward compatibility
  triggerPrice?: string;         // Trigger price (legacy; prefer migrating to condition.threshold)

  // Configuration
  allowDegraded: boolean;        // Allow execution when DEGRADED
  repeat: boolean;               // Whether to repeat trigger

  // Time
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;            // Expiration time (undefined for GTC)
  lastTriggeredAt?: number;      // Last triggered time

  // Stats
  triggerCount: number;          // Trigger count
  successCount: number;          // Success count
  failCount: number;             // Failure count
}

export interface TriggerCondition {
  priceSource: 'last' | 'bid' | 'ask' | 'mid';  // Price source
  operator: TriggerOperator;     // Comparison operator
  threshold: string;             // Threshold (decimal string)
  direction: CrossDirection;     // Cross direction
  debounceMs: number;            // Debounce time (default 1000ms)
  cooldownMs: number;            // Cooldown time (for repeating triggers; default 60000ms)
}

export interface TriggerAction {
  type: 'order' | 'alert';       // Action type
  side?: OrderSide;              // Buy/sell side
  orderType?: OrderType;         // Order type
  limitPrice?: string;           // Limit price (for limit orders)
  quantityMode: QuantityMode;    // Quantity mode
  quantityValue: string;         // Quantity value
  timeInForce?: 'GTC' | 'IOC';   // Time in force (default GTC)
}

// ===== Execution Log =====

export type ExecutionResult = 'success' | 'blocked' | 'failed';

export interface ExecutionLog {
  id: string;                    // uuid
  triggerId: string;             // Related trigger
  firedAt: number;               // Fired at
  timestamp?: number;            // Fired at (compatibility field)

  // Market state at the moment of firing
  observedPrice: string;         // Observed price
  confidenceLevel: DataConfidenceLevel;  // Data confidence level
  confidenceReason: string;      // Confidence reason
  reason?: string;               // Description of why it fired

  // Execution result
  result: ExecutionResult;
  orderId?: string;              // Order ID on success
  errorCode?: AutomationErrorCode;  // Error code on failure
  errorMessage?: string;         // Failure details

  // Reconciliation info
  executionLatencyMs: number;    // Execution latency (from trigger to order completion)
}

// ===== Error Codes =====

export type AutomationErrorCode =
  | 'INSUFFICIENT_BALANCE'       // Insufficient balance
  | 'DATA_NOT_RELIABLE'          // Data is not reliable
  | 'RATE_LIMITED'               // Throttled due to triggering too frequently
  | 'ORDER_REJECTED'             // Order rejected
  | 'POSITION_CLOSED'            // Position already closed (TP/SL)
  | 'TRIGGER_EXPIRED'            // Trigger expired
  | 'TRIGGER_CANCELLED'          // Trigger cancelled
  | 'OCO_CANCELLED'              // Cancelled by linked OCO trigger
  | 'NETWORK_ERROR'              // Network error
  | 'UNKNOWN_ERROR';             // Unknown error


