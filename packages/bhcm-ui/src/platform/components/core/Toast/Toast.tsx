import { useEffect, useState, useCallback } from 'react';
import { Icons } from '../Icons';
import {
    ToastContainer as Container,
    ToastCard,
    IconsWrapper,
    MessageText,
    DismissButton,
    type ToastType,
} from './Toast.styles';

/* ═══════════════════════════════════════════════════════════
 * LEGACY TOAST API
 * ═══════════════════════════════════════════════════════════
 * Mock implementation to satisfy imports.
 * In a real app, this would dispatch to a context or store.
 */
export const toast = {
    success: (message: string, duration?: number) => {
        console.log('[Toast] Success:', message);
    },
    error: (message: string, duration?: number) => {
        console.error('[Toast] Error:', message);
    },
    warning: (message: string, duration?: number) => {
        console.warn('[Toast] Warning:', message);
    },
    info: (message: string, duration?: number) => {
        console.info('[Toast] Info:', message);
    },
};

/* ═══════════════════════════════════════════════════════════
 * Icons MAPPING
 * ═══════════════════════════════════════════════════════════
 */
const IconsMap: Record<ToastType, string> = {
    success: 'check',
    error: 'x',
    warning: 'alert-triangle',
    info: 'info',
};

/* ═══════════════════════════════════════════════════════════
 * TOAST ITEM
 * ═══════════════════════════════════════════════════════════
 * Individual toast with auto-dismiss timer and exit animation.
 */
export interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastItemProps {
    toast: ToastItem;
    onRemove: () => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    const [isExiting, setIsExiting] = useState(false);
    const duration = toast.duration ?? 4000;

    const handleRemove = useCallback(() => {
        setIsExiting(true);
        // Wait for exit animation before actual removal
        setTimeout(onRemove, 300);
    }, [onRemove]);

    // Auto-dismiss after duration
    useEffect(() => {
        const timer = setTimeout(handleRemove, duration);
        return () => clearTimeout(timer);
    }, [duration, handleRemove]);

    const toastType = toast.type as ToastType;

    return (
        <ToastCard $type={toastType} $isExiting={isExiting} role="alert">
            <IconsWrapper $type={toastType}>
                <Icons name={IconsMap[toastType] as any} size="sm" />
            </IconsWrapper>
            <MessageText>{toast.message}</MessageText>
            <DismissButton onClick={handleRemove} aria-label="Close">
                <Icons name="x" size="sm" />
            </DismissButton>
        </ToastCard>
    );
}

/* ═══════════════════════════════════════════════════════════
 * TOAST CONTAINER COMPONENT
 * ═══════════════════════════════════════════════════════════
 * Now a presentational component that receives toasts as props.
 */
interface ToastContainerProps {
    toasts?: ToastItem[];
    onRemove?: (id: string) => void;
}

const ToastContainer = ({ toasts = [], onRemove }: ToastContainerProps) => {
    if (toasts.length === 0) return null;

    return (
        <Container aria-live="polite">
            {toasts.map((toastItem) => (
                <ToastItem
                    key={toastItem.id}
                    toast={toastItem}
                    onRemove={() => onRemove?.(toastItem.id)}
                />
            ))}
        </Container>
    );
}

export { ToastContainer };
