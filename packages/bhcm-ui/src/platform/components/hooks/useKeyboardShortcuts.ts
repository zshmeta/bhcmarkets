// Stub keyboard shortcuts hook

interface ShortcutDef {
    key: string;
    action: () => void;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutDef[] = []) {
    // Stub - keyboard shortcuts disabled for now
    return { enabled: false };
}
