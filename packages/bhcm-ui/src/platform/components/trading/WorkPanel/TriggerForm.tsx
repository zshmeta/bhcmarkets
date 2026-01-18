import { useState } from 'react';
import { useI18n } from '../../i18n';
import { useAutomationStore } from '@repo/sdk';
import { useWatchlistStore, selectSelectedSymbol } from '@repo/sdk';
import { toast } from '../Toast';
import { TriggerType, TriggerOperator, CrossDirection, QuantityMode, TriggerCondition, TriggerAction } from '@repo/sdk/triggers';
import { OrderSide, OrderType } from '@repo/sdk/trading';
import {
  Container, Form, FieldGroup, Label, InputRow, InputWrapper, InputSuffix, Toggle, ToggleBtn,
  CheckboxGroup, CheckboxLabel, Checkbox, SubmitBtn, CancelBtn,
  CompactContainer, CompactForm, CompactRow, CompactField, CompactLabel, CompactToggle, CompactBtn,
  CompactInputWrap, CompactInput, CompactSuffix, CompactSelect, CompactOptions, CompactCheckbox, CompactSubmit,
} from './TriggerForm.styles';

/**
 * TRIGGER FORM - Create automation trigger
 */

interface TriggerFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

const TriggerForm = ({ onSuccess, onCancel, compact = false }: TriggerFormProps) => {
  const { t } = useI18n();
  const selectedSymbol = useWatchlistStore(selectSelectedSymbol);
  const addTrigger = useAutomationStore((state) => state.addTrigger);

  const [triggerType] = useState<TriggerType>('conditional');
  const [operator, setOperator] = useState<TriggerOperator>('gte');
  const [threshold, setThreshold] = useState('');
  const [priceSource, setPriceSource] = useState<TriggerCondition['priceSource']>('last');
  const [side, setSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [quantityMode, setQuantityMode] = useState<QuantityMode>('fixed');
  const [quantityValue, setQuantityValue] = useState('');
  const [allowDegraded, setAllowDegraded] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [cooldown, setCooldown] = useState('60');

  const direction: CrossDirection = operator === 'gte' ? 'up' : 'down';
  const quoteAsset = 'USD';
  const baseAsset = selectedSymbol.replace('USD', '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!threshold || parseFloat(threshold) <= 0) { toast.warning('Invalid trigger price'); return; }
    if (!quantityValue || parseFloat(quantityValue) <= 0) { toast.warning('Invalid quantity'); return; }
    if (orderType === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) { toast.warning('Invalid limit price'); return; }

    const triggerCondition: TriggerCondition = { priceSource, operator, threshold, direction, debounceMs: 1000, cooldownMs: parseInt(cooldown) * 1000 };
    const triggerAction: TriggerAction = { type: 'order', side, orderType, limitPrice: orderType === 'limit' ? limitPrice : undefined, quantityMode, quantityValue, timeInForce: 'GTC' };
    addTrigger({ symbol: selectedSymbol, type: triggerType, enabled: true, condition: triggerCondition, action: triggerAction, allowDegraded, repeat });

    toast.success('Trigger created');
    setThreshold(''); setQuantityValue(''); setLimitPrice('');
    if (onSuccess) onSuccess();
  };

  if (compact) {
    return (
      <CompactContainer>
        <CompactForm onSubmit={handleSubmit}>
          <CompactRow>
            <CompactField><CompactLabel>When {baseAsset}</CompactLabel><CompactToggle><CompactBtn type="button" $active={operator === 'gte'} onClick={() => setOperator('gte')}>≥</CompactBtn><CompactBtn type="button" $active={operator === 'lte'} onClick={() => setOperator('lte')}>≤</CompactBtn></CompactToggle></CompactField>
            <CompactField style={{ flex: 1 }}><CompactLabel>Price</CompactLabel><CompactInputWrap><CompactInput type="number" step="any" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="0.00" required /><CompactSuffix>{quoteAsset}</CompactSuffix></CompactInputWrap></CompactField>
            <CompactField><CompactLabel>Source</CompactLabel><CompactSelect value={priceSource} onChange={(e) => setPriceSource(e.target.value as any)}><option value="last">Last</option><option value="mid">Mid</option><option value="bid">Bid</option><option value="ask">Ask</option></CompactSelect></CompactField>
          </CompactRow>
          <CompactRow>
            <CompactField><CompactLabel>Action</CompactLabel><CompactToggle><CompactBtn type="button" $active={side === 'buy'} $buy onClick={() => setSide('buy')}>Buy</CompactBtn><CompactBtn type="button" $active={side === 'sell'} $sell onClick={() => setSide('sell')}>Sell</CompactBtn></CompactToggle></CompactField>
            <CompactField style={{ flex: 1 }}><CompactLabel>Amount</CompactLabel><CompactInputWrap><CompactInput type="number" step="any" value={quantityValue} onChange={(e) => setQuantityValue(e.target.value)} placeholder="0.00" required /><CompactSuffix>{quantityMode === 'fixed' ? baseAsset : '%'}</CompactSuffix></CompactInputWrap></CompactField>
            <CompactField><CompactLabel>Mode</CompactLabel><CompactSelect value={quantityMode} onChange={(e) => setQuantityMode(e.target.value as any)}><option value="fixed">Fixed</option><option value="percent">%</option></CompactSelect></CompactField>
          </CompactRow>
          <CompactRow>
            <CompactField><CompactLabel>Type</CompactLabel><CompactToggle><CompactBtn type="button" $active={orderType === 'market'} onClick={() => setOrderType('market')}>Mkt</CompactBtn><CompactBtn type="button" $active={orderType === 'limit'} onClick={() => setOrderType('limit')}>Lmt</CompactBtn></CompactToggle></CompactField>
            {orderType === 'limit' && <CompactField style={{ flex: 1 }}><CompactLabel>Limit Price</CompactLabel><CompactInputWrap><CompactInput type="number" step="any" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder="0.00" required /><CompactSuffix>{quoteAsset}</CompactSuffix></CompactInputWrap></CompactField>}
            <CompactOptions><CompactCheckbox><input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} /><span>Repeat</span></CompactCheckbox><CompactCheckbox><input type="checkbox" checked={allowDegraded} onChange={(e) => setAllowDegraded(e.target.checked)} /><span>Degraded</span></CompactCheckbox></CompactOptions>
          </CompactRow>
          <CompactSubmit type="submit" $buy={side === 'buy'}>Create {operator === 'gte' ? '↑' : '↓'} {side.toUpperCase()} Trigger</CompactSubmit>
        </CompactForm>
      </CompactContainer>
    );
  }

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <FieldGroup><Label>{t.automation?.form?.triggerType || 'Trigger Type'}</Label><Toggle><ToggleBtn type="button" $active={operator === 'gte'} onClick={() => setOperator('gte')}>{t.automation?.form?.priceAbove || 'Price Above'}</ToggleBtn><ToggleBtn type="button" $active={operator === 'lte'} onClick={() => setOperator('lte')}>{t.automation?.form?.priceBelow || 'Price Below'}</ToggleBtn></Toggle></FieldGroup>
        <FieldGroup><Label>{t.automation?.form?.triggerPrice || 'Trigger Price'}</Label><InputWrapper><input type="number" step="any" className="input" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="0.00" required /><InputSuffix>{quoteAsset}</InputSuffix></InputWrapper></FieldGroup>
        <FieldGroup><Label>{t.automation?.form?.priceSource || 'Price Source'}</Label><select className="input" value={priceSource} onChange={(e) => setPriceSource(e.target.value as any)}><option value="last">Last Price</option><option value="mid">Mid Price</option><option value="bid">Best Bid</option><option value="ask">Best Ask</option></select></FieldGroup>
        <FieldGroup><Label>{t.automation?.form?.side || 'Side'}</Label><Toggle><ToggleBtn type="button" $active={side === 'buy'} $buyActive={side === 'buy'} onClick={() => setSide('buy')}>{t.automation?.form?.buy || 'Buy'}</ToggleBtn><ToggleBtn type="button" $active={side === 'sell'} $sellActive={side === 'sell'} onClick={() => setSide('sell')}>{t.automation?.form?.sell || 'Sell'}</ToggleBtn></Toggle></FieldGroup>
        <FieldGroup><Label>{t.automation?.form?.orderType || 'Order Type'}</Label><Toggle><ToggleBtn type="button" $active={orderType === 'market'} onClick={() => setOrderType('market')}>{t.OrderForm?.market || 'Market'}</ToggleBtn><ToggleBtn type="button" $active={orderType === 'limit'} onClick={() => setOrderType('limit')}>{t.OrderForm?.limit || 'Limit'}</ToggleBtn></Toggle></FieldGroup>
        {orderType === 'limit' && <FieldGroup><Label>{t.automation?.form?.limitPrice || 'Limit Price'}</Label><InputWrapper><input type="number" step="any" className="input" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder="0.00" required /><InputSuffix>{quoteAsset}</InputSuffix></InputWrapper></FieldGroup>}
        <FieldGroup><InputRow><div style={{ flex: 1 }}><Label>{t.automation?.form?.quantity || 'Quantity'}</Label><InputWrapper><input type="number" step="any" className="input" value={quantityValue} onChange={(e) => setQuantityValue(e.target.value)} placeholder="0.00" required /><InputSuffix>{quantityMode === 'fixed' ? baseAsset : '%'}</InputSuffix></InputWrapper></div><div style={{ width: '80px' }}><Label>{t.automation?.form?.quantityMode || 'Mode'}</Label><select className="input" value={quantityMode} onChange={(e) => setQuantityMode(e.target.value as any)}><option value="fixed">{t.automation?.form?.fixed || 'Fixed'}</option><option value="percent">{t.automation?.form?.percent || '%'}</option></select></div></InputRow></FieldGroup>
        <CheckboxGroup><CheckboxLabel><Checkbox type="checkbox" checked={allowDegraded} onChange={(e) => setAllowDegraded(e.target.checked)} />{t.automation?.form?.allowDegraded || 'Allow Degraded'}</CheckboxLabel><CheckboxLabel><Checkbox type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />{t.automation?.form?.repeat || 'Repeat'}</CheckboxLabel>{repeat && <FieldGroup><Label>{t.automation?.form?.cooldown || 'Cooldown (s)'}</Label><input type="number" className="input" value={cooldown} onChange={(e) => setCooldown(e.target.value)} min="1" /></FieldGroup>}</CheckboxGroup>
        <SubmitBtn type="submit" $buy={side === 'buy'}>{t.automation?.form?.create || 'Create Trigger'}</SubmitBtn>
        {onCancel && <CancelBtn type="button" onClick={onCancel}>{t.common?.cancel || 'Cancel'}</CancelBtn>}
      </Form>
    </Container>
  );
}

export { TriggerForm };
