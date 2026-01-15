import { useState, useCallback } from 'react';
import { useI18n } from '../../i18n';

/* ═══════════════════════════════════════════════════════════
 * useHelpFAQ Hook
 * ═══════════════════════════════════════════════════════════
 */

export interface Shortcut {
    key: string;
    desc: string;
}

export interface UseHelpFAQReturn {
    isOpen: boolean;
    shortcuts: Shortcut[];
    onOpen: () => void;
    onClose: () => void;
    onToggle: () => void;
    translations: {
        title: string;
        close: string;
        hint: string;
    };
}

const useHelpFAQ = (): UseHelpFAQReturn => {
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);

    const shortcuts: Shortcut[] = [
        { key: 'B', desc: t.tips.shortcuts.buy },
        { key: 'S', desc: t.tips.shortcuts.sell },
        { key: 'M', desc: t.tips.shortcuts.market },
        { key: 'L', desc: t.tips.shortcuts.limit },
        { key: 'Esc', desc: t.tips.shortcuts.cancel },
        { key: 'Enter', desc: t.tips.shortcuts.submit },
        { key: 'T', desc: t.tips.shortcuts.theme },
        { key: '?', desc: t.tips.shortcuts.toggle },
    ];

    const onOpen = useCallback(() => setIsOpen(true), []);
    const onClose = useCallback(() => setIsOpen(false), []);
    const onToggle = useCallback(() => setIsOpen(prev => !prev), []);

    return {
        isOpen,
        shortcuts,
        onOpen,
        onClose,
        onToggle,
        translations: {
            title: t.tips.shortcut,
            close: t.common.close,
            hint: t.tips.shortcuts.hint,
        },
    };
}

export default useHelpFAQ;
