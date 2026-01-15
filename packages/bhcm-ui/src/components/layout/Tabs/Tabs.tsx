import { useTabs } from './useTabs';
import { TabsView } from './Tabs.view';

/* ═══════════════════════════════════════════════════════════
 * BOTTOM TABS CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Smart component connecting store via useTabs hook
 * to the pure TabsView presentational component.
 */

interface TabsProps {
  onPriceClick?: (price: string, side?: 'buy' | 'sell') => void;
}

const Tabs = ({ onPriceClick }: TabsProps) => {
  const {
    leftTab,
    rightTab,
    positionsCount,
    CurrentOrdersCount,
    triggersCount,
    automationCounts,
    selectedSymbol,
    setLeftTab,
    setRightTab,
    handlePriceClick,
    goToTriggers,
  } = useTabs(onPriceClick);

  return (
    <TabsView
      leftTab={leftTab}
      rightTab={rightTab}
      positionsCount={positionsCount}
      CurrentOrdersCount={CurrentOrdersCount}
      triggersCount={triggersCount}
      automationCounts={automationCounts}
      selectedSymbol={selectedSymbol}
      onLeftTabChange={setLeftTab}
      onRightTabChange={setRightTab}
      onPriceClick={handlePriceClick}
      onTriggerSuccess={goToTriggers}
    />
  );
}

export default Tabs;
