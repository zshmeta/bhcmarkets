import { useCallback } from 'react';
import { useI18n, type LocaleKey } from '../../i18n';

/* ═══════════════════════════════════════════════════════════
 * useLanguageToggle Hook
 * ═══════════════════════════════════════════════════════════
 */

export interface UseLanguageToggleReturn {
    targetLanguage: string;
    label: string;
    onToggle: () => void;
}

const useLanguageToggle = (): UseLanguageToggleReturn  => {
    const { locale, setLocale, t } = useI18n();

    const onToggle = useCallback(() => {
        const newLocale: LocaleKey = locale === 'zh-CN' ? 'en-US' : 'zh-CN';
        setLocale(newLocale);
    }, [locale, setLocale]);

    return {
        targetLanguage: locale === 'zh-CN' ? t.language.en : t.language.zh,
        label: t.language.label,
        onToggle,
    };
}

export { useLanguageToggle };
