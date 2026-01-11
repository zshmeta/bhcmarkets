/**
 * TradingPage - Modern Trading Terminal Integration
 *
 * Wraps the @repo/modern-terminal TradingTerminal component with
 * platform-specific authentication and configuration.
 */

import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { TradingTerminal } from '@repo/modern-terminal';
import { useAuth } from '../../context/AuthContext';
import styled from 'styled-components';

// =============================================================================
// CONFIGURATION
// =============================================================================

const MARKET_DATA_WS_URL = import.meta.env.VITE_MARKET_DATA_WS_URL || 'ws://localhost:4002/ws';
const DEFAULT_SYMBOL = import.meta.env.VITE_DEFAULT_SYMBOL || 'btc-usdt';
const TICK_SIZE = parseFloat(import.meta.env.VITE_TICK_SIZE || '0.01');
const EXCHANGE_NAME = import.meta.env.VITE_EXCHANGE_NAME || 'BHC Markets';
const CHARTING_LIBRARY_PATH = import.meta.env.VITE_CHARTING_LIBRARY_PATH || '/charting_library/';

// =============================================================================
// STYLED COMPONENTS
// =============================================================================

const PageContainer = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #1e222d;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background: #1e222d;
  color: #d1d4dc;
  font-size: 18px;

  &::after {
    content: '';
    width: 24px;
    height: 24px;
    margin-left: 12px;
    border: 2px solid transparent;
    border-top-color: #2962ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// =============================================================================
// TRADING PAGE COMPONENT
// =============================================================================

export function TradingPage() {
  const { symbol: routeSymbol } = useParams<{ symbol?: string }>();
  const { loading } = useAuth();

  // Get auth token for authenticated API requests
  const getAuthToken = useCallback((): string | null => {
    return localStorage.getItem('bhc_access_token');
  }, []);

  // Handle trading terminal errors
  const handleError = useCallback((error: Error) => {
    console.error('[TradingPage] Terminal error:', error);
    // Could integrate with a toast notification system here
  }, []);

  // Use route symbol or default
  const symbol = useMemo(() => {
    if (routeSymbol) {
      // Normalize symbol format: BTC-USD -> btc-usd
      return routeSymbol.toLowerCase().replace('/', '-');
    }
    return DEFAULT_SYMBOL;
  }, [routeSymbol]);

  // Memoize config to prevent unnecessary re-renders
  const terminalConfig = useMemo(() => ({
    wsUrl: MARKET_DATA_WS_URL,
    symbol,
    tickSize: TICK_SIZE,
    exchangeName: EXCHANGE_NAME,
    libraryPath: CHARTING_LIBRARY_PATH,
    theme: 'dark' as const,
  }), [symbol]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <LoadingState>
        Loading trading terminal...
      </LoadingState>
    );
  }

  return (
    <PageContainer>
      <TradingTerminal
        wsUrl={terminalConfig.wsUrl}
        symbol={terminalConfig.symbol}
        getAuthToken={getAuthToken}
        tickSize={terminalConfig.tickSize}
        exchangeName={terminalConfig.exchangeName}
        libraryPath={terminalConfig.libraryPath}
        theme={terminalConfig.theme}
        onError={handleError}
      />
    </PageContainer>
  );
}

export default TradingPage;
