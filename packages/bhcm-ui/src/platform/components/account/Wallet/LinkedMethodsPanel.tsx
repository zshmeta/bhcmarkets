import { useState } from 'react';
import { useWalletStore, selectPaymentMethods, selectCryptoAddresses } from '@repo/sdk';
import { useI18n } from '../../i18n';
import { truncateAddress } from '../../../../../../sdk/utils';
import { Icons } from '../Icons';
import type { ChainType } from '../../types/wallet';
import {
  Container,
  Content,
  Section,
  SectionHeader,
  EmptyText,
  ItemList,
  CardGrid,
  BankCard,
  CardChip,
  CardNumber,
  CardFooter,
  CardHolder,
  CardHolderLabel,
  CardHolderName,
  BankBrand,
  CardActions,
  CardDeleteButton,
  Item,
  ItemInfo,
  ChainBadge,
  AddressText,
  DeleteButton,
  AddButton,
  AddForm,
  FormGrid,
  Input,
  Select,
  FormActions,
  CancelButton,
  ConfirmButton,
} from './LinkedMethodsPanel.styles';

/**
 * LINKED METHODS PANEL - Bank cards and crypto addresses
 */

interface LinkedMethodsPanelProps {
  highlightAdd?: boolean;
}

const LinkedMethodsPanel = ({ highlightAdd }: LinkedMethodsPanelProps) => {
  const { t } = useI18n();
  const paymentMethods = useWalletStore(selectPaymentMethods);
  const cryptoAddresses = useWalletStore(selectCryptoAddresses);
  const addPaymentMethod = useWalletStore((state) => state.addPaymentMethod);
  const removePaymentMethod = useWalletStore((state) => state.removePaymentMethod);
  const addCryptoAddress = useWalletStore((state) => state.addCryptoAddress);
  const removeCryptoAddress = useWalletStore((state) => state.removeCryptoAddress);

  const [showAddBank, setShowAddBank] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);

  const [bankName, setBankName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [bankAlias, setBankAlias] = useState('');

  const [chain, setChain] = useState<ChainType>('TRC20');
  const [address, setAddress] = useState('');
  const [addressAlias, setAddressAlias] = useState('');

  const handleAddBank = () => {
    if (!bankName || !lastFour || lastFour.length !== 4) return;
    addPaymentMethod(bankName, lastFour, bankAlias || `${bankName} ****${lastFour}`);
    setBankName(''); setLastFour(''); setBankAlias('');
    setShowAddBank(false);
  };

  const handleAddAddress = () => {
    if (!address || address.length < 10) return;
    addCryptoAddress(chain, address, addressAlias || `${chain}: ${address.slice(0, 8)}...`);
    setChain('TRC20'); setAddress(''); setAddressAlias('');
    setShowAddAddress(false);
  };

  const handleDeleteBank = (id: string) => {
    if (confirm(t.wallet?.deleteConfirm || 'Are you sure you want to delete this?')) {
      removePaymentMethod(id);
    }
  };

  const handleDeleteAddress = (id: string) => {
    if (confirm(t.wallet?.deleteConfirm || 'Are you sure you want to delete this?')) {
      removeCryptoAddress(id);
    }
  };

  // truncateAddress is now imported from centralized utils

  return (
    <Container className="card">
      <div className="card-header">
        <Icons name="link" size="sm" />
        <span>{t.wallet?.linkedMethods || 'Linked Methods'}</span>
      </div>

      <Content>
        {/* Bank Cards Section */}
        <Section>
          <SectionHeader>
            <Icons name="building-2" size="sm" />
            <span>{t.wallet?.bankCards || 'Bank Cards'}</span>
          </SectionHeader>

          {paymentMethods.length === 0 ? (
            <EmptyText>{t.wallet?.noBankCards || 'No bank cards linked'}</EmptyText>
          ) : (
            <CardGrid>
              {paymentMethods.map((method) => (
                <BankCard key={method.id}>
                  <CardActions>
                    <CardDeleteButton onClick={() => handleDeleteBank(method.id)} title={t.wallet?.delete || 'Delete'}>
                      <Icons name="trash-2" size="sm" />
                    </CardDeleteButton>
                  </CardActions>
                  <CardChip />
                  <BankBrand>{method.bankName}</BankBrand>
                  <CardNumber>**** **** **** {method.lastFour}</CardNumber>
                  <CardFooter>
                    <CardHolder>
                      <CardHolderLabel>{t.wallet?.cardHolder || 'Cardholder'}</CardHolderLabel>
                      <CardHolderName>{method.alias || 'Valued Customer'}</CardHolderName>
                    </CardHolder>
                    <Icons name="credit-card" size="md" />
                  </CardFooter>
                </BankCard>
              ))}
            </CardGrid>
          )}

          {showAddBank ? (
            <AddForm>
              <FormGrid>
                <Input type="text" placeholder={t.wallet?.bankName || 'Bank Name'} value={bankName} onChange={(e) => setBankName(e.target.value)} />
                <Input type="text" placeholder={t.wallet?.lastFourDigits || 'Last 4 Digits'} value={lastFour} onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} />
              </FormGrid>
              <Input type="text" placeholder={t.wallet?.cardHolder || 'Cardholder Name'} value={bankAlias} onChange={(e) => setBankAlias(e.target.value)} />
              <FormActions>
                <CancelButton onClick={() => setShowAddBank(false)}>{t.common?.cancel || 'Cancel'}</CancelButton>
                <ConfirmButton onClick={handleAddBank} disabled={!bankName || lastFour.length !== 4}>{t.common?.confirm || 'Add Card'}</ConfirmButton>
              </FormActions>
            </AddForm>
          ) : (
            <AddButton $highlighted={highlightAdd} onClick={() => setShowAddBank(true)}>
              <Icons name="plus" size="sm" />
              <span>{t.wallet?.addBankCard || 'Add Bank Card'}</span>
            </AddButton>
          )}
        </Section>

        {/* Crypto Addresses Section */}
        <Section>
          <SectionHeader>
            <Icons name="wallet" size="sm" />
            <span>{t.wallet?.cryptoAddresses || 'Crypto Addresses'}</span>
          </SectionHeader>

          {cryptoAddresses.length === 0 ? (
            <EmptyText>{t.wallet?.noAddresses || 'No addresses linked'}</EmptyText>
          ) : (
            <ItemList>
              {cryptoAddresses.map((addr) => (
                <Item key={addr.id}>
                  <ItemInfo>
                    <ChainBadge>{addr.chain}</ChainBadge>
                    <AddressText>{truncateAddress(addr.address)}</AddressText>
                  </ItemInfo>
                  <DeleteButton onClick={() => handleDeleteAddress(addr.id)} title={t.wallet?.delete || 'Delete'}>
                    <Icons name="trash-2" size="sm" />
                  </DeleteButton>
                </Item>
              ))}
            </ItemList>
          )}

          {showAddAddress ? (
            <AddForm>
              <FormGrid>
                <Select value={chain} onChange={(e) => setChain(e.target.value as ChainType)}>
                  <option value="TRC20">TRC20</option>
                  <option value="ERC20">ERC20</option>
                  <option value="BEP20">BEP20</option>
                </Select>
                <Input type="text" placeholder={t.wallet?.alias || 'Alias'} value={addressAlias} onChange={(e) => setAddressAlias(e.target.value)} />
              </FormGrid>
              <Input type="text" placeholder={t.wallet?.address || 'Deposit Address'} value={address} onChange={(e) => setAddress(e.target.value)} />
              <FormActions>
                <CancelButton onClick={() => setShowAddAddress(false)}>{t.common?.cancel || 'Cancel'}</CancelButton>
                <ConfirmButton onClick={handleAddAddress} disabled={address.length < 10}>{t.common?.confirm || 'Add Address'}</ConfirmButton>
              </FormActions>
            </AddForm>
          ) : (
            <AddButton $highlighted={highlightAdd} onClick={() => setShowAddAddress(true)}>
              <Icons name="plus" size="sm" />
              <span>{t.wallet?.addAddress || 'Add Address'}</span>
            </AddButton>
          )}
        </Section>
      </Content>
    </Container>
  );
}

export { LinkedMethodsPanel };
