import { create } from 'zustand';
import Decimal from 'decimal.js';
import type { PaperOrder, OrderSide, OrderType } from '../../../../packages/bhcm-ui/src/types/trading';
import { generateUUID } from '../../../../packages/sdk/utils/uuid';
import { apiClient } from '../../../../packages/bhcm-ui/src/platform/components/api/apiClient';

export type PositionSide = 'long' | 'short';

export interface Position {
	symbol: string;
	side: PositionSide;
	quantity: string;
	avgEntryPrice: string;
}

interface TradingState {
	focusMode: boolean;
	orders: PaperOrder[];
	positions: Map<string, Position>;
	positionMode: 'oneway' | 'hedge';
	lastLevel2Book: unknown;
	isPaperTrading: boolean;

	setFocusMode: (focus: boolean) => void;
	updateLevel2BookForMatching: (book: unknown) => void;
	setTradingMode: (isPaper: boolean) => void;
	fetchOrders: () => Promise<void>;
	fetchPositions: () => Promise<void>;

	createOrder: (input: {
		symbol: string;
		side: OrderSide;
		type: OrderType;
		price?: string;
		quantity: string;
		triggerPrice?: string;
		takeProfitPrice?: string;
		stopLossPrice?: string;
	}) => Promise<{ success: boolean; clientOrderId?: string }>;
	createOCOOrder: (..._args: any[]) => Promise<{ success: boolean }>;
	createTrailingStopOrder: (..._args: any[]) => Promise<{ success: boolean }>;
	cancelOrder: (clientOrderId: string) => void;
	getCurrentOrders: () => PaperOrder[];
}

const makePaperOrder = (partial: { symbol: string; side: OrderSide; type: OrderType; quantity: string; price?: string }): PaperOrder => ({
	clientOrderId: generateUUID(),
	symbol: partial.symbol,
	side: partial.side,
	type: partial.type,
	price: partial.price || '0',
	quantity: partial.quantity,
	filledQty: '0',
	status: 'open',
	timestamp: Date.now(),
});

export const useTradingStore = create<TradingState>((set, get) => ({
	focusMode: false,
	orders: [],
	positions: new Map(),
	positionMode: 'hedge',
	lastLevel2Book: null,
	isPaperTrading: true,

	setFocusMode: (focus) => set({ focusMode: focus }),
	updateLevel2BookForMatching: (book) => set({ lastLevel2Book: book }),
	setTradingMode: (isPaper) => set({ isPaperTrading: isPaper }),

	fetchOrders: async () => {
		if (get().isPaperTrading) return;
		try {
			const response = await apiClient.get<PaperOrder[]>('/orders');
			set({ orders: response });
		} catch (error) {
			console.error('Failed to fetch orders', error);
		}
	},

	fetchPositions: async () => {
		if (get().isPaperTrading) return;
		try {
			const response = await apiClient.get<Position[]>('/positions');
			const positionsMap = new Map();
			response.forEach((p) => positionsMap.set(p.symbol, p));
			set({ positions: positionsMap });
		} catch (error) {
			console.error('Failed to fetch positions', error);
		}
	},

	createOrder: async (input) => {
		const state = get();
		if (state.isPaperTrading) {
			const order = makePaperOrder(input);
			set((state) => ({ orders: [order, ...state.orders] }));

			// Very simple simulated immediate fill for market orders
			if (input.type === 'market') {
				const filled = { ...order, status: 'filled', filledQty: input.quantity, timestamp: Date.now() } as PaperOrder;
				set((state) => ({ orders: [filled, ...state.orders.filter((o) => o.clientOrderId !== order.clientOrderId)] }));

				// Update a naive position for demo (long-only)
				set((state) => {
					const positions = new Map(state.positions);
					const existing = positions.get(input.symbol);
					const qty = new Decimal(existing?.quantity || '0').plus(input.side === 'buy' ? input.quantity : new Decimal(input.quantity).negated());
					positions.set(input.symbol, {
						symbol: input.symbol,
						side: 'long',
						quantity: Decimal.max(qty, 0).toString(),
						avgEntryPrice: existing?.avgEntryPrice || (input.price || '0'),
					});
					return { positions };
				});
			}

			return { success: true, clientOrderId: order.clientOrderId };
		} else {
			try {
				const response = await apiClient.post<{ success: boolean; clientOrderId?: string }>('/orders', input);
				return response;
			} catch (error) {
				console.error('Failed to create order', error);
				return { success: false };
			}
		}
	},

	createOCOOrder: async () => ({ success: true }),
	createTrailingStopOrder: async () => ({ success: true }),

	cancelOrder: (clientOrderId) => {
		set((state) => ({
			orders: state.orders.map((o) =>
				o.clientOrderId === clientOrderId ? ({ ...o, status: 'cancelled', timestamp: Date.now() } as PaperOrder) : o
			),
		}));
	},

	getCurrentOrders: () => {
		return get().orders.filter((o) => o.status === 'open');
	},
}));

// Selectors
export const selectFocusMode = (state: TradingState) => state.focusMode;
export const selectActiveOrder = (_state: TradingState) => null;
export const selectPositionMode = (state: TradingState) => state.positionMode;
export const selectPositions = (state: TradingState) => state.positions;
