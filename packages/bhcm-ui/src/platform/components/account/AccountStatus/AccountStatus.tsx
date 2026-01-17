import { useMemo } from 'react';
import Decimal from 'decimal.js';
import { useTradingStore } from '@repo/sdk';
import { useWalletStore, selectBalances } from '@repo/sdk';
import { useMarketStore, selectMetrics, selectLevel2Book } from '@repo/sdk';
import { useWatchlistStore, selectSelectedSymbol } from '@repo/sdk';
import { useI18n } from '../../i18n';
import { Icons } from '../Icons';
import {
  Container,
  Item,
  Label,
  Value,
  PnlValue,
  PnlPercent,
  Divider,
  WarningIcons,
} from './AccountStatus.styles';

/* ═══════════════════════════════════════════════════════════
 * ACCOUNT RIBBON
 * ═══════════════════════════════════════════════════════════
 * Compact horizontal display of key account metrics:
 * - Total portfolio value
 * - Available USDT balance
 * - Position value
 * - Unrealized P&L with percentage
 */

interface AccountMetrics {
  totalValue: Decimal;
  availableUsdt: Decimal;
  positionValue: Decimal;
  unrealizedPnl: Decimal;
  unrealizedPnlPercent: number;
  hasRealTimePrice: boolean;
}

const AccountStatus = () => {
  const { t } = useI18n();
  const balances = useWalletStore(selectBalances);
  const positions = useTradingStore((state) => state.positions);
  const metrics = useMarketStore(selectMetrics);
  const Level2Book = useMarketStore(selectLevel2Book);
  const selectedSymbol = useWatchlistStore(selectSelectedSymbol);

  const currentSymbol = Level2Book?.symbol || selectedSymbol;
  const currentSymbolMidPrice = metrics ? new Decimal(metrics.mid) : new Decimal(0);

  const accountMetrics = useMemo((): AccountMetrics => {
    const usdtBalance = balances.find((b) => b.asset === 'USDT');
    const usdtTotal = new Decimal(usdtBalance?.total ?? '0');
    const usdtAvailable = new Decimal(usdtBalance?.available ?? '0');

    // Extract positions from Map or plain object
    let positionEntries: [string, any][] = [];
    if (positions instanceof Map) {
      positionEntries = Array.from(positions.entries());
    } else if (typeof positions === 'object' && positions !== null) {
      positionEntries = Object.entries(positions);
    }

    let totalPositionValue = new Decimal(0);
    let totalUnrealizedPnl = new Decimal(0);
    let hasRealTimePrice = true;

    positionEntries
      .filter(([_, pos]) => {
        if (!pos || pos.quantity === undefined || pos.avgEntryPrice === undefined) return false;
        return pos.side === 'long' && new Decimal(pos.quantity).gt(0);
      })
      .forEach(([symbol, pos]) => {
        const qty = new Decimal(pos.quantity || '0');
        const avgEntry = new Decimal(pos.avgEntryPrice || '0');

        const isCurrentSymbol = symbol === currentSymbol;
        const currentPrice = isCurrentSymbol ? currentSymbolMidPrice : avgEntry;
        const hasPrice = isCurrentSymbol && currentSymbolMidPrice.gt(0);

        const value = qty.times(currentPrice);
        const unrealizedPnl = hasPrice ? qty.times(currentPrice.minus(avgEntry)) : new Decimal(0);

        if (hasPrice) {
          totalPositionValue = totalPositionValue.plus(value);
          totalUnrealizedPnl = totalUnrealizedPnl.plus(unrealizedPnl);
        } else {
          totalPositionValue = totalPositionValue.plus(qty.times(avgEntry));
          if (isCurrentSymbol) hasRealTimePrice = false;
        }
      });

    const totalAccountValue = usdtTotal.plus(totalPositionValue);
    const unrealizedPnlPercent = totalAccountValue.gt(0)
      ? totalUnrealizedPnl.div(totalAccountValue).times(100).toNumber()
      : 0;

    return {
      totalValue: totalAccountValue,
      availableUsdt: usdtAvailable,
      positionValue: totalPositionValue,
      unrealizedPnl: totalUnrealizedPnl,
      unrealizedPnlPercent,
      hasRealTimePrice,
    };
  }, [balances, positions, currentSymbol, currentSymbolMidPrice]);

  const formatUSDT = (value: Decimal): string => value.toFixed(2);
  const pnlIsPositive = accountMetrics.unrealizedPnl.gte(0);

  return (
    <Container>
      <Item>
        <Label>{t.account?.totalValue || 'Total'}</Label>
        <Value className="tabular-nums">${formatUSDT(accountMetrics.totalValue)}</Value>
      </Item>

      <Divider />

      <Item>
        <Label>{t.account?.available || 'Available'}</Label>
        <Value className="tabular-nums">${formatUSDT(accountMetrics.availableUsdt)}</Value>
      </Item>

      <Divider />

      <Item>
        <Label>Position</Label>
        <Value className="tabular-nums">${formatUSDT(accountMetrics.positionValue)}</Value>
      </Item>

      <Divider />

      <Item>
        <Label>{t.positions?.unrealizedPnL || 'Unrealized P&L'}</Label>
        <Value $positive={pnlIsPositive} $negative={!pnlIsPositive} className="tabular-nums">
          <PnlValue>
            {pnlIsPositive ? '+' : ''}
            {formatUSDT(accountMetrics.unrealizedPnl)}
            <PnlPercent>
              ({pnlIsPositive ? '+' : ''}
              {accountMetrics.unrealizedPnlPercent.toFixed(2)}%)
            </PnlPercent>
          </PnlValue>
        </Value>
      </Item>

      {!accountMetrics.hasRealTimePrice && (
        <WarningIcons title="No real-time price">
          <Icons name="alert-circle" size="xs" />
        </WarningIcons>
      )}
    </Container>
  );
}

export { AccountStatus };
