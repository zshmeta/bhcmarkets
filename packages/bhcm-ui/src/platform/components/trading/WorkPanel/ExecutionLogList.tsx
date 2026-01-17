import { useI18n } from '../../i18n';
import { useAutomationStore } from '@repo/sdk';
import { Icons } from '../Icons';
import type { ExecutionLog } from '@repo/types/triggers';
import { formatTime } from '../../../../../../sdk/utils';
import { Container, LogItem, Header, Time, Result, Reason, Details, DetailItem, DetailLabel, OrderLink, ErrorMessage, EmptyState } from './ExecutionLogList.styles';

/**
 * EXECUTION LOG LIST - Automation execution history
 */

interface ExecutionLogListProps {
  triggerId?: string;
}

const ExecutionLogList = ({ triggerId }: ExecutionLogListProps) => {
  const { t } = useI18n();
  const allLogs = useAutomationStore((state) => state.executionLogs);
  const triggers = useAutomationStore((state) => state.triggers);

  const filteredLogs = triggerId ? allLogs.filter(log => log.triggerId === triggerId) : allLogs;

  if (filteredLogs.length === 0) {
    return <EmptyState><Icons name="list" size="lg" /><span>{t.automation.hints.noLogs}</span></EmptyState>;
  }

  return (
    <Container>
      {filteredLogs.map((log) => {
        const trigger = triggers.find(t => t.id === log.triggerId);
        return <LogItemComponent key={log.id} log={log} symbol={trigger?.symbol || 'Unknown'} />;
      })}
    </Container>
  );
}

interface LogItemComponentProps { log: ExecutionLog; symbol: string; }

function LogItemComponent({ log, symbol }: LogItemComponentProps) {
  const { t } = useI18n();

  if (!t.automation || !t.automation.logDetails) {
    return <LogItem $result="failed">ERROR: i18n_MISSING</LogItem>;
  }

  const getResultText = (result: ExecutionLog['result']) => {
    switch (result) {
      case 'success': return t.automation.logDetails.success;
      case 'failed': return t.automation.logDetails.failed;
      case 'blocked': return t.automation.logDetails.blocked;
      default: return result;
    }
  };

  const getErrorCodeText = (code: string) => {
    const labels: Record<string, string> = t.automation.logDetails.errorCodes;
    return labels[code] || code;
  };

  return (
    <LogItem $result={log.result}>
      <Header>
        <Time>{formatTime(log.firedAt, true)}</Time>
        <Result $result={log.result}>{getResultText(log.result)}</Result>
      </Header>
      <Reason><strong>{symbol}</strong>: {log.confidenceReason || 'Trigger condition met'}</Reason>
      <Details>
        <DetailItem><DetailLabel>{t.automation.logDetails.price}:</DetailLabel><span>{parseFloat(log.observedPrice).toLocaleString()}</span></DetailItem>
        <DetailItem><DetailLabel>{t.automation.logDetails.latency}:</DetailLabel><span>{log.executionLatencyMs}ms</span></DetailItem>
        {log.orderId && <DetailItem><DetailLabel>{t.automation.logDetails.orderId}:</DetailLabel><OrderLink>{log.orderId.slice(0, 8)}</OrderLink></DetailItem>}
      </Details>
      {log.errorMessage && <ErrorMessage>{log.errorCode ? `${getErrorCodeText(log.errorCode)}: ` : ''}{log.errorMessage}</ErrorMessage>}
    </LogItem>
  );
}

export { ExecutionLogList };
