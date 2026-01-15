// Stub sound feedback hook

export const sounds = {
    click: 'click',
    success: 'success',
    error: 'error',
    notification: 'notification',
} as const;

export function useSoundSettings() {
    const playSound = (sound: keyof typeof sounds) => {
        // Stub - no sound in simple mode
    };

    const enabled = false;
    const setEnabled = (v: boolean) => { };

    return { playSound, enabled, setEnabled };
}
