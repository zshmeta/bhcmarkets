// Stub hooks for bhcm-ui components

// Media query hook
export function useIsMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
}
