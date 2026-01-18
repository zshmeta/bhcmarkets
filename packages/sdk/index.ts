/**
 * @repo/sdk
 * ==========
 * Shared SDK for the BHC Markets monorepo.
 * Contains types, utilities, stores, and API client.
 */

// ============================================================================
// CONTEXTS (Zustand Stores)
// ============================================================================

export * from './context/authStore.js';
export * from './context/marketStore.js';
export * from './context/tradingStore.js';
export * from './context/walletStore.js';
export * from './context/watchlistStore.js';
export * from './context/automationStore.js';

// ============================================================================
// TYPES
// ============================================================================

export * from './types/account.types.js';
export * from './types/admin.types.js';
export type { UUID } from './types/admin.types.js';
export * from './types/auth.types.js';
export type { UserRole } from './types/auth.types.js';
export * from './types/cache.types.js';
export * from './types/collector.types.js';
export * from './types/email.types.js';
export * from './types/health.types.js';
export * from './types/historical.types.js';
export * from './types/ledger.types.js';
export * from './types/market-data.types.js';
export type { SymbolInfo, Candle, ConnectionStatus, ConnectionState, DataConfidence } from './types/market-data.types.js';
export * from './types/normalizer.types.js';
export * from './types/order.types.js';
export type { OrderSide, OrderType, OrderBookLevel, OrderStatus } from './types/order.types.js';
export * from './types/OrderForm.types.js';
export type { BalanceInfo } from './types/OrderForm.types.js';
export * from './types/position.types.js';
export type { PositionSide } from './types/position.types.js';
export * from './types/risk.types.js';
export type { DecimalString } from './types/risk.types.js';
export * from './types/stream.types.js';
export type { ClientMessage, ServerMessage } from './types/stream.types.js';
export * from './types/symbols.types.js';
export * from './types/SymbolSelector.types.js';
export * from './types/trade.types.js';
export type { Trade, TradeEvent } from './types/trade.types.js';
export * from './types/trading.types.js';
export type { TradingOrder, Position } from './types/trading.types.js';
export * from './types/triggers.types.js';
export * from './types/user.types.js';
export type { User, UserStatus, AccountStatus, AccountType } from './types/user.types.js';
export * from './types/wallet.types.js';
export type { Account, CryptoAddress, WalletBalance, PaymentMethod, PerformanceMetrics } from './types/wallet.types.js';
export * from './types/WorkPanel.types.js';
export type { Trigger, TriggerStatus } from './types/WorkPanel.types.js';

// ============================================================================
// UTILS (Browser-safe utilities only)
// ============================================================================

export * from './utils/uuid.js';
export * from './utils/mathUtils.js';
export * from './utils/errorHandler.js';
export * from './utils/stringUtils.js';
export * from './utils/timeFormat.js';
export * from './utils/formatters.js';
export * from './utils/circuit-breaker.js';
export * from './utils/response.js';
export * from './utils/retry.js';
export * from './utils/logger.js';

// ============================================================================
// API CLIENT
// ============================================================================

export * from './api/apiClient.js';
