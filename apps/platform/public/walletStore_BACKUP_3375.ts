import { create } from 'zustand';
import Decimal from 'decimal.js';
import type { ChainType, LedgerFilter, LedgerType, OnboardingStage } from '../src/types/wallet';
import { generateUUID } from '../src/utils/uuid';

export interface WalletBalance {
	asset: string;
	available: string;
	frozen: string;
	total: string;
}

export interface PaymentMethod {
	id: string;
	bankName: string;
	lastFour: string;
	alias?: string;
}

export interface CryptoAddress {
	id: string;
	chain: ChainType;
	address: string;
	alias?: string;
}

export interface DepositRecord {
	depositId: string;
	asset: string;
	amount: string;
	sourceType: 'bank' | 'crypto';
	sourceId: string;
	status: 'pending' | 'confirmed';
	createdAt: number;
}

export interface WithdrawRecord {
	withdrawId: string;
	asset: string;
	amount: string;
	destinationType: 'bank' | 'crypto';
	destinationId: string;
	fee: string;
	status: 'processing' | 'completed' | 'failed';
	createdAt: number;
}

export interface LedgerEntry {
	entryId: string;
	type: LedgerType;
	asset: string;
	amount: string;
	fee: string;
	direction: '+' | '-';
	referenceId: string;
	createdAt: number;
}

export interface PerformanceMetrics {
	winRate: number;
	profitFactor: number;
	maxDrawdown: number;
	totalRealizedPnl: string;
}

export interface WalletAccount {
	id: string;
	createdAt: number;
}

interface WalletState {
	account: WalletAccount | null;
	balances: WalletBalance[];
	paymentMethods: PaymentMethod[];
	cryptoAddresses: CryptoAddress[];
	deposits: DepositRecord[];
	withdraws: WithdrawRecord[];
	ledger: LedgerEntry[];
<<<<<<< HEAD
	performanceMetrics: {
		winRate: number;
		profitFactor: number;
		maxDrawdown: number;
		totalRealizedPnl: string;
	};
=======
	performanceMetrics: PerformanceMetrics;
>>>>>>> a7f459e7aee32731646702796565e339698b100a
}

interface WalletActions {
	createAccount: () => void;
	getOnboardingStage: () => OnboardingStage;
	getTotalEquity: (prices: Record<string, string | number>) => string;
	getFilteredLedger: (filter: LedgerFilter) => LedgerEntry[];
	updatePerformanceMetrics: (prices: Record<string, string>) => void;

	addPaymentMethod: (bankName: string, lastFour: string, alias?: string) => void;
	removePaymentMethod: (id: string) => void;
	addCryptoAddress: (chain: ChainType, address: string, alias?: string) => void;
	removeCryptoAddress: (id: string) => void;

	createDeposit: (asset: string, amount: string, sourceType: 'bank' | 'crypto', sourceId: string) => DepositRecord;
	confirmDeposit: (depositId: string) => void;

	createWithdraw: (asset: string, amount: string, destinationType: 'bank' | 'crypto', destinationId: string) => WithdrawRecord | null;

	updatePerformanceMetrics: (prices: Record<string, string>) => void;
}

const ensureBalance = (balances: WalletBalance[], asset: string): WalletBalance => {
	const existing = balances.find((b) => b.asset === asset);
	if (existing) return existing;
	const next: WalletBalance = { asset, available: '0', frozen: '0', total: '0' };
	balances.push(next);
	return next;
};

const addLedger = (ledger: LedgerEntry[], entry: Omit<LedgerEntry, 'entryId'>) => {
	ledger.unshift({ ...entry, entryId: generateUUID() });
};

