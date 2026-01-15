import { useState, useMemo } from 'react';
import Decimal from 'decimal.js';
import { useWalletStore, selectPaymentMethods, selectCryptoAddresses, selectBalances, selectWithdraws } from '../../store/walletStore';
import { useI18n } from '../../i18n';
import { Icons } from '../Icons';
import { StatusCard } from './StatusCard';
import {
  Overlay, Drawer, Header, Title, CloseButton, Content,
  WarningCard, WarningInfo, AddSourceBtn, Field, LabelRow, Label, MaxButton,
  AmountInputWrapper, Input, AmountSuffix, Error, FeeRow, FeeLabel, FeeValue,
  ReceiveRow, ReceiveLabel, ReceiveValue, Select, DestinationTypeButtons,
  DestinationTypeButton, NoDestinationsHint, SubmitButton, DoneButton,
} from './WithdrawDrawer.styles';

/**
 * WITHDRAW DRAWER - Slide-in panel for withdrawing funds
 */

interface WithdrawDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WITHDRAW_FEE_RATE = 0.001;
const MIN_WITHDRAW_FEE = 1;

const WithdrawDrawer = ({ isOpen, onClose }: WithdrawDrawerProps) => {
  const { t } = useI18n();
  const paymentMethods = useWalletStore(selectPaymentMethods);
  const cryptoAddresses = useWalletStore(selectCryptoAddresses);
  const balances = useWalletStore(selectBalances);
  const withdraws = useWalletStore(selectWithdraws);
  const createWithdraw = useWalletStore((state) => state.createWithdraw);

  const [asset, setAsset] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [destinationType, setDestinationType] = useState<'bank' | 'crypto'>('crypto');
  const [destinationId, setDestinationId] = useState('');
  const [pendingWithdrawId, setPendingWithdrawId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingWithdraw = useMemo(() => {
    if (!pendingWithdrawId) return null;
    return withdraws.find((w) => w.withdrawId === pendingWithdrawId);
  }, [withdraws, pendingWithdrawId]);

  const availableAssets = useMemo(() => balances.filter((b) => new Decimal(b.available).gt(0)), [balances]);
  const currentBalance = useMemo(() => balances.find((b) => b.asset === asset), [balances, asset]);

  const destinations = useMemo(() => {
    if (destinationType === 'bank') {
      return paymentMethods.map((m) => ({ id: m.id, label: `${m.bankName} ****${m.lastFour}` }));
    }
    return cryptoAddresses.map((a) => ({ id: a.id, label: `${a.chain}: ${a.address.slice(0, 8)}...${a.address.slice(-6)}` }));
  }, [destinationType, paymentMethods, cryptoAddresses]);

  const fee = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return '0';
    const feeByRate = new Decimal(numAmount).times(WITHDRAW_FEE_RATE);
    return Decimal.max(feeByRate, MIN_WITHDRAW_FEE).toFixed(asset === 'USDT' ? 2 : 8);
  }, [amount, asset]);

  const receiveAmount = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return '0';
    return new Decimal(numAmount).minus(fee).toFixed(asset === 'USDT' ? 2 : 8);
  }, [amount, fee, asset]);

  const handleDestinationTypeChange = (type: 'bank' | 'crypto') => { setDestinationType(type); setDestinationId(''); };

  const handleSubmit = () => {
    setError(null);
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) { setError(t.wallet?.minAmount || 'Minimum amount: 1'); return; }
    if (!destinationId) { setError(t.wallet?.addDestinationFirst || 'Add a destination first'); return; }
    const result = createWithdraw(asset, amount, destinationType, destinationId);
    if (!result) { setError(t.wallet?.insufficientBalance || 'Insufficient available balance'); return; }
    setPendingWithdrawId(result.withdrawId);
  };

  const handleClose = () => {
    setAsset('USDT'); setAmount(''); setDestinationType('crypto'); setDestinationId(''); setPendingWithdrawId(null); setError(null);
    onClose();
  };

  const handleMaxAmount = () => {
    if (currentBalance) {
      const available = new Decimal(currentBalance.available);
      const maxWithFee = available.minus(MIN_WITHDRAW_FEE).div(1 + WITHDRAW_FEE_RATE);
      const maxAmount = Decimal.max(maxWithFee, 0);
      setAmount(maxAmount.toFixed(asset === 'USDT' ? 2 : 8));
    }
  };

  const isValid = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !destinationId || !currentBalance) return false;
    const totalRequired = new Decimal(numAmount).plus(fee);
    return new Decimal(currentBalance.available).gte(totalRequired);
  }, [amount, destinationId, currentBalance, fee]);

  const hasDestinations = paymentMethods.length > 0 || cryptoAddresses.length > 0;

  if (!isOpen) return null;

  return (
    <>
      <Overlay onClick={handleClose} />
      <Drawer>
        <Header>
          <Title><Icons name="upload" size="md" />{t.wallet?.withdrawTitle || 'Withdraw Funds'}</Title>
          <CloseButton onClick={handleClose}><Icons name="x" size="md" /></CloseButton>
        </Header>

        <Content>
          {pendingWithdraw && pendingWithdraw.status === 'processing' ? (
            <StatusCard status="processing" title={t.wallet?.withdrawProcessing || 'Processing...'} subtitle={`${pendingWithdraw.amount} ${pendingWithdraw.asset}`} estimatedSeconds={12} />
          ) : pendingWithdraw && pendingWithdraw.status === 'completed' ? (
            <StatusCard status="success" title={t.wallet?.withdrawCompleted || 'Withdraw Completed'} subtitle={`-${pendingWithdraw.amount} ${pendingWithdraw.asset}`} />
          ) : (
            <>
              {!hasDestinations && (
                <WarningCard>
                  <WarningInfo><Icons name="alert-triangle" size="sm" /><span>{t.wallet?.addDestinationFirst || 'Add a destination first'}</span></WarningInfo>
                  <AddSourceBtn onClick={() => { onClose(); const el = document.querySelector('[class*="methodsSection"]'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>
                    {t.common?.confirm || 'Add Now'}
                  </AddSourceBtn>
                </WarningCard>
              )}

              <Field>
                <Label>{t.wallet?.selectAsset || 'Select Asset'}</Label>
                <Select value={asset} onChange={(e) => setAsset(e.target.value)}>
                  {availableAssets.length === 0 ? (
                    <option value="">-- {t.wallet?.noAssets || 'No assets'} --</option>
                  ) : (
                    availableAssets.map((b) => <option key={b.asset} value={b.asset}>{b.asset} ({b.available})</option>)
                  )}
                </Select>
              </Field>

              <Field>
                <LabelRow>
                  <Label>{t.wallet?.amount || 'Amount'}</Label>
                  {currentBalance && <MaxButton onClick={handleMaxAmount}>{t.wallet?.available || 'Available'}: {currentBalance.available}</MaxButton>}
                </LabelRow>
                <AmountInputWrapper>
                  <Input type="number" value={amount} onChange={(e) => { setAmount(e.target.value); setError(null); }} placeholder="0.00" min="0" />
                  <AmountSuffix>{asset}</AmountSuffix>
                </AmountInputWrapper>
                {error && <Error>{error}</Error>}
              </Field>

              <FeeRow><FeeLabel>{t.wallet?.withdrawFee || 'Withdraw Fee'}</FeeLabel><FeeValue>{fee} {asset}</FeeValue></FeeRow>
              <ReceiveRow><ReceiveLabel>{t.wallet?.youWillReceive || 'You will receive'}</ReceiveLabel><ReceiveValue>{receiveAmount} {asset}</ReceiveValue></ReceiveRow>

              <Field>
                <Label>{t.wallet?.selectDestination || 'Select Destination'}</Label>
                <DestinationTypeButtons>
                  <DestinationTypeButton $active={destinationType === 'crypto'} onClick={() => handleDestinationTypeChange('crypto')}>
                    <Icons name="wallet" size="sm" /><span>{t.wallet?.cryptoAddresses || 'Crypto'}</span>
                  </DestinationTypeButton>
                  <DestinationTypeButton $active={destinationType === 'bank'} onClick={() => handleDestinationTypeChange('bank')}>
                    <Icons name="building-2" size="sm" /><span>{t.wallet?.bankCards || 'Bank'}</span>
                  </DestinationTypeButton>
                </DestinationTypeButtons>
              </Field>

              {destinations.length > 0 ? (
                <Field>
                  <Select value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
                    <option value="">-- {t.wallet?.selectDestination || 'Select'} --</option>
                    {destinations.map((dest) => <option key={dest.id} value={dest.id}>{dest.label}</option>)}
                  </Select>
                </Field>
              ) : (
                <NoDestinationsHint>{destinationType === 'bank' ? t.wallet?.noBankCards || 'No bank cards' : t.wallet?.noAddresses || 'No addresses'}</NoDestinationsHint>
              )}

              <SubmitButton onClick={handleSubmit} disabled={!isValid || !hasDestinations}>{t.wallet?.withdraw || 'Withdraw'}</SubmitButton>
            </>
          )}

          {pendingWithdraw && pendingWithdraw.status === 'completed' && <DoneButton onClick={handleClose}>{t.common?.close || 'Close'}</DoneButton>}
        </Content>
      </Drawer>
    </>
  );
}

export default WithdrawDrawer;
