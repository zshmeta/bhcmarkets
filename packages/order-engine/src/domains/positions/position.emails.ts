/**
 * Position Email Handler
 *
 * Listens to position change events and sends trade opened/closed email notifications.
 */

import type { PositionChangeEvent, PositionSnapshot } from './position.types.js';
import type { PositionManager } from './position-manager.js';

/**
 * Trade email payload for email worker
 */
interface TradeOpenedPayload {
  type: 'trade_opened';
  to: string;
  data: {
    userName: string;
    symbol: string;
    side: string;
    quantity: string;
    price: string;
    totalValue: string;
    orderId: string;
    openedAt: string;
    marketType: string;
  };
}

interface TradeClosedPayload {
  type: 'trade_closed';
  to: string;
  data: {
    userName: string;
    symbol: string;
    side: string;
    quantity: string;
    entryPrice: string;
    exitPrice: string;
    pnl: string;
    pnlPercent: string;
    orderId: string;
    openedAt: string;
    closedAt: string;
    duration: string;
    outcome: 'profit' | 'loss' | 'breakeven';
  };
}

type EmailPayload = TradeOpenedPayload | TradeClosedPayload;

/**
 * User resolver interface for fetching user details
 */
export interface UserResolver {
  getUserByAccountId(accountId: string): Promise<{
    email: string;
    name: string;
  } | null>;
}

/**
 * Position resolver interface for fetching position details
 */
export interface PositionResolver {
  getPosition(accountId: string, symbol: string): PositionSnapshot | null;
}

/**
 * Trade history resolver for closed position details
 */
export interface TradeHistoryResolver {
  getTradeDetails(tradeId: string): Promise<{
    entryPrice: number;
    exitPrice: number;
    openedAt: number;
    closedAt: number;
    realizedPnl: number;
    realizedPnlPercent: number;
    quantity: number;
    side: string;
  } | null>;
}

/**
 * Email client interface
 */
export interface EmailClient {
  send(payload: EmailPayload): Promise<{ success: boolean; error?: string }>;
}

/**
 * Configuration for the position email handler
 */
export interface PositionEmailHandlerConfig {
  emailClient: EmailClient;
  userResolver: UserResolver;
  positionResolver: PositionResolver;
  tradeHistoryResolver: TradeHistoryResolver;
  enabled?: boolean;
  /**
   * Minimum position value to trigger email (prevents spam for tiny trades)
   */
  minimumValueThreshold?: number;
}

/**
 * Creates a position email handler that listens to position manager events
 */
export function createPositionEmailHandler(
  positionManager: PositionManager,
  config: PositionEmailHandlerConfig
) {
  const {
    emailClient,
    userResolver,
    positionResolver,
    tradeHistoryResolver,
    enabled = true,
    minimumValueThreshold = 0,
  } = config;

  if (!enabled) {
    console.log('[PositionEmailHandler] Email notifications disabled');
    return { dispose: () => {} };
  }

  const handlePositionChange = async (event: PositionChangeEvent) => {
    try {
      // Fetch user details
      const user = await userResolver.getUserByAccountId(event.accountId);
      if (!user) {
        console.warn(`[PositionEmailHandler] User not found for account ${event.accountId}`);
        return;
      }

      if (event.type === 'position_opened') {
        await handlePositionOpened(event, user);
      } else if (event.type === 'position_closed') {
        await handlePositionClosed(event, user);
      }
      // position_updated events don't trigger emails by default
    } catch (error) {
      console.error('[PositionEmailHandler] Error processing position event:', error);
    }
  };

  const handlePositionOpened = async (
    event: PositionChangeEvent,
    user: { email: string; name: string }
  ) => {
    // Get current position details
    const position = positionResolver.getPosition(event.accountId, event.symbol);
    if (!position) {
      console.warn(`[PositionEmailHandler] Position not found for ${event.symbol}`);
      return;
    }

    // Skip if below threshold
    if (position.marketValue < minimumValueThreshold) {
      return;
    }

    const payload: TradeOpenedPayload = {
      type: 'trade_opened',
      to: user.email,
      data: {
        userName: user.name,
        symbol: event.symbol,
        side: position.side === 'long' ? 'Buy' : 'Sell',
        quantity: formatNumber(position.quantity),
        price: formatCurrency(position.averageEntryPrice),
        totalValue: formatCurrency(position.marketValue),
        orderId: event.tradeId,
        openedAt: formatDateTime(event.timestamp),
        marketType: getMarketType(event.symbol),
      },
    };

    const result = await emailClient.send(payload);
    if (!result.success) {
      console.error(`[PositionEmailHandler] Failed to send trade opened email: ${result.error}`);
    }
  };

  const handlePositionClosed = async (
    event: PositionChangeEvent,
    user: { email: string; name: string }
  ) => {
    // Get trade history details for closed position
    const tradeDetails = await tradeHistoryResolver.getTradeDetails(event.tradeId);
    if (!tradeDetails) {
      console.warn(`[PositionEmailHandler] Trade details not found for ${event.tradeId}`);
      return;
    }

    const duration = calculateDuration(tradeDetails.openedAt, tradeDetails.closedAt);
    const outcome = getOutcome(tradeDetails.realizedPnl);

    const payload: TradeClosedPayload = {
      type: 'trade_closed',
      to: user.email,
      data: {
        userName: user.name,
        symbol: event.symbol,
        side: tradeDetails.side,
        quantity: formatNumber(tradeDetails.quantity),
        entryPrice: formatCurrency(tradeDetails.entryPrice),
        exitPrice: formatCurrency(tradeDetails.exitPrice),
        pnl: formatCurrency(tradeDetails.realizedPnl),
        pnlPercent: formatPercent(tradeDetails.realizedPnlPercent),
        orderId: event.tradeId,
        openedAt: formatDateTime(tradeDetails.openedAt),
        closedAt: formatDateTime(tradeDetails.closedAt),
        duration,
        outcome,
      },
    };

    const result = await emailClient.send(payload);
    if (!result.success) {
      console.error(`[PositionEmailHandler] Failed to send trade closed email: ${result.error}`);
    }
  };

  // Subscribe to position change events
  const unsubscribe = positionManager.onEvent(handlePositionChange);

  console.log('[PositionEmailHandler] Subscribed to position change events');

  return {
    dispose: () => {
      unsubscribe();
      console.log('[PositionEmailHandler] Unsubscribed from position change events');
    },
  };
}

// Utility functions

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

function calculateDuration(startMs: number, endMs: number): string {
  const durationMs = endMs - startMs;
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function getOutcome(pnl: number): 'profit' | 'loss' | 'breakeven' {
  if (pnl > 0.01) return 'profit';
  if (pnl < -0.01) return 'loss';
  return 'breakeven';
}

function getMarketType(symbol: string): string {
  // Determine market type from symbol
  if (symbol.includes('/')) {
    // Crypto pairs like BTC/USD
    return 'Cryptocurrency';
  }
  if (symbol.endsWith('=F')) {
    return 'Futures';
  }
  if (symbol.includes('-')) {
    return 'Options';
  }
  // Default to equities
  return 'Equities';
}

export type { TradeOpenedPayload, TradeClosedPayload, EmailPayload };
