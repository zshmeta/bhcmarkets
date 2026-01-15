import { useHealthBoard } from './useHealthBoard';
import { HealthBoardView } from './HealthBoard.view';

/* ═══════════════════════════════════════════════════════════
 * METRICS PANEL CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Smart component that connects the store via useHealthBoard hook
 * to the pure HealthBoardView presentational component.
 * 
 * This thin layer enables:
 * - HealthBoardView to be reused anywhere without store dependencies
 * - Testing HealthBoardView in isolation with mock data
 * - Using HealthBoardView in Storybook without complex setup
 */

interface HealthBoardProps {
    compact?: boolean;
}

const HealthBoard = ({ compact = false }: HealthBoardProps) => {
    // All business logic extracted to hook
    const {
        hasData,
        metrics,
        compactMetrics,
        depth,
        lastUpdateTime,
        confidenceLevel,
        canTrustMetrics,
        confidenceReason,
        translations,
    } = useHealthBoard();

    // Render pure view with all data as props
    return (
        <HealthBoardView
            hasData={hasData}
            metrics={metrics}
            compactMetrics={compactMetrics}
            depth={depth}
            lastUpdateTime={lastUpdateTime}
            confidenceLevel={confidenceLevel}
            canTrustMetrics={canTrustMetrics}
            confidenceReason={confidenceReason}
            translations={translations}
            compact={compact}
        />
    );
}

export default HealthBoard;
