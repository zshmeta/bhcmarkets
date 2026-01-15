import { Icons } from '../Icons';
import type { HelpItem, Shortcut } from './useHelpFAQ';
import {
    TriggerButton,
    ModalOverlay,
    ModalPanel,
    PanelHeader,
    PanelTitle,
    CloseButton,
    ItemsList,
    ItemRow,
    ItemBadge,
    ItemContent,
    ItemTitle,
    ItemDescription,
    ItemLink,
    ItemButton,
    PanelFooter,
    FooterHint,
} from './HelpFAQ.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 */

export interface HelpFAQViewProps {
    isOpen: boolean;
    /** New: preferred render model */
    items?: HelpItem[];
    /** Legacy */
    shortcuts?: Shortcut[];
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
    items,
    shortcuts,
    onToggle,
    onClose,
    translations: t,
}: HelpFAQViewProps) => {
    const legacyItems: HelpItem[] = (shortcuts || []).map((s) => ({
        id: `shortcut-${s.key}`,
        kind: 'action',
        icon: 'key-round',
        title: s.key,
        description: s.desc,
    }));

    const renderItems = (items && items.length > 0) ? items : legacyItems;

    return (
        <>
            <TriggerButton onClick={onToggle} title={t.title}>
                <Icons name="help-circle" size="sm" />
            </TriggerButton>

            {isOpen && (
                <ModalOverlay onClick={onClose}>
                    <ModalPanel onClick={(e) => e.stopPropagation()}>
                        <PanelHeader>
                            <PanelTitle>
                                <Icons name="help-circle" size="sm" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                {t.title}
                            </PanelTitle>
                            <CloseButton onClick={onClose} title={t.close}>
                                <Icons name="x" size="sm" />
                            </CloseButton>
                        </PanelHeader>

                        <ItemsList>
                            {renderItems.map((item) => (
                                <ItemRow key={item.id}>
                                    <ItemBadge aria-hidden="true">
                                        <Icons name={item.icon} size="sm" />
                                    </ItemBadge>

                                    <ItemContent>
                                        <ItemTitle>{item.title}</ItemTitle>
                                        {item.description && <ItemDescription>{item.description}</ItemDescription>}
                                    </ItemContent>

                                    {item.kind === 'link' && item.href && (
                                        <ItemLink href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" onClick={onClose}>
                                            <Icons name="external-link" size="sm" />
                                        </ItemLink>
                                    )}

                                    {item.kind === 'action' && item.onClick && (
                                        <ItemButton type="button" onClick={item.onClick}>
                                            <Icons name="chevron-right" size="sm" />
                                        </ItemButton>
                                    )}
                                </ItemRow>
                            ))}
                        </ItemsList>

                        <PanelFooter>
                            {t.hint ? <FooterHint>{t.hint}</FooterHint> : null}
                        </PanelFooter>
                    </ModalPanel>
                </ModalOverlay>
            )}
        </>
    );
}

export { HelpFAQView };
