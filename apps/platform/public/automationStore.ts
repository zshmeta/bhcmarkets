import { create } from 'zustand';
import type { Trigger, TriggerStatus } from '../src/types/automation';

/* ═══════════════════════════════════════════════════════════
 * AUTOMATION STORE
 * ═══════════════════════════════════════════════════════════
 * Manages trigger/automation state for the WorkPanel components.
 */

export interface AutomationState {
    /** All triggers */
    triggers: Trigger[];
    /** Execution history/logs */
    executionLogs: Array<{
        id: string;
        triggerId: string;
        executedAt: number;
        result: 'success' | 'failed' | 'partial';
        message?: string;
    }>;
    /** Loading state */
    isLoading: boolean;
}

export interface AutomationActions {
    /** Add a new trigger */
    addTrigger: (trigger: Omit<Trigger, 'id' | 'createdAt'>) => void;
    /** Remove a trigger by ID */
    removeTrigger: (id: string) => void;
    /** Update trigger status */
    updateTriggerStatus: (id: string, status: TriggerStatus) => void;
    /** Toggle trigger pause/resume */
    toggleTrigger: (id: string) => void;
    /** Clear all triggers */
    clearTriggers: () => void;
    /** Clear execution logs */
    clearLogs: () => void;
}

export const useAutomationStore = create<AutomationState & AutomationActions>((set, get) => ({
    // State
    triggers: [],
    executionLogs: [],
    isLoading: false,

    // Actions
    addTrigger: (triggerData) => {
        const newTrigger: Trigger = {
            ...triggerData,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
        } as Trigger;
        set((state) => ({ triggers: [...state.triggers, newTrigger] }));
    },

    removeTrigger: (id) => {
        set((state) => ({
            triggers: state.triggers.filter((t) => t.id !== id),
        }));
    },

    updateTriggerStatus: (id, status) => {
        set((state) => ({
            triggers: state.triggers.map((t) =>
                t.id === id ? { ...t, status } : t
            ),
        }));
    },

    toggleTrigger: (id) => {
        set((state) => ({
            triggers: state.triggers.map((t) => {
                if (t.id !== id) return t;
                const newStatus: TriggerStatus = t.status === 'paused' ? 'armed' : 'paused';
                return { ...t, status: newStatus };
            }),
        }));
    },

    clearTriggers: () => set({ triggers: [] }),
    clearLogs: () => set({ executionLogs: [] }),
}));

// Selectors
export const selectTriggers = (state: AutomationState) => state.triggers;
export const selectExecutionLogs = (state: AutomationState) => state.executionLogs;
export const selectArmedTriggers = (state: AutomationState) =>
    state.triggers.filter((t) => t.status === 'armed');
export const selectTriggerById = (id: string) => (state: AutomationState) =>
    state.triggers.find((t) => t.id === id);
