import { Positions } from '../Positions';
import { CurrentOrders } from '../CurrentOrders';
import { Level2Book } from '../Level2Book';
import TriggerForm from '../WorkPanel/TriggerForm';
import TriggerList from '../WorkPanel/TriggerList';
import { Icons } from '../Icons';
import type { LeftTab, RightTab, AutomationCounts } from './useTabs';
import {
    Container,
    ColumnsWrapper,
    LeftColumn,
    RightColumn,
    ColumnHeader,
    ColumnContent,
    StatusBar,
    StatusItem,
    StatusLabel,
    StatusValue,
    StatusDot,
    TabsRow,
    TabButton,
    Badge,
} from './Tabs.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 * Tabs.view.tsx - Dumb component with no store hooks.
 */

/* ─── Automation Status Bar Sub-component ─── */
interface AutomationStatusBarViewProps {
    counts: AutomationCounts;
}

const AutomationStatusBarView = ({ counts }: AutomationStatusBarViewProps) => {
    return (
        <StatusBar>
            <StatusItem>
                <StatusDot $active={counts.armed > 0} />
                <StatusLabel>Armed</StatusLabel>
                <StatusValue>{counts.armed}</StatusValue>
            </StatusItem>
            <StatusItem>
                <StatusDot $paused />
                <StatusLabel>Paused</StatusLabel>
                <StatusValue>{counts.paused}</StatusValue>
            </StatusItem>
            <StatusItem>
                <StatusLabel>Executed</StatusLabel>
                <StatusValue>{counts.triggered}</StatusValue>
            </StatusItem>
        </StatusBar>
    );
}

/* ═══════════════════════════════════════════════════════════
 * VIEW PROPS INTERFACE
 * ═══════════════════════════════════════════════════════════
 */
interface TabsViewProps {
    // Tab state
    leftTab: LeftTab;
    rightTab: RightTab;

    // Badge counts
    positionsCount: number;
    CurrentOrdersCount: number;
    triggersCount: number;
    automationCounts: AutomationCounts;

    // Symbol
    selectedSymbol: string;

    // Actions
    onLeftTabChange: (tab: LeftTab) => void;
    onRightTabChange: (tab: RightTab) => void;
    onPriceClick: (price: string, side?: 'buy' | 'sell') => void;
    onTriggerSuccess: () => void;
}

/* ═══════════════════════════════════════════════════════════
 * MAIN VIEW COMPONENT
 * ═══════════════════════════════════════════════════════════
 */
const TabsView = ({
    leftTab,
    rightTab,
    positionsCount,
    CurrentOrdersCount,
    triggersCount,
    automationCounts,
    selectedSymbol,
    onLeftTabChange,
    onRightTabChange,
    onPriceClick,
    onTriggerSuccess,
}: TabsViewProps) => {
    return (
        <Container>
            <ColumnsWrapper>
                {/* ─── Left Column: Positions/Orders ─── */}
                <LeftColumn>
                    <ColumnHeader>
                        <TabsRow>
                            <TabButton $active={leftTab === 'positions'} onClick={() => onLeftTabChange('positions')}>
                                <Icons name="briefcase" size="xs" />
                                <span>Positions</span>
                                {positionsCount > 0 && <Badge $active={leftTab === 'positions'}>{positionsCount}</Badge>}
                            </TabButton>

                            <TabButton $active={leftTab === 'orders'} onClick={() => onLeftTabChange('orders')}>
                                <Icons name="list" size="xs" />
                                <span>Orders</span>
                                {CurrentOrdersCount > 0 && <Badge $active={leftTab === 'orders'}>{CurrentOrdersCount}</Badge>}
                            </TabButton>

                            <TabButton $active={leftTab === 'Level2Book'} $Level2BookTab onClick={() => onLeftTabChange('Level2Book')}>
                                <Icons name="bar-chart-2" size="xs" />
                                <span>Book</span>
                            </TabButton>
                        </TabsRow>
                    </ColumnHeader>

                    <ColumnContent>
                        {leftTab === 'positions' && <Positions />}
                        {leftTab === 'orders' && <CurrentOrders />}
                        {leftTab === 'Level2Book' && <Level2Book onPriceClick={onPriceClick} embedded />}
                    </ColumnContent>
                </LeftColumn>

                {/* ─── Right Column: Automation ─── */}
                <RightColumn>
                    <ColumnHeader>
                        <TabsRow>
                            <TabButton $active={rightTab === 'create'} onClick={() => onRightTabChange('create')}>
                                <Icons name="plus" size="xs" />
                                <span>New</span>
                            </TabButton>

                            <TabButton $active={rightTab === 'triggers'} onClick={() => onRightTabChange('triggers')}>
                                <Icons name="zap" size="xs" />
                                <span>Triggers</span>
                                {triggersCount > 0 && <Badge $active={rightTab === 'triggers'}>{triggersCount}</Badge>}
                            </TabButton>
                        </TabsRow>
                    </ColumnHeader>

                    <ColumnContent>
                        {rightTab === 'create' && <TriggerForm onSuccess={onTriggerSuccess} compact />}
                        {rightTab === 'triggers' && <TriggerList filterSymbol={selectedSymbol} compact />}
                    </ColumnContent>

                    <AutomationStatusBarView counts={automationCounts} />
                </RightColumn>
            </ColumnsWrapper>
        </Container>
    );
}

export default TabsView;
