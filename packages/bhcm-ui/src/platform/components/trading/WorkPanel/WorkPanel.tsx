import { useState } from 'react';
import { useI18n } from '../../i18n';
import { useWatchlistStore, selectSelectedSymbol } from '@repo/sdk';
import { Icons } from '../Icons';
import { TriggerForm } from './TriggerForm';
import { TriggerList } from './TriggerList';
import { ExecutionLogList } from './ExecutionLogList';
import { Container, Header, Title, HeaderIcons, Content, Tabs, Tab, ScrollArea } from './WorkPanel.styles';

/**
 * AUTOMATION PANEL - Trading automation triggers management
 */

type TabType = 'active' | 'create' | 'logs';

interface WorkPanelProps {
  isEmbedded?: boolean;
}

const WorkPanel = ({ isEmbedded = false }: WorkPanelProps) => {
  const { t } = useI18n();
  const selectedSymbol = useWatchlistStore(selectSelectedSymbol);
  const [isExpanded, setIsExpanded] = useState(isEmbedded);
  const [activeTab, setActiveTab] = useState<TabType>('active');

  const toggleExpand = () => { if (!isEmbedded) setIsExpanded(!isExpanded); };

  if (!t.automation) { console.error('[WorkPanel] i18n section "automation" is missing'); return null; }

  return (
    <Container $embedded={isEmbedded} className={!isEmbedded ? 'card' : ''}>
      {!isEmbedded && (
        <Header onClick={toggleExpand}>
          <Title><Icons name="zap" size="sm" /><span>{t.automation.panelTitle}</span></Title>
          <HeaderIcons $expanded={isExpanded}><Icons name="chevron-down" size="sm" /></HeaderIcons>
        </Header>
      )}

      {isExpanded && (
        <Content $embedded={isEmbedded}>
          <Tabs>
            <Tab $active={activeTab === 'active'} onClick={() => setActiveTab('active')}>{t.automation.activeTriggers}</Tab>
            <Tab $active={activeTab === 'create'} onClick={() => setActiveTab('create')}>{t.automation.createTrigger}</Tab>
            <Tab $active={activeTab === 'logs'} onClick={() => setActiveTab('logs')}>{t.automation.logs}</Tab>
          </Tabs>

          <ScrollArea $embedded={isEmbedded}>
            {activeTab === 'active' && <TriggerList filterSymbol={selectedSymbol} />}
            {activeTab === 'create' && <TriggerForm onSuccess={() => setActiveTab('active')} />}
            {activeTab === 'logs' && <ExecutionLogList />}
          </ScrollArea>
        </Content>
      )}
    </Container>
  );
}

export { WorkPanel };
