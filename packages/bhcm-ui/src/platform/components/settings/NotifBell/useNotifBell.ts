import { useSoundSettings, sounds } from '../../hooks/useSoundFeedback';
import { useI18n } from '../../i18n';
import { useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════
 * useNotifBell Hook
 * ═══════════════════════════════════════════════════════════
 */

export interface UseNotifBellReturn {
    enabled: boolean;
    title: string;
    ariaLabel: string;
    onToggle: () => void;
}

const useNotifBell = (): UseNotifBellReturn => {
    const { t } = useI18n();
    const { enabled, setEnabled } = useSoundSettings();

    const onToggle = useCallback(() => {
        const newEnabled = !enabled;
        setEnabled(newEnabled);
        if (newEnabled) sounds.click();
    }, [enabled, setEnabled]);

    return {
        enabled,
        title: enabled ? (t.sound?.disable || 'Disable sound') : (t.sound?.enable || 'Enable sound'),
        ariaLabel: t.sound?.toggle || 'Toggle sound',
        onToggle,
    };
}

export { useNotifBell } ;
