/* ═══════════════════════════════════════════════════════════
 * ACCOUNT OVERVIEW PANEL - PUBLIC API
 * ═══════════════════════════════════════════════════════════
 * Dashboard widget for account summary and quick actions.
 * 
 *   import { UserOverview } from '@/components-refactored/UserOverview';
 */

// Container (smart component with store connection)
export { UserOverview } from './UserOverview';

// View (dumb component, pure props - for UI library)
export { UserOverviewView } from './UserOverview.view';
export type { UserOverviewViewProps } from './UserOverview.view';

// Hook (business logic)
export { useUserOverview } from './useUserOverview';
export { formatNumber } from '../../../../../../sdk/utils';
export type {
    UseUserOverviewReturn,
    UserInfo,
    AccountInfo,
    EquityData,
    AccountOverviewTranslations,
} from './useUserOverview';
