import { useMemo } from 'react';
import { useWalletStore, selectAccount, selectBalances } from '../../store/walletStore';
import { useWatchlistStore, selectSymbols } from '../../store/watchlistStore';
import { useI18n } from '../../i18n';
import { Icons } from '../Icons';
import Decimal from 'decimal.js';
import {
  Container,
  Content,
  TopSection,
  EquitySection,
  EquityLabel,
  EquityValue,
  CurrencySymbol,
  ChartSection,
  PieChart,
  DetailsGrid,
  DetailItem,
  DetailLabel,
  DetailValue,
  StatusBadge,
  StatusDot,
  AllocationList,
  AllocationItem,
  AllocationLabel,
  ColorDot,
  AllocationValue,
  EmptyState,
} from './AccountOverviewCard.styles';

/**
 * ACCOUNT OVERVIEW CARD
 * Shows total equity with pie chart allocation breakdown.
 */

const ASSET_COLORS: Record<string, string> = {
  USDT: 'var(--color-price-up)',
  BTC: '#F7931A',
  ETH: '#627EEA',
  BNB: '#F3BA2F',
  SOL: '#9945FF',
  XRP: '#23292F',
  ADA: '#0033AD',
  DOGE: '#C2A633',
  DEFAULT: 'var(--text-tertiary)',
};

const AccountOverviewCard = () => {
  const { t } = useI18n();
  const account = useWalletStore(selectAccount);
  const balances = useWalletStore(selectBalances);
  const getTotalEquity = useWalletStore((state) => state.getTotalEquity);
  const symbols = useWatchlistStore(selectSymbols);

  const prices = useMemo(() => {
    const map: Record<string, string> = {};
    for (const sym of symbols) {
      if (sym.price) map[sym.symbol] = sym.price;
    }
    return map;
  }, [symbols]);

  const totalEquity = useMemo(() => getTotalEquity(prices), [getTotalEquity, prices]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'var(--color-success)';
      case 'pending': return 'var(--color-warning)';
      case 'suspended': return 'var(--color-error)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return t.wallet?.statusActive || 'Active';
      case 'pending': return t.wallet?.statusPending || 'Pending';
      case 'suspended': return t.wallet?.statusSuspended || 'Suspended';
      default: return status;
    }
  };

  const allocation = useMemo(() => {
    const totalEquityNum = parseFloat(totalEquity.replace(/,/g, ''));
    if (totalEquityNum <= 0) return [];

    const items: { label: string; value: number; usdValue: number; color: string }[] = [];

    for (const balance of balances) {
      const qty = new Decimal(balance.total);
      if (qty.lte(0)) continue;

      let usdValue: number;
      if (balance.asset === 'USDT') {
        usdValue = qty.toNumber();
      } else {
        const symbol = `${balance.asset}USDT`;
        const price = prices[symbol];
        if (!price) continue;
        usdValue = qty.mul(new Decimal(price)).toNumber();
      }

      if (usdValue > 0) {
        items.push({
          label: balance.asset,
          value: (usdValue / totalEquityNum) * 100,
          usdValue,
          color: ASSET_COLORS[balance.asset] || ASSET_COLORS.DEFAULT,
        });
      }
    }

    return items.sort((a, b) => b.usdValue - a.usdValue).slice(0, 5);
  }, [balances, prices, totalEquity]);

  if (!account) return null;

  return (
    <Container className="card">
      <div className="card-header">
        <Icons name="briefcase" size="sm" />
        <span>{t.wallet?.accountOverview || 'Account Overview'}</span>
      </div>
      <Content>
        <TopSection>
          <EquitySection>
            <EquityLabel>{t.wallet?.totalEquity || 'Total Equity'}</EquityLabel>
            <EquityValue>
              <CurrencySymbol>$</CurrencySymbol>
              {totalEquity}
            </EquityValue>
          </EquitySection>

          <ChartSection>
            <PieChart viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--border-subtle)"
                strokeWidth="3"
              />
              {allocation.map((item, i) => {
                const total = allocation.reduce((sum, a) => sum + a.value, 0);
                const before = allocation.slice(0, i).reduce((sum, a) => sum + a.value, 0);
                const dashArray = `${(item.value / total) * 100} 100`;
                const dashOffset = `-${(before / total) * 100}`;
                return (
                  <path
                    key={item.label}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={item.color}
                    strokeWidth="3"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                  />
                );
              })}
            </PieChart>
          </ChartSection>
        </TopSection>

        <DetailsGrid>
          <DetailItem>
            <DetailLabel>{t.wallet?.accountId || 'Account ID'}</DetailLabel>
            <DetailValue>{account.accountId}</DetailValue>
          </DetailItem>

          <DetailItem>
            <DetailLabel>{t.wallet?.accountStatus || 'Status'}</DetailLabel>
            <StatusBadge $color={getStatusColor(account.status)}>
              <StatusDot $color={getStatusColor(account.status)} />
              {getStatusText(account.status)}
            </StatusBadge>
          </DetailItem>
        </DetailsGrid>

        <AllocationList>
          {allocation.length > 0 ? (
            allocation.map((item) => (
              <AllocationItem key={item.label}>
                <AllocationLabel>
                  <ColorDot $color={item.color} />
                  {item.label}
                </AllocationLabel>
                <AllocationValue>{item.value.toFixed(1)}%</AllocationValue>
              </AllocationItem>
            ))
          ) : (
            <EmptyState>{t.wallet?.noAssets || 'No assets'}</EmptyState>
          )}
        </AllocationList>
      </Content>
    </Container>
  );
}

export { AccountOverviewCard };
