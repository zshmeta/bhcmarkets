/* ═══════════════════════════════════════════════════════════
 * BOTTOM TABS - PUBLIC API
 * ═══════════════════════════════════════════════════════════
 * Two-column tabbed layout for positions, orders, and automation.
 * 
 *   // Option 1: Smart container (connected to stores)
 *   import { Tabs } from '@/components-refactored/Tabs';
 *   <Tabs onPriceClick={handler} />
 *   
 *   // Option 2: Dumb component (for testing/Storybook)
 *   import { TabsView, useTabs } from '@/components-refactored/Tabs';
 */

// Smart container
export { Tabs } from './Tabs';

// Dumb presentational component
export { TabsView } from './Tabs.view';
export type { TabsViewProps } from './Tabs.view';

// Business logic hook
export { useTabs } from './useTabs';
export type {
    UseTabsReturn,
    LeftTab,
    RightTab,
    AutomationCounts,
} from './useTabs';
