import { useMemo, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore, useAuthStore } from '@repo/sdk';
import { useI18n } from '../../i18n';
import { Icons } from '../Icons';
import {
  Container,
  Item,
  Label,
  ValueWrapper,
  Value,
  Unit,
  Warning,
} from './AssetSnapshot.styles';

/**
 * ASSET SNAPSHOT - Quick equity display in header
 * Navigates to assets on click
 * Hidden when user is not authenticated
 */

export const AssetSnapshot: FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { t } = useI18n();
  const navigate = useNavigate();
  const balances = useWalletStore((state) => state.balances);
  const getTotalEquity = useWalletStore((state) => state.getTotalEquity);

  const equity = useMemo(() => {
    return getTotalEquity({});
  }, [balances, getTotalEquity]);

  const hasFunds = parseFloat(equity) > 0;

  // Hide when not logged in
  if (!isAuthenticated) return null;

  return (
    <Container onClick={() => navigate('/assets')}>
      <Item>
        <Label>{t.account.totalValue}</Label>
        <ValueWrapper>
          <Value className="tabular-nums">{equity}</Value>
          <Unit>USD</Unit>
        </ValueWrapper>
      </Item>

      {!hasFunds && (
        <Warning title={t.wallet?.noFundsDesc}>
          <Icons name="alert-triangle" size="xs" />
        </Warning>
      )}
    </Container>
  );
};
