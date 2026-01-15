import { Icons } from '../Icons';
import type { Shortcut } from './useHelpFAQ';
import {
    TriggerButton,
    ModalOverlay,
    ModalPanel,
    PanelHeader,
    PanelTitle,
    CloseButton,
    ShortcutsList,
    ShortcutItem,
    KeyBadge,
    KeyDescription,
    PanelFooter,
    FooterHint,
} from './HelpFAQ.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 */

export interface HelpFAQViewProps {
    isOpen: boolean;
    shortcuts: Shortcut[];
    onToggle: () => void;
    onClose: () => void;
    translations: {
        title: string;
        close: string;
        hint: string;
    };
}

const HelpFAQView = ({
    isOpen,
    shortcuts,
    onToggle,
    onClose,
    translations: t,
}: HelpFAQViewProps) => {
    return (
        <>
            <TriggerButton onClick={onToggle} title={t.title}>
                <Icons name="zap" size="sm" />
            </TriggerButton>

            {isOpen && (
                <ModalOverlay onClick={onClose}>
                    <ModalPanel onClick={(e) => e.stopPropagation()}>
                        <PanelHeader>
                            <PanelTitle>
                                <Icons name="zap" size="sm" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                {t.title}
                            </PanelTitle>
                            <CloseButton onClick={onClose} title={t.close}>
                                <Icons name="x" size="sm" />
                            </CloseButton>
                        </PanelHeader>

                        <ShortcutsList>
                            {shortcuts.map((s) => (
                                <ShortcutItem key={s.key}>
                                    <KeyBadge>{s.key}</KeyBadge>
                                    <KeyDescription>{s.desc}</KeyDescription>
                                </ShortcutItem>
                            ))}
                        </ShortcutsList>

                        <PanelFooter>
                            <FooterHint>{t.hint}</FooterHint>
                        </PanelFooter>
                    </ModalPanel>
                </ModalOverlay>
            )}
        </>
    );
}

export default HelpFAQView;