export const useWalletStore = create<WalletState & WalletActions>((set, get) => ({
	account: null,
	balances: [
		{ asset: 'USDT', available: '0', frozen: '0', total: '0' },
		{ asset: 'BTC', available: '0', frozen: '0', total: '0' },
		{ asset: 'ETH', available: '0', frozen: '0', total: '0' },
	],
	paymentMethods: [],
	cryptoAddresses: [],
	deposits: [],
	withdraws: [],
	ledger: [],
	performanceMetrics: {
		winRate: 0,
		profitFactor: 0,
		maxDrawdown: 0,
<<<<<<< HEAD
		totalRealizedPnl: '0',
=======
		totalRealizedPnl: '0.00',
>>>>>>> a7f459e7aee32731646702796565e339698b100a
	},

	createAccount: () => {
		set((state) => {
			if (state.account) return state;
			const createdAt = Date.now();
			const account: WalletAccount = { id: `acct_${createdAt}`, createdAt };
			addLedger(state.ledger, {
				type: 'DEPOSIT',
				asset: 'USDT',
				amount: '0',
				fee: '0',
				direction: '+',
				referenceId: account.id,
				createdAt,
			});
			return { ...state, account };
		});
	},

	getOnboardingStage: () => {
		const { account, paymentMethods, cryptoAddresses, balances } = get();
		if (!account) return 'not_created';
		if (paymentMethods.length === 0 && cryptoAddresses.length === 0) return 'no_payment_method';
		const usdt = balances.find((b) => b.asset === 'USDT');
		const hasFunds = usdt ? new Decimal(usdt.total).gt(0) : false;
		if (!hasFunds) return 'no_funds';
		return 'ready';
	},

	getTotalEquity: (prices) => {
		const { balances } = get();
		const total = balances.reduce((acc, b) => {
			const qty = new Decimal(b.total || '0');
			if (qty.lte(0)) return acc;
			const px = prices[b.asset];
			const price = new Decimal(px === undefined ? (b.asset === 'USDT' ? 1 : 0) : px);
			return acc.plus(qty.times(price));
		}, new Decimal(0));
		return total.toFixed(2);
	},

	getFilteredLedger: (filter) => {
		const { ledger } = get();
		if (filter === 'all') return ledger;

		const by: Record<Exclude<LedgerFilter, 'all'>, (t: LedgerType) => boolean> = {
			deposit: (t) => t === 'DEPOSIT',
			withdraw: (t) => t.startsWith('WITHDRAW'),
			trade: (t) => t === 'FILL' || t === 'ORDER_FREEZE' || t === 'ORDER_UNFREEZE',
			fee: (t) => t === 'FEE',
		};

		return ledger.filter((e) => by[filter](e.type));
	},

	updatePerformanceMetrics: (_prices) => {
		// This store currently models a simulated wallet.
		// Keep metrics stable unless/until real trade settlement is wired.
		set((state) => ({ performanceMetrics: state.performanceMetrics }));
	},

	addPaymentMethod: (bankName, lastFour, alias) => {
		set((state) => ({
			paymentMethods: [
				...state.paymentMethods,
				{ id: generateUUID(), bankName, lastFour, alias },
			],
		}));
	},
	removePaymentMethod: (id) => {
		set((state) => ({ paymentMethods: state.paymentMethods.filter((m) => m.id !== id) }));
	},
	addCryptoAddress: (chain, address, alias) => {
		set((state) => ({
			cryptoAddresses: [
				...state.cryptoAddresses,
				{ id: generateUUID(), chain, address, alias },
			],
		}));
	},
	removeCryptoAddress: (id) => {
		set((state) => ({ cryptoAddresses: state.cryptoAddresses.filter((a) => a.id !== id) }));
	},

	createDeposit: (asset, amount, sourceType, sourceId) => {
		const deposit: DepositRecord = {
			depositId: generateUUID(),
			asset,
			amount,
			sourceType,
			sourceId,
			status: 'pending',
			createdAt: Date.now(),
		};

		set((state) => ({ deposits: [deposit, ...state.deposits] }));
		return deposit;
	},

	confirmDeposit: (depositId) => {
		set((state) => {
			const deposit = state.deposits.find((d) => d.depositId === depositId);
			if (!deposit || deposit.status !== 'pending') return state;

			const balances = [...state.balances.map((b) => ({ ...b }))];
			const target = ensureBalance(balances, deposit.asset);
			const addAmt = new Decimal(deposit.amount || '0');

			const available = new Decimal(target.available).plus(addAmt);
			const total = new Decimal(target.total).plus(addAmt);
			target.available = available.toString();
			target.total = total.toString();

			const deposits = state.deposits.map((d) =>
				d.depositId === depositId ? { ...d, status: 'confirmed' } : d
			);

			const ledger = [...state.ledger];
			addLedger(ledger, {
				type: 'DEPOSIT',
				asset: deposit.asset,
				amount: deposit.amount,
				fee: '0',
				direction: '+',
				referenceId: deposit.depositId,
				createdAt: Date.now(),
			});

			return { ...state, balances, deposits, ledger };
		});
	},

	createWithdraw: (asset, amount, destinationType, destinationId) => {
		const feeRate = new Decimal(0.001);
		const minFee = new Decimal(1);
		const amt = new Decimal(amount || '0');
		if (amt.lte(0)) return null;

		let result: WithdrawRecord | null = null;

		set((state) => {
			const balances = [...state.balances.map((b) => ({ ...b }))];
			const bal = ensureBalance(balances, asset);

			const fee = Decimal.max(amt.times(feeRate), minFee);
			const required = amt.plus(fee);
			if (new Decimal(bal.available).lt(required)) {
				result = null;
				return state;
			}

			bal.available = new Decimal(bal.available).minus(required).toString();
			bal.frozen = new Decimal(bal.frozen).plus(required).toString();
			bal.total = new Decimal(bal.total).minus(fee).toString();

			const withdraw: WithdrawRecord = {
				withdrawId: generateUUID(),
				asset,
				amount: amt.toString(),
				destinationType,
				destinationId,
				fee: fee.toString(),
				status: 'processing',
				createdAt: Date.now(),
			};

			const withdraws = [withdraw, ...state.withdraws];
			const ledger = [...state.ledger];

			addLedger(ledger, {
				type: 'WITHDRAW_FREEZE',
				asset,
				amount: amt.toString(),
				fee: fee.toString(),
				direction: '-',
				referenceId: withdraw.withdrawId,
				createdAt: Date.now(),
			});

			result = withdraw;
			return { ...state, balances, withdraws, ledger };
		});

		// Complete after a short simulated delay
		if (result) {
			setTimeout(() => {
				set((state) => {
					const w = state.withdraws.find((x) => x.withdrawId === result?.withdrawId);
					if (!w || w.status !== 'processing') return state;

					const balances = [...state.balances.map((b) => ({ ...b }))];
					const bal = ensureBalance(balances, asset);
					const totalFrozen = new Decimal(w.amount).plus(w.fee);
					bal.frozen = new Decimal(bal.frozen).minus(totalFrozen).toString();

					const withdraws = state.withdraws.map((x) =>
						x.withdrawId === w.withdrawId ? { ...x, status: 'completed' } : x
					);

					const ledger = [...state.ledger];
					addLedger(ledger, {
						type: 'WITHDRAW_COMPLETE',
						asset,
						amount: w.amount,
						fee: w.fee,
						direction: '-',
						referenceId: w.withdrawId,
						createdAt: Date.now(),
					});

					return { ...state, balances, withdraws, ledger };
				});
			}, 1200);
		}

		return result;
	},

	updatePerformanceMetrics: (prices) => {
		// Mock implementation for demo purposes
		// In a real app, this would calculate stats from the ledger/trade history
		set({
			performanceMetrics: {
				winRate: 65,
				profitFactor: 1.5,
				maxDrawdown: 12,
				totalRealizedPnl: '450.00',
			},
		});
	},
}));

// Selectors
export const selectBalances = (state: WalletState) => state.balances;
export const selectAccount = (state: WalletState) => state.account;
export const selectPaymentMethods = (state: WalletState) => state.paymentMethods;
export const selectCryptoAddresses = (state: WalletState) => state.cryptoAddresses;
export const selectDeposits = (state: WalletState) => state.deposits;
export const selectWithdraws = (state: WalletState) => state.withdraws;

export const selectTotalBalance = (state: WalletState) => {
	const usdt = state.balances.find((b) => b.asset === 'USDT');
	const total = usdt ? parseFloat(usdt.total) : 0;
	const available = usdt ? parseFloat(usdt.available) : 0;
	return { total, available };
};
