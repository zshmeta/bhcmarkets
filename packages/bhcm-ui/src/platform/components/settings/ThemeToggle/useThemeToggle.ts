import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../i18n';

/* ═══════════════════════════════════════════════════════════
 * useThemeToggle Hook
 * ═══════════════════════════════════════════════════════════
 * Extracts theme toggle business logic:
 * - localStorage persistence
 * - System preference detection
 * - DOM manipulation
 * - Translations
 */

export type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';

    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }

    return 'dark';
}

export interface UseThemeToggleReturn {
    /** Current theme */
    theme: Theme;
    /** Aria label for accessibility */
    ariaLabel: string;
    /** Icons name (sun or moon) */
    IconsName: 'sun' | 'moon';
    /** Toggle handler */
    onToggle: () => void;
}

const useThemeToggle = (): UseThemeToggleReturn => {
    const { t } = useI18n();
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    // Apply theme to DOM and persist to localStorage
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const onToggle = useCallback(() => {
        setTheme((current) => (current === 'light' ? 'dark' : 'light'));
    }, []);

    const ariaLabel = theme === 'light' ? t.theme.switchToDark : t.theme.switchToLight;
    const IconsName = theme === 'light' ? 'moon' : 'sun';

    return { theme, ariaLabel, IconsName, onToggle };
}

export { useThemeToggle };
