import React, { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../Icons';
import {
    Overlay,
    ModalPanel,
    DrawerPanel,
    ModalHeader,
    ModalTitle,
    CloseButton,
    ModalBody,
    ModalFooter,
} from './Modal.styles';

/* ═══════════════════════════════════════════════════════════
 * MODAL PRIMITIVE
 * ═══════════════════════════════════════════════════════════
 * Reusable modal/drawer component with consistent behavior:
 * - Overlay click to close
 * - Escape key to close
 * - Body scroll lock
 * - Portal rendering
 * - Two variants: centered modal or right drawer
 */

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    /** 'modal' = centered, 'drawer' = slides from right */
    variant?: 'modal' | 'drawer';
    /** Show close button in header */
    showCloseButton?: boolean;
    /** Close on overlay click */
    closeOnOverlayClick?: boolean;
    /** Close on Escape key */
    closeOnEscape?: boolean;
}

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    variant = 'modal',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
}: ModalProps) => {
    // Escape key handler
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose, closeOnEscape]);

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [isOpen]);

    const handleOverlayClick = useCallback(() => {
        if (closeOnOverlayClick) onClose();
    }, [closeOnOverlayClick, onClose]);

    const handlePanelClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    if (!isOpen) return null;

    const Panel = variant === 'drawer' ? DrawerPanel : ModalPanel;

    const content = (
        <>
            <Overlay onClick={handleOverlayClick} />
            <Panel onClick={handlePanelClick}>
                {(title || showCloseButton) && (
                    <ModalHeader>
                        {title && <ModalTitle>{title}</ModalTitle>}
                        {showCloseButton && (
                            <CloseButton onClick={onClose} aria-label="Close">
                                <Icons name="x" size="sm" />
                            </CloseButton>
                        )}
                    </ModalHeader>
                )}
                <ModalBody>{children}</ModalBody>
                {footer && <ModalFooter>{footer}</ModalFooter>}
            </Panel>
        </>
    );

    // Portal to body for proper stacking
    return createPortal(content, document.body);
}

// Also export individual styled components for custom compositions
export {
    Overlay,
    ModalPanel,
    DrawerPanel,
    ModalHeader,
    ModalTitle,
    CloseButton,
    ModalBody,
    ModalFooter,
    Modal
};