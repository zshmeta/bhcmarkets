import { useState, useRef, createRef } from 'react';
import { GlobalStyles } from './platform/components/theme/globalStyles';

// View components (presentational only)
import { PositionsView } from './components-refactored/Positions/Positions.view';
import { Level2BookView } from './components-refactored/Level2Book/Level2Book.view';
import { OrderFormView } from './components-refactored/OrderForm/OrderForm.view';
import { WatchlistView } from './components-refactored/Watchlist/Watchlist.view';
import { RiskBannerView } from './components-refactored/RiskBanner/RiskBanner.view';

// Types for mock data
import type { Position, BalanceInfo, PositionsTranslations } from './components-refactored/Positions/usePositions';
import type { Level2BookMetrics, DataConfidenceState } from './components-refactored/Level2Book/useLevel2Book';
import type { Level2BookLevel } from './types/market';

/* ═══════════════════════════════════════════════════════════
 * MOCK DATA - For design preview
 * ═══════════════════════════════════════════════════════════ */

const mockPositions: [string, Position][] = [
  ['BTCUSDT', { symbol: 'BTCUSDT', side: 'long', quantity: '0.0532', avgEntryPrice: '42350.00' }],
  ['ETHUSDT', { symbol: 'ETHUSDT', side: 'long', quantity: '1.2500', avgEntryPrice: '2280.50' }],
];

const mockBalance: BalanceInfo = { asset: 'USDT', available: '15420.50', locked: '2500.00' };

const mockPositionsT: PositionsTranslations = {
  title: 'Positions', noPositions: 'No open positions', symbol: 'Symbol',
  quantity: 'Qty', entryPrice: 'Entry', marketPrice: 'Mark', pnl: 'P&L', actions: 'Actions',
};

const mockBids: Level2BookLevel[] = [
  { price: '42350.00', quantity: '1.234' }, { price: '42345.00', quantity: '2.156' },
  { price: '42340.00', quantity: '0.854' }, { price: '42335.00', quantity: '3.421' },
  { price: '42330.00', quantity: '1.678' },
];

const mockAsks: Level2BookLevel[] = [
  { price: '42355.00', quantity: '0.956' }, { price: '42360.00', quantity: '1.832' },
  { price: '42365.00', quantity: '2.451' }, { price: '42370.00', quantity: '0.765' },
  { price: '42375.00', quantity: '1.123' },
];

const mockLevel2BookMetrics: Level2BookMetrics = { spread: 5, spreadBps: 1.18, midPrice: 42352.5, bidTotal: 9.343, askTotal: 7.127, imbalance: 0.13 };

const mockConfidence: DataConfidenceState = { level: 'live', reason: '', isResyncing: false, isStale: false };

/* ═══════════════════════════════════════════════════════════
 * COMPONENT PREVIEWS
 * ═══════════════════════════════════════════════════════════ */

type ComponentKey = 'positions' | 'Level2Book' | 'OrderForm' | 'watchlist' | 'risk';

const COMPONENTS: { key: ComponentKey; label: string }[] = [
  { key: 'positions', label: 'Positions' },
  { key: 'Level2Book', label: 'Order Book' },
  { key: 'OrderForm', label: 'Order Entry' },
  { key: 'watchlist', label: 'Watchlist' },
  { key: 'risk', label: 'Risk Ribbon' },
];

