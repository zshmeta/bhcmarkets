import { useState, useCallback, useMemo } from 'react';
import { useI18n } from '../../i18n';
import type { IconsName } from '../../core/Icons/Icons';

/* ═══════════════════════════════════════════════════════════
 * useHelpFAQ Hook
 * ═══════════════════════════════════════════════════════════
 */

export interface Shortcut {
    /** Legacy: was used for keyboard shortcut display. */
    key: string;
    /** Legacy: was used for keyboard shortcut description. */
    desc: string;
}

export type HelpItemKind = 'link' | 'action';

export interface HelpItem {
    id: string;
    kind: HelpItemKind;
    icon: IconsName;
    title: string;
    description?: string;
    href?: string;
    onClick?: () => void;
}

export interface UseHelpFAQOptions {
    contactUrl?: string;
    supportPhoneDisplay?: string;
    supportPhoneTel?: string;
    chatUrl?: string;
    onOpenChat?: () => void;
}

export interface UseHelpFAQReturn {
    isOpen: boolean;
    /** New: list of help actions to display. */
    items: HelpItem[];
    /** Legacy: keep export for backward compatibility. */
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

const DEFAULT_CONTACT_URL = 'https://bhcmarkets.com/contact';
const DEFAULT_SUPPORT_PHONE_DISPLAY = '+1 (555) 010-2000';
const DEFAULT_SUPPORT_PHONE_TEL = 'tel:+15550102000';

const tryOpenChatWidget = (): boolean => {
    if (typeof window === 'undefined') return false;
    const w = window as any;

    // Intercom
    if (typeof w.Intercom === 'function') {
        try {
            w.Intercom('show');
            return true;
        } catch {
            // ignore
        }
    }

    // Crisp
    if (Array.isArray(w.$crisp)) {
        try {
            w.$crisp.push(['do', 'chat:open']);
            return true;
        } catch {
            // ignore
        }
    }

    // Zendesk
    if (typeof w.zE === 'function') {
        try {
            w.zE('messenger', 'open');
            return true;
        } catch {
            // ignore
        }
    }

    return false;
};

const useHelpFAQ = (options: UseHelpFAQOptions = {}): UseHelpFAQReturn => {
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);

    const contactUrl = options.contactUrl || DEFAULT_CONTACT_URL;
    const supportPhoneDisplay = options.supportPhoneDisplay || DEFAULT_SUPPORT_PHONE_DISPLAY;
    const supportPhoneTel = options.supportPhoneTel || DEFAULT_SUPPORT_PHONE_TEL;
    const chatUrl = options.chatUrl;
    const onOpenChat = options.onOpenChat;

    const onOpen = useCallback(() => setIsOpen(true), []);
    const onClose = useCallback(() => setIsOpen(false), []);
    const onToggle = useCallback(() => setIsOpen(prev => !prev), []);

    const onChatNow = useCallback(() => {
        if (onOpenChat) {
            onOpenChat();
            setIsOpen(false);
            return;
        }

        const opened = tryOpenChatWidget();
        if (!opened && chatUrl && typeof window !== 'undefined') {
            window.open(chatUrl, '_blank', 'noreferrer');
        }

        setIsOpen(false);
    }, [chatUrl, onOpenChat]);

    const items = useMemo((): HelpItem[] => {
        return [
            {
                id: 'contact',
                kind: 'link',
                icon: 'mail',
                title: t.help?.contactUs || 'Contact us',
                description: t.help?.contactDesc || 'Open our contact page',
                href: contactUrl,
            },
            {
                id: 'chat',
                kind: 'action',
                icon: 'message-square',
                title: t.help?.chatNow || 'Chat now',
                description: t.help?.chatDesc || 'Open the support chat',
                onClick: onChatNow,
            },
            {
                id: 'phone',
                kind: 'link',
                icon: 'smartphone',
                title: t.help?.callUs || 'Call us',
                description: supportPhoneDisplay,
                href: supportPhoneTel,
            },
        ];
    }, [contactUrl, onChatNow, supportPhoneDisplay, supportPhoneTel, t.help]);

    // Legacy: preserve old API surface for any external consumers.
    const shortcuts: Shortcut[] = useMemo(() => [], []);

    return {
        isOpen,
        items,
        shortcuts,
        onOpen,
        onClose,
        onToggle,
        translations: {
            title: t.help?.title || 'Help',
            close: t.common.close,
            hint: t.help?.hint || '',
        },
    };
}

export { useHelpFAQ };
