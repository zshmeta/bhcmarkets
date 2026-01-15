import { useI18n } from '../../i18n';
import { useAutomationStore } from '../../store/automationStore';
import { Icons } from '../Icons';
import { Trigger, TriggerStatus } from '@repo/types/triggers';
import { formatTime } from '../../utils';
import {
  Container, TriggerItem, Header, SymbolType, Symbol, Type, Status, StatusDot,
  Content, Condition, Action, BuyText, SellText, Footer, Time, Actions, ActionBtn,
  EmptyState, CompactContainer, CompactTable, CompactRow, CompactSymbol,
  CompactCondition, CompactAction, CompactStatus, CompactActions, CompactActionBtn,
} from './TriggerList.styles';

/**
 * TRIGGER LIST - Display active or historical triggers
 */

interface TriggerItemProps { trigger: Trigger; onDelete: () => void; onToggle: () => void; }

const CompactTriggerRow = ({ trigger, onDelete, onToggle }: TriggerItemProps) => {
  const isBuy = trigger.action.side === 'buy';
  const baseAsset = trigger.symbol.replace('USDT', '');
  return (
    <CompactRow>
      <td><CompactSymbol>{baseAsset}</CompactSymbol></td>
      <td><CompactCondition>{trigger.condition.operator === 'gte' ? '≥' : '≤'} {parseFloat(trigger.condition.threshold).toLocaleString()}</CompactCondition></td>
      <td><CompactAction $buy={isBuy}>{isBuy ? 'Buy' : 'Sell'} {trigger.action.quantityValue}{trigger.action.quantityMode === 'percent' ? '%' : ''}</CompactAction></td>
      <td><CompactStatus $status={trigger.status as any}>{trigger.status}</CompactStatus></td>
      <td>
        <CompactActions>
          {['armed', 'paused', 'blocked'].includes(trigger.status) && <CompactActionBtn onClick={onToggle}><Icons name={trigger.status === 'paused' ? 'play' : 'pause'} size="xs" /></CompactActionBtn>}
          <CompactActionBtn $delete onClick={onDelete}><Icons name="x" size="xs" /></CompactActionBtn>
        </CompactActions>
      </td>
    </CompactRow>
  );
}

const TriggerItemComponent = ({ trigger, onDelete, onToggle }: TriggerItemProps) => {
  const { t } = useI18n();
  const automationStrings = t.automation || { status: {}, type: {}, form: { buy: 'Buy', sell: 'Sell' } };
  const isBuy = trigger.action.side === 'buy';

  return (
    <TriggerItem>
      <Header>
        <SymbolType><Symbol>{trigger.symbol}</Symbol><Type>{(automationStrings.type as any)[trigger.type] || trigger.type}</Type></SymbolType>
        <Status $status={trigger.status as any}>
          {['armed', 'paused', 'blocked', 'triggered'].includes(trigger.status) && <StatusDot $status={trigger.status as any} />}
          <span>{(automationStrings.status as any)[trigger.status] || trigger.status}</span>
        </Status>
      </Header>
      <Content>
        <Condition>
          <span>{trigger.condition.priceSource.toUpperCase()}</span>
          <Icons name={trigger.condition.operator === 'gte' ? 'arrow-up' : 'arrow-down'} size="xs" />
          <span>{parseFloat(trigger.condition.threshold).toLocaleString()}</span>
        </Condition>
        <Action>
          {isBuy ? <BuyText>{automationStrings.form.buy}</BuyText> : <SellText>{automationStrings.form.sell}</SellText>}
          {' '}<span>{trigger.action.orderType === 'market' ? (t.OrderForm?.market || 'Market') : (t.OrderForm?.limit || 'Limit')}</span>
          {' '}<span>{trigger.action.quantityValue}{trigger.action.quantityMode === 'percent' ? '%' : ''}</span>
        </Action>
      </Content>
      <Footer>
        <Time>{formatTime(trigger.createdAt)}</Time>
        <Actions>
          {['armed', 'paused', 'blocked'].includes(trigger.status) && <ActionBtn onClick={onToggle} title={trigger.status === 'paused' ? 'Resume' : 'Pause'}><Icons name={trigger.status === 'paused' ? 'play' : 'pause'} size="xs" /></ActionBtn>}
          <ActionBtn $delete onClick={onDelete} title="Delete"><Icons name="trash-2" size="xs" /></ActionBtn>
        </Actions>
      </Footer>
    </TriggerItem>
  );
}


interface TriggerListProps {
  filterSymbol?: string;
  showHistory?: boolean;
  compact?: boolean;
}

const TriggerList = ({ filterSymbol, showHistory = false, compact = false }: TriggerListProps) => {
  const { t } = useI18n();
  const triggers = useAutomationStore((state) => state.triggers);
  const removeTrigger = useAutomationStore((state) => state.removeTrigger);
  const pauseTrigger = useAutomationStore((state) => state.pauseTrigger);
  const resumeTrigger = useAutomationStore((state) => state.resumeTrigger);

  const filteredTriggers = triggers.filter((tr) => {
    const symbolMatch = !filterSymbol || tr.symbol === filterSymbol;
    const historyMatch = showHistory
      ? ['completed', 'failed', 'cancelled', 'expired'].includes(tr.status)
      : ['armed', 'paused', 'blocked', 'triggered'].includes(tr.status);
    return symbolMatch && historyMatch;
  });

  if (filteredTriggers.length === 0) {
    return (
      <EmptyState $compact={compact}>
        <Icons name="zap" size={compact ? 'sm' : 'lg'} />
        <span>{showHistory ? (t.automation?.hints?.noLogs || 'No logs') : (t.automation?.hints?.noTriggers || 'No active triggers')}</span>
      </EmptyState>
    );
  }

  if (compact) {
    return (
      <CompactContainer>
        <CompactTable>
          <thead><tr><th>Symbol</th><th>Condition</th><th>Action</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filteredTriggers.map((trigger) => (
              <CompactTriggerRow key={trigger.id} trigger={trigger} onDelete={() => removeTrigger(trigger.id)} onToggle={() => trigger.status === 'paused' ? resumeTrigger(trigger.id) : pauseTrigger(trigger.id)} />
            ))}
          </tbody>
        </CompactTable>
      </CompactContainer>
    );
  }

  return (
    <Container>
      {filteredTriggers.map((trigger) => (
        <TriggerItemComponent key={trigger.id} trigger={trigger} onDelete={() => removeTrigger(trigger.id)} onToggle={() => trigger.status === 'paused' ? resumeTrigger(trigger.id) : pauseTrigger(trigger.id)} />
      ))}
    </Container>
  );
}


export { TriggerList };