function App() {
  const [activeComponent, setActiveComponent] = useState<ComponentKey>('positions');
  const inputRef = useRef<HTMLInputElement>(null);

  const renderComponent = () => {
    switch (activeComponent) {
      case 'positions':
        return (
          <PositionsView
            positions={mockPositions}
            currentSymbol="BTCUSDT"
            currentPrice={42380.50}
            totalPnL={162.47}
            usdtBalance={mockBalance}
            translations={mockPositionsT}
            confirmClose={null}
            tpslSymbol={null}
            calculatePnL={(pos) => ({ pnl: 162.47, pnlPercent: 0.72, hasPrice: true })}
            onSetConfirmClose={() => { }}
            onSetTPSLSymbol={() => { }}
            onClosePosition={() => { }}
            onResetWallet={() => { }}
          />
        );

      case 'Level2Book':
        return (
          <Level2BookView
            bids={mockBids}
            asks={mockAsks}
            metrics={mockLevel2BookMetrics}
            confidence={mockConfidence}
            maxQuantities={{ bids: 3.5, asks: 2.5 }}
            prevPriceMap={new Map()}
            translations={{ title: 'Order Book', price: 'Price', amount: 'Amount', buyOrders: 'Bids', sellOrders: 'Asks' }}
            onPriceClick={() => { }}
          />
        );

      case 'OrderForm':
        return (
          <OrderFormView
            form={{
              side: 'buy', orderCategory: 'spot', type: 'limit', price: '42350.00', quantity: '0.1',
              total: '4235.00', quantityPercent: 25, takeProfitPrice: '', stopLossPrice: '',
              triggerPrice: '', limitPrice: '', ocoLimitPrice: '', ocoStopPrice: '', ocoStopLimitPrice: '',
              trailingType: 'percent', trailingValue: '', trailingActivationPrice: '',
            }}
            baseAsset="BTC"
            quoteAsset="USDT"
            balances={{ base: { available: '0.5', locked: '0' }, quote: { available: '15420.50', locked: '2500' } }}
            dataConfidence={{ level: 'live', reason: '' }}
            focusMode={false}
            estimated={{ price: '42,350.00', slippage: '0.01%', fee: '4.24 USDT' }}
            isSubmitDisabled={false}
            showDegradedConfirm={false}
            showAllInConfirm={false}
            translations={{
              title: 'Order Entry', buy: 'Buy', sell: 'Sell', limit: 'Limit', market: 'Market',
              price: 'Price', amount: 'Amount', total: 'Total', available: 'Available',
              takeProfit: 'TP', stopLoss: 'SL', bid1: 'Bid', mid: 'Mid', ask1: 'Ask',
              estimatedPrice: 'Est. Price', slippage: 'Slippage', fee: 'Fee',
              allInBuy: 'All-In Buy', allInSell: 'All-In Sell', confirmDegraded: 'Confirm trade?',
            }}
            priceInputRef={createRef()}
            quantityInputRef={createRef()}
            tpInputRef={createRef()}
            slInputRef={createRef()}
            onSideChange={() => { }} onOrderCategoryChange={() => { }} onTypeChange={() => { }}
            onPriceChange={() => { }} onQuantityChange={() => { }} onTakeProfitPriceChange={() => { }}
            onStopLossPriceChange={() => { }} onTriggerPriceChange={() => { }} onLimitPriceChange={() => { }}
            onOcoLimitPriceChange={() => { }} onOcoStopPriceChange={() => { }} onOcoStopLimitPriceChange={() => { }}
            onTrailingTypeChange={() => { }} onTrailingValueChange={() => { }} onTrailingActivationPriceChange={() => { }}
            onQuantityPercentChange={() => { }} onSetFromBestBid={() => { }} onSetFromBestAsk={() => { }}
            onSetFromMid={() => { }} onStepUp={() => { }} onStepDown={() => { }}
            onUpdateQuantityFromPercent={() => { }} onInputFocus={() => () => { }} onInputBlur={() => { }}
            onSubmit={(e) => e.preventDefault()} onShowDegradedConfirm={() => { }} onShowAllInConfirm={() => { }}
            onAllInConfirm={() => { }} formatBuyOrderText={(a) => `Buy ${a}`} formatSellOrderText={(a) => `Sell ${a}`}
            commonConfirm="Confirm" commonCancel="Cancel"
          />
        );

      case 'watchlist':
        return (
          <WatchlistView
            symbols={[
              { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', price: '42380.50', priceChange24h: 2.34 },
              { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', price: '2295.80', priceChange24h: -1.12 },
              { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', price: '98.45', priceChange24h: 5.67 },
            ]}
            selectedSymbol="BTCUSDT"
            favorites={['BTCUSDT']}
            pinned={[]}
            searchQuery=""
            showFavoritesOnly={false}
            getPosition={() => undefined}
            translations={{
              title: 'Watchlist', searchPlaceholder: 'Search...', all: 'All', favorites: 'Favorites',
              showAll: 'Show all', showFavorites: 'Show favorites', noResults: 'No results', empty: 'Empty', symbols: 'symbols',
            }}
            inputRef={inputRef}
            onSymbolSelect={() => { }} onSearchChange={() => { }} onClearSearch={() => { }}
            onToggleFavoritesFilter={() => { }} onToggleFavorite={() => { }} onKeyDown={() => { }}
          />
        );

      case 'risk':
        return (
          <RiskBannerView
            riskMetrics={{ positionSizePercent: 35, unrealizedPnlPercent: 2.45 }}
            overallRisk={32}
            riskLevel="low"
            riskLabel="Low Risk"
            riskDescription="Portfolio is well-balanced"
            performanceMetrics={{ winRate: 0.62, profitFactor: 1.85, maxDrawdown: 8.5, totalRealizedPnl: '1,245.67' }}
            marketMetrics={{ microVolatility: 0.0234, liquidityScore: 78 }}
            translations={{
              title: 'Risk Score', positionRatio: 'Position Ratio', unrealizedPnL: 'Unrealized P&L',
              winRate: 'Win Rate', profitFactor: 'Profit Factor', maxDrawdown: 'Max DD', totalRealizedPnl: 'Total Realized',
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', padding: '24px', background: 'var(--bg-primary)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
          BHCM-UI Component Preview
        </h1>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {COMPONENTS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveComponent(key)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                borderRadius: '6px',
                border: activeComponent === key ? '1px solid var(--color-accent)' : '1px solid var(--border)',
                background: activeComponent === key ? 'var(--color-accent)' : 'var(--bg-secondary)',
                color: activeComponent === key ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Component Preview */}
        <div style={{ maxWidth: '500px', minHeight: '400px' }}>
          {renderComponent()}
        </div>
      </div>
    </>
  );
}

export default App;
