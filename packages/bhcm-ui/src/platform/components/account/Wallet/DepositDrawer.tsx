import { useState, useMemo } from 'react';
import { useWalletStore, selectPaymentMethods, selectCryptoAddresses, selectDeposits } from '@repo/sdk';
import { useI18n } from '../../i18n';
import { Icons } from '../Icons';
import { StatusCard } from './StatusCard';
import {
  Overlay,
  Drawer,
  Header,
  Title,
  CloseButton,
  Content,
  WarningCard,
  WarningInfo,
  AddSourceBtn,
  Field,
  Label,
  AssetButtons,
  AssetButton,
  AmountInputWrapper,
  Input,
  AmountSuffix,
  Hint,
  SourceTypeButtons,
  SourceTypeButton,
  Select,
  NoSourcesHint,
  SubmitButton,
  DoneButton,
} from './DepositDrawer.styles';

/**
 * DEPOSIT DRAWER - Slide-in panel for depositing funds
 */

interface DepositDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DepositDrawer = ({ isOpen, onClose }: DepositDrawerProps) => {
  const { t } = useI18n();
  const paymentMethods = useWalletStore(selectPaymentMethods);
  const cryptoAddresses = useWalletStore(selectCryptoAddresses);
  const deposits = useWalletStore(selectDeposits);
  const createDeposit = useWalletStore((state) => state.createDeposit);
  const confirmDeposit = useWalletStore((state) => state.confirmDeposit);

  const [asset, setAsset] = useState<'USD' | 'CNY'>('USD');
  const [amount, setAmount] = useState('');
  const [sourceType, setSourceType] = useState<'bank' | 'crypto'>('crypto');
  const [sourceId, setSourceId] = useState('');
  const [pendingDepositId, setPendingDepositId] = useState<string | null>(null);

  const pendingDeposit = useMemo(() => {
    if (!pendingDepositId) return null;
    return deposits.find((d) => d.depositId === pendingDepositId);
  }, [deposits, pendingDepositId]);

  const sources = useMemo(() => {
    if (sourceType === 'bank') {
      return paymentMethods.map((m) => ({ id: m.id, label: `${m.bankName} ****${m.lastFour}` }));
    }
    return cryptoAddresses.map((a) => ({ id: a.id, label: `${a.chain}: ${a.address.slice(0, 8)}...${a.address.slice(-6)}` }));
  }, [sourceType, paymentMethods, cryptoAddresses]);

  const handleSourceTypeChange = (type: 'bank' | 'crypto') => { setSourceType(type); setSourceId(''); };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || numAmount > 10000000 || !sourceId) return;
    const deposit = createDeposit(asset, amount, sourceType, sourceId);
    setPendingDepositId(deposit.depositId);
  };

  const handleConfirmDemo = () => { if (pendingDepositId) confirmDeposit(pendingDepositId); };

  const handleClose = () => {
    setAsset('USD'); setAmount(''); setSourceType('crypto'); setSourceId(''); setPendingDepositId(null);
    onClose();
  };

  const isValid = useMemo(() => {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount > 0 && numAmount <= 10000000 && sourceId;
  }, [amount, sourceId]);

  const hasSources = paymentMethods.length > 0 || cryptoAddresses.length > 0;

  if (!isOpen) return null;

  return (
    <>
      <Overlay onClick={handleClose} />
      <Drawer>
        <Header>
          <Title><Icons name="download" size="md" />{t.wallet?.depositTitle || 'Deposit Funds'}</Title>
          <CloseButton onClick={handleClose}><Icons name="x" size="md" /></CloseButton>
        </Header>

        <Content>
          {pendingDeposit && pendingDeposit.status === 'pending' ? (
            <StatusCard
              status="pending"
              title={t.wallet?.depositPending || 'Processing Deposit...'}
              subtitle={`${pendingDeposit.amount} ${pendingDeposit.asset}`}
              estimatedSeconds={8}
              onConfirmDemo={handleConfirmDemo}
              confirmDemoLabel={t.wallet?.confirmForDemo || 'Confirm for Demo'}
              confirmDemoHint={t.wallet?.confirmForDemoHint || 'Skip waiting for demo purposes'}
            />
          ) : pendingDeposit && pendingDeposit.status === 'confirmed' ? (
            <StatusCard status="success" title={t.wallet?.depositConfirmed || 'Deposit Confirmed'} subtitle={`+${pendingDeposit.amount} ${pendingDeposit.asset}`} />
          ) : (
            <>
              {!hasSources && (
                <WarningCard>
                  <WarningInfo><Icons name="alert-triangle" size="sm" /><span>{t.wallet?.addPaymentFirst || 'Add a payment method to deposit funds'}</span></WarningInfo>
                  <AddSourceBtn onClick={() => { onClose(); const el = document.querySelector('[class*="methodsSection"]'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>
                    {t.common?.confirm || 'Add Now'}
                  </AddSourceBtn>
                </WarningCard>
              )}

              <Field>
                <Label>{t.wallet?.selectAsset || 'Select Asset'}</Label>
                <AssetButtons>
                  <AssetButton $active={asset === 'USD'} onClick={() => setAsset('USD')}>USD</AssetButton>
                  <AssetButton $active={asset === 'CNY'} onClick={() => setAsset('CNY')}>CNY</AssetButton>
                </AssetButtons>
              </Field>

              <Field>
                <Label>{t.wallet?.enterAmount || 'Enter Amount'}</Label>
                <AmountInputWrapper>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="1" max="10000000" />
                  <AmountSuffix>{asset}</AmountSuffix>
                </AmountInputWrapper>
                <Hint>{t.wallet?.maxAmount || 'Max amount per deposit: 10,000,000'}</Hint>
              </Field>

              <Field>
                <Label>{t.wallet?.selectSource || 'Select Source'}</Label>
                <SourceTypeButtons>
                  <SourceTypeButton $active={sourceType === 'crypto'} onClick={() => handleSourceTypeChange('crypto')}>
                    <Icons name="wallet" size="sm" /><span>{t.wallet?.cryptoAddresses || 'Crypto'}</span>
                  </SourceTypeButton>
                  <SourceTypeButton $active={sourceType === 'bank'} onClick={() => handleSourceTypeChange('bank')}>
                    <Icons name="building-2" size="sm" /><span>{t.wallet?.bankCards || 'Bank'}</span>
                  </SourceTypeButton>
                </SourceTypeButtons>
              </Field>

              {sources.length > 0 ? (
                <Field>
                  <Select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                    <option value="">-- {t.wallet?.selectSource || 'Select Source'} --</option>
                    {sources.map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}
                  </Select>
                </Field>
              ) : (
                <NoSourcesHint>{sourceType === 'bank' ? t.wallet?.noBankCards || 'No bank cards linked' : t.wallet?.noAddresses || 'No addresses linked'}</NoSourcesHint>
              )}

              <SubmitButton onClick={handleSubmit} disabled={!isValid || !hasSources}>{t.wallet?.deposit || 'Deposit'}</SubmitButton>
            </>
          )}

          {pendingDeposit && pendingDeposit.status === 'confirmed' && (
            <DoneButton onClick={handleClose}>{t.common?.close || 'Close'}</DoneButton>
          )}
        </Content>
      </Drawer>
    </>
  );
}

export { DepositDrawer };
