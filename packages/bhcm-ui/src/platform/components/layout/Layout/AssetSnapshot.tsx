import { useMemo, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '@repo/sdk';
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
 */

export const AssetSnapshot: FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const balances = useWalletStore((state) => state.balances);
  const getTotalEquity = useWalletStore((state) => state.getTotalEquity);

  const equity = useMemo(() => {
    return getTotalEquity({});
  }, [balances, getTotalEquity]);

  const hasFunds = parseFloat(equity) > 0;

  return (
    <Container onClick={() => navigate('/assets')}>
      <Item>
        <Label>{t.account.totalValue}</Label>
        <ValueWrapper>
          <Value className="tabular-nums">{equity}</Value>
          <Unit>USDT</Unit>
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
