import { useMemo } from 'react';
import { useMarketStore, selectMetrics, selectDataConfidence } from '@repo/sdk';
import { useTradingStore } from '@repo/sdk';
import { useWalletStore } from '@repo/sdk';
import { useWatchlistStore, selectSelectedSymbol } from '@repo/sdk';
import { useI18n } from '../../i18n';
import { Icons } from '../Icons';
import { RiskBanner } from '../RiskBanner';
import { formatPrice } from '../../services/marketDataService';
import {
  Container, Section, SectionHeader, TitleGroup, SectionTitle, MetricsGrid, MetricItem,
  MetricLabel, MetricValue, PositionCard, PosHeader, PosSymbol, PosBase, PosSide, PosPnl,
  PnlVal, PnlPct, PosGrid, PosItem, PosLabel, PosValue, PosActions, PosActionBtn,
  EmptyState, QuickActions, QuickBuy, BalanceInfo, BalanceRow, BalanceLabel, BalanceValue,
  RiskCard, ConfidenceBadge,
} from './TradeOverview.styles';

/**
 * TRADE OVERVIEW - Mobile trading dashboard
 */

interface TradeOverviewProps {
  onTradeClick?: (side: 'buy' | 'sell') => void;
}

const TradeOverview = ({ onTradeClick }: TradeOverviewProps) => {
  const { t } = useI18n();
  const metrics = useMarketStore(selectMetrics);
  const dataConfidence = useMarketStore(selectDataConfidence);
  const selectedSymbol = useWatchlistStore(selectSelectedSymbol);
  const positions = useTradingStore((state) => state.positions);
  const balances = useWalletStore((state) => state.balances);

  const baseAsset = selectedSymbol.replace('USDT', '');
  const currentPosition = positions.get(selectedSymbol);

  const displayMetrics = useMemo(() => {
    if (!metrics) return [];
    return [
      { label: t.metrics?.midPrice || 'Mid', value: formatPrice(parseFloat(metrics.mid)) },
      { label: t.metrics?.spread || 'Spread', value: `${(metrics.spreadBps || 0).toFixed(2)} bps` },
      {
        label: t.metrics?.imbalance || 'Imbalance', value: `${((metrics.bidAskImbalance || 0) * 100).toFixed(1)}%`,
        trend: (metrics.bidAskImbalance || 0) > 0.1 ? 'up' : (metrics.bidAskImbalance || 0) < -0.1 ? 'down' : 'neutral' as const
      },
      { label: t.metrics?.volatility || 'Volatility', value: (metrics.microVolatility || 0).toFixed(4) },
      { label: t.metrics?.liquidityScore || 'Liquidity', value: `${(metrics.liquidityScore || 0).toFixed(0)}/100` },
      { label: t.metrics?.slippageEst || 'Slippage', value: metrics.slippageEst === 'N/A' ? 'N/A' : `${metrics.slippageEst} bps` },
    ];
  }, [metrics, t]);

  const positionInfo = useMemo(() => {
    if (!currentPosition || !metrics?.mid) return null;
    const currentPrice = parseFloat(metrics.mid);
    const avgEntryPrice = parseFloat(currentPosition.avgEntryPrice);
    const qty = parseFloat(currentPosition.quantity);
    if (qty <= 0) return null;

    const pnl = (currentPrice - avgEntryPrice) * qty;
    const pnlPercent = ((currentPrice - avgEntryPrice) / avgEntryPrice) * 100;
    return { qty, avgEntryPrice, currentPrice, pnl, pnlPercent, value: qty * currentPrice };
  }, [currentPosition, metrics?.mid]);

  return (
    <Container>
      <Section>
        <SectionHeader>
          <TitleGroup><Icons name="activity" size="sm" /><SectionTitle>{t.metrics?.title || 'Market Insights'}</SectionTitle></TitleGroup>
          {dataConfidence?.level !== 'live' && <ConfidenceBadge $level={dataConfidence?.level || 'stale'}>{dataConfidence?.level.toUpperCase()}</ConfidenceBadge>}
        </SectionHeader>
        <MetricsGrid>
          {displayMetrics.map((m, i) => (
            <MetricItem key={i}><MetricLabel>{m.label}</MetricLabel><MetricValue $trend={m.trend}>{m.value}</MetricValue></MetricItem>
          ))}
        </MetricsGrid>
      </Section>

      <Section>
        <SectionHeader><TitleGroup><Icons name="pie-chart" size="sm" /><SectionTitle>{t.positions?.title || 'Current Position'}</SectionTitle></TitleGroup></SectionHeader>
        {positionInfo ? (
          <PositionCard $positive={positionInfo.pnl >= 0}>
            <PosHeader>
              <PosSymbol><PosBase>{baseAsset}</PosBase><PosSide $positive={positionInfo.pnl >= 0}>LONG</PosSide></PosSymbol>
              <PosPnl>
                <PnlVal>{positionInfo.pnl >= 0 ? '+' : ''}{positionInfo.pnl.toFixed(2)} USDT</PnlVal>
                <PnlPct $positive={positionInfo.pnl >= 0}>({positionInfo.pnlPercent >= 0 ? '+' : ''}{positionInfo.pnlPercent.toFixed(2)}%)</PnlPct>
              </PosPnl>
            </PosHeader>
            <PosGrid>
              <PosItem><PosLabel>Size</PosLabel><PosValue>{positionInfo.qty.toFixed(4)} {baseAsset}</PosValue></PosItem>
              <PosItem><PosLabel>Entry Price</PosLabel><PosValue>${positionInfo.avgEntryPrice.toFixed(2)}</PosValue></PosItem>
              <PosItem><PosLabel>Market Value</PosLabel><PosValue>${positionInfo.value.toFixed(2)}</PosValue></PosItem>
              <PosItem><PosLabel>Mark Price</PosLabel><PosValue>${positionInfo.currentPrice.toFixed(2)}</PosValue></PosItem>
            </PosGrid>
            <PosActions>
              <PosActionBtn onClick={() => onTradeClick?.('buy')}><Icons name="edit" size="sm" />{t.common?.edit || 'Adjust'}</PosActionBtn>
              <PosActionBtn $marketClose onClick={() => onTradeClick?.('sell')}><Icons name="zap" size="sm" />{t.positions?.closeAll || 'Market Close'}</PosActionBtn>
            </PosActions>
          </PositionCard>
        ) : (
          <EmptyState>
            <p>{t.positions?.noPositions || 'No active position for this pair'}</p>
            <QuickActions><QuickBuy onClick={() => onTradeClick?.('buy')}>{t.OrderForm?.buy || 'Buy'} {baseAsset}</QuickBuy></QuickActions>
          </EmptyState>
        )}
      </Section>

      <Section>
        <SectionHeader><TitleGroup><Icons name="shield" size="sm" /><SectionTitle>{t.RiskBanner?.title || 'Risk Management'}</SectionTitle></TitleGroup></SectionHeader>
        <RiskCard><RiskBanner /></RiskCard>
      </Section>

      <Section>
        <SectionHeader><TitleGroup><Icons name="wallet" size="sm" /><SectionTitle>{t.wallet?.accountOverview || 'Wallet'}</SectionTitle></TitleGroup></SectionHeader>
        <BalanceInfo>
          <BalanceRow><BalanceLabel>{t.account?.available || 'Available USDT'}</BalanceLabel><BalanceValue>${balances.find(b => b.asset === 'USDT')?.available || '0'}</BalanceValue></BalanceRow>
          <BalanceRow><BalanceLabel>{baseAsset} {t.account?.balance || 'Balance'}</BalanceLabel><BalanceValue>{balances.find(b => b.asset === baseAsset)?.total || '0'} {baseAsset}</BalanceValue></BalanceRow>
        </BalanceInfo>
      </Section>
    </Container>
  );
}

export { TradeOverview };
