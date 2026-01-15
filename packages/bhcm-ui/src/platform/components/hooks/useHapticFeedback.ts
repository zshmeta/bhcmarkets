// Stub haptic feedback hook

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export function useHapticFeedback() {
    const trigger = (type: HapticType = 'light') => {
        // Stub - no haptic feedback in browser
    };

    return { trigger };
}
