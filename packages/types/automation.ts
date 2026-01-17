import type { OrderSide, OrderType } from './trading';

export type TriggerType = 'conditional' | 'schedule';

export type TriggerOperator = 'gte' | 'lte' | 'eq';

export type CrossDirection = 'up' | 'down';

export type QuantityMode = 'fixed' | 'percent';

export type PriceSource = 'last' | 'mid' | 'bid' | 'ask';

export interface TriggerCondition {
    priceSource: PriceSource;
    operator: TriggerOperator;
    threshold: string;
    direction?: CrossDirection;
    debounceMs?: number;
    cooldownMs?: number;
}

export interface TriggerAction {
    type: 'order' | 'notification' | 'webhook';
    side: OrderSide;
    orderType: OrderType;
    limitPrice?: string;
    quantityMode: QuantityMode;
    quantityValue: string;
    timeInForce?: string;
}

export type TriggerStatus = 'armed' | 'paused' | 'blocked' | 'triggered' | 'completed' | 'failed' | 'cancelled' | 'expired';

export interface Trigger {
    id: string;
    type: string;
    symbol: string;
    status: TriggerStatus;
    condition: TriggerCondition;
    action: TriggerAction;
    createdAt: number;
}
