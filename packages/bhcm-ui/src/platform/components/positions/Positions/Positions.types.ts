import type { TPSLTranslations } from './TPSLForm';

export interface Position {
    symbol: string;
    side: 'long' | 'short';
    quantity: string;
    avgEntryPrice: string;
}

export interface PositionPnL {
    pnl: number | null;
    pnlPercent: number | null;
    hasPrice: boolean;
}

export interface BalanceInfo {
    asset: string;
    available: string;
    locked: string;
}

export interface PositionsTranslations {
    title: string;
    noPositions: string;
    symbol: string;
    quantity: string;
    entryPrice: string;
    marketPrice: string;
    pnl: string;
    actions: string;
    tpsl: TPSLTranslations;
}
