import type { TriggerType, TriggerCondition, TriggerAction } from './triggers.types.js';

export type TriggerStatus =
    | 'armed'
    | 'paused'
    | 'blocked'
    | 'triggered'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'expired';

export interface Trigger {
    id: string;
    symbol: string;
    type: TriggerType;
    status: TriggerStatus;
    enabled: boolean;
    condition: TriggerCondition;
    action: TriggerAction;
    allowDegraded?: boolean;
    repeat?: boolean;
    createdAt: number;
}
