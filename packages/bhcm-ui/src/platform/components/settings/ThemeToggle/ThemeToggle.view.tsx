import { Icons } from '../Icons';
import { ToggleButton } from './ThemeToggle.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 * ThemeToggle.view.tsx - Dumb component with no state logic.
 */

export interface ThemeToggleViewProps {
    /** Icons name (sun or moon) */
    IconsName: 'sun' | 'moon';
    /** Aria label for accessibility */
    ariaLabel: string;
    /** Toggle handler */
    onToggle: () => void;
}

const ThemeToggleView = ({ IconsName, ariaLabel, onToggle }: ThemeToggleViewProps) => {
    return (
        <ToggleButton onClick={onToggle} aria-label={ariaLabel}>
            <Icons name={IconsName} size="sm" />
        </ToggleButton>
    );
}

export { ThemeToggleView };
