import {useThemeToggle} from './useThemeToggle';
import {ThemeToggleView} from './ThemeToggle.view';

/* ═══════════════════════════════════════════════════════════
 * THEME TOGGLE CONTAINER
 * ═══════════════════════════════════════════════════════════
 */

const ThemeToggle = () => {
    const { IconsName, ariaLabel, onToggle } = useThemeToggle();
    return <ThemeToggleView IconsName={IconsName} ariaLabel={ariaLabel} onToggle={onToggle} />;
}

export { ThemeToggle };
