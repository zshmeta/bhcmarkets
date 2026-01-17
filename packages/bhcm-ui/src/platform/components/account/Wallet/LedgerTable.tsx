import { useState, useMemo } from 'react';
import { useWalletStore } from '@repo/sdk';
import { useI18n } from '../../i18n';
import { formatTime, formatDate } from '../../../../../../sdk/utils';
import { Icons } from '../Icons';
import type { LedgerFilter, LedgerType } from '../../types/wallet';
import {
  Container,
  HeaderLeft,
  Filters,
  FilterButton,
  TableWrapper,
  Table,
  NumericHeader,
  NumericCell,
  TimeCell,
  TimeWrapper,
  TimeValue,
  DateValue,
  TypeBadge,
  AssetCell,
  AmountValue,
  FeeValue,
  ReferenceCell,
  ReferenceId,
  EmptyState,
  LoadMore,
  LoadMoreButton,
} from './LedgerTable.styles';

/**
 * LEDGER TABLE - Transaction history with filter tabs
 */

const PAGE_SIZE = 20;

const LedgerTable = () => {
  const { t } = useI18n();
  const getFilteredLedger = useWalletStore((state) => state.getFilteredLedger);

  const [filter, setFilter] = useState<LedgerFilter>('all');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  const filteredLedger = useMemo(() => getFilteredLedger(filter), [getFilteredLedger, filter]);
  const displayedLedger = useMemo(() => filteredLedger.slice(0, displayCount), [filteredLedger, displayCount]);
  const hasMore = displayCount < filteredLedger.length;

  const handleLoadMore = () => setDisplayCount((prev) => prev + PAGE_SIZE);

  // formatTime and formatDate are now imported from centralized utils

  const getLedgerTypeLabel = (type: LedgerType): string => {
    const labels = t.wallet?.ledgerTypes as Record<LedgerType, string> | undefined;
    return labels?.[type] || type;
  };

  const getTypeColor = (type: LedgerType): string => {
    switch (type) {
      case 'DEPOSIT': return 'var(--color-success)';
      case 'WITHDRAW_FREEZE':
      case 'WITHDRAW_COMPLETE': return 'var(--color-error)';
      case 'WITHDRAW_REFUND': return 'var(--color-warning)';
      case 'ORDER_FREEZE': return 'var(--color-warning)';
      case 'ORDER_UNFREEZE': return 'var(--color-info)';
      case 'FILL': return 'var(--accent)';
      case 'FEE': return 'var(--text-secondary)';
      default: return 'var(--text-secondary)';
    }
  };

  const filterOptions: { value: LedgerFilter; label: string }[] = [
    { value: 'all', label: t.wallet?.filterAll || 'All' },
    { value: 'deposit', label: t.wallet?.filterDeposit || 'Deposit' },
    { value: 'withdraw', label: t.wallet?.filterWithdraw || 'Withdraw' },
    { value: 'trade', label: t.wallet?.filterTrade || 'Trade' },
    { value: 'fee', label: t.wallet?.filterFee || 'Fee' },
  ];

  return (
    <Container className="card">
      <div className="card-header">
        <HeaderLeft>
          <Icons name="history" size="sm" />
          <span>{t.wallet?.ledger || 'Fund History'}</span>
        </HeaderLeft>
        <Filters>
          {filterOptions.map((option) => (
            <FilterButton
              key={option.value}
              $active={filter === option.value}
              onClick={() => { setFilter(option.value); setDisplayCount(PAGE_SIZE); }}
            >
              {option.label}
            </FilterButton>
          ))}
        </Filters>
      </div>

      <TableWrapper>
        {filteredLedger.length === 0 ? (
          <EmptyState>
            <Icons name="history" size="xl" />
            <span>{t.wallet?.noRecords || 'No records yet'}</span>
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>{t.wallet?.time || 'Time'}</th>
                <th>{t.wallet?.type || 'Type'}</th>
                <th>{t.wallet?.asset || 'Asset'}</th>
                <NumericHeader>{t.wallet?.amount || 'Amount'}</NumericHeader>
                <NumericHeader>{t.orders?.fee || 'Fee'}</NumericHeader>
                <th>{t.wallet?.reference || 'Reference'}</th>
              </tr>
            </thead>
            <tbody>
              {displayedLedger.map((entry) => (
                <tr key={entry.entryId}>
                  <TimeCell>
                    <TimeWrapper>
                      <TimeValue>{formatTime(entry.createdAt)}</TimeValue>
                      <DateValue>{formatDate(entry.createdAt)}</DateValue>
                    </TimeWrapper>
                  </TimeCell>
                  <td>
                    <TypeBadge $color={getTypeColor(entry.type)}>
                      {getLedgerTypeLabel(entry.type)}
                    </TypeBadge>
                  </td>
                  <AssetCell>{entry.asset}</AssetCell>
                  <NumericCell>
                    <AmountValue $positive={entry.direction === '+'}>
                      {entry.direction}{entry.amount}
                    </AmountValue>
                  </NumericCell>
                  <NumericCell>
                    {parseFloat(entry.fee) > 0 ? <FeeValue>-{entry.fee}</FeeValue> : '-'}
                  </NumericCell>
                  <ReferenceCell>
                    <ReferenceId title={entry.referenceId}>
                      {entry.referenceId.slice(0, 12)}...
                    </ReferenceId>
                  </ReferenceCell>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {hasMore && (
          <LoadMore>
            <LoadMoreButton onClick={handleLoadMore}>
              {t.wallet?.loadMore || 'Load More'}
            </LoadMoreButton>
          </LoadMore>
        )}
      </TableWrapper>
    </Container>
  );
}

export { LedgerTable };
