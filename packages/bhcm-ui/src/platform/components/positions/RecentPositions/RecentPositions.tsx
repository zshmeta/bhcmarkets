import {useRecentPositions} from './useRecentPositions';
import {RecentPositionsView} from './RecentPositions.view';

/* ═══════════════════════════════════════════════════════════
 * RECENT TRADES CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Smart component that connects the store via useRecentPositions hook
 * to the pure RecentPositionsView presentational component.
 *
 * This thin layer enables:
 * - RecentPositionsView to be reused anywhere without store dependencies
 * - Testing RecentPositionsView in isolation with mock data
 * - Using RecentPositionsView in Storybook without complex setup
 */

interface RecentPositionsProps {
    /** Callback when price is clicked */
    onPriceClick?: (price: string) => void;
    /** Compact mode for mobile/embedded */
    compact?: boolean;
}

const RecentPositions = ({
    onPriceClick,
    compact = false,
}: RecentPositionsProps) => {
    // All business logic extracted to hook
    const { trades, hasTrades, translations } = useRecentPositions(compact);

    // Render pure view with all data as props
    return (
        <RecentPositionsView
            trades={trades}
            hasTrades={hasTrades}
            translations={translations}
            onPriceClick={onPriceClick}
            compact={compact}
        />
    );
}

export { RecentPositions };
