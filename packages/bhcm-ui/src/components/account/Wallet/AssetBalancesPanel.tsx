import { useMemo, useState } from 'react';
import Decimal from 'decimal.js';
import { useWalletStore, selectBalances } from '../../store/walletStore';
import { useI18n } from '../../i18n';
import { Icons } from '../Icons';
import {
  Container,
  HeaderLeft,
  HeaderActions,
  SearchWrapper,
  SearchInput,
  FilterBar,
  CheckboxLabel,
  ActionButton,
  TableWrapper,
  Table,
  NumericHeader,
  NumericCell,
  FrozenCell,
  AssetCell,
  AssetIcons,
  AssetName,
  EmptyRow,
  EmptyState,
  DepositButton,
} from './AssetBalancesPanel.styles';

/**
 * ASSET BALANCES PANEL - Table of all user assets
 */

interface AssetBalancesPanelProps {
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

const AssetBalancesPanel = ({ onDeposit, onWithdraw }: AssetBalancesPanelProps) => {
  const { t } = useI18n();
  const balances = useWalletStore(selectBalances);

  const [search, setSearch] = useState('');
  const [hideSmall, setHideSmall] = useState(false);

  const displayBalances = useMemo(() => {
    return balances.filter((b) => {
      const matchesSearch = b.asset.toLowerCase().includes(search.toLowerCase());
      const isNotSmall = !hideSmall || new Decimal(b.total).gt(0.00000001);
      const isEssential = b.asset === 'USDT' || new Decimal(b.total).gt(0);
      return matchesSearch && (hideSmall ? isNotSmall : isEssential);
    });
  }, [balances, search, hideSmall]);

  const hasAnyBalance = useMemo(() => {
    return balances.some((b) => new Decimal(b.total).gt(0));
  }, [balances]);

  const formatAmount = (amount: string, asset: string) => {
    const dec = new Decimal(amount);
    if (asset === 'USDT') return dec.toFixed(2);
    if (dec.eq(0)) return '0';
    if (dec.lt(0.0001)) return dec.toExponential(4);
    return dec.toFixed(8).replace(/\.?0+$/, '');
  };

  return (
    <Container className="card">
      <div className="card-header">
        <HeaderLeft>
          <Icons name="wallet" size="sm" />
          <span>{t.wallet?.assetBalances || 'Asset Balances'}</span>
        </HeaderLeft>
        <HeaderActions>
          <SearchWrapper>
            <Icons name="search" size="sm" />
            <SearchInput
              type="text"
              placeholder={t.wallet?.searchAssets || 'Search...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchWrapper>
          <ActionButton onClick={onDeposit} title={t.wallet?.deposit || 'Deposit'}>
            <Icons name="download" size="sm" />
            <span>{t.wallet?.deposit || 'Deposit'}</span>
          </ActionButton>
          <ActionButton onClick={onWithdraw} disabled={!hasAnyBalance} title={t.wallet?.withdraw || 'Withdraw'}>
            <Icons name="upload" size="sm" />
            <span>{t.wallet?.withdraw || 'Withdraw'}</span>
          </ActionButton>
        </HeaderActions>
      </div>

      <FilterBar>
        <CheckboxLabel>
          <input type="checkbox" checked={hideSmall} onChange={(e) => setHideSmall(e.target.checked)} />
          <span>{t.wallet?.hideSmallBalances || 'Hide small balances'}</span>
        </CheckboxLabel>
      </FilterBar>

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <th>{t.wallet?.asset || 'Asset'}</th>
              <NumericHeader>{t.wallet?.available || 'Available'}</NumericHeader>
              <NumericHeader>{t.wallet?.frozen || 'Frozen'}</NumericHeader>
              <NumericHeader>{t.wallet?.total || 'Total'}</NumericHeader>
            </tr>
          </thead>
          <tbody>
            {displayBalances.length === 0 ? (
              <EmptyRow>
                <td colSpan={4}>
                  <EmptyState>
                    <Icons name="wallet" size="lg" />
                    <span>{t.wallet?.noAssets || 'No assets yet'}</span>
                    <DepositButton onClick={onDeposit}>
                      {t.wallet?.depositNow || 'Deposit Now'}
                    </DepositButton>
                  </EmptyState>
                </td>
              </EmptyRow>
            ) : (
              displayBalances.map((balance) => {
                const hasFrozen = new Decimal(balance.frozen).gt(0);
                return (
                  <tr key={balance.asset}>
                    <td>
                      <AssetCell>
                        <AssetIcons>{balance.asset[0]}</AssetIcons>
                        <AssetName>{balance.asset}</AssetName>
                      </AssetCell>
                    </td>
                    <NumericCell>{formatAmount(balance.available, balance.asset)}</NumericCell>
                    <FrozenCell $frozen={hasFrozen}>
                      {hasFrozen ? formatAmount(balance.frozen, balance.asset) : '-'}
                    </FrozenCell>
                    <NumericCell>{formatAmount(balance.total, balance.asset)}</NumericCell>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </TableWrapper>
    </Container>
  );
}

export default AssetBalancesPanel;
