import { create } from 'zustand';
import { Decimal } from 'decimal.js';
import type { ChainType, LedgerFilter, LedgerType, OnboardingStage } from '@repo/sdk';
import { generateUUID } from '@repo/sdk';
import { apiClient } from '@repo/sdk';

// =============================================================================
// TYPES
// =============================================================================

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

// WalletLedgerEntry is defined in wallet.types.ts - import for local use
import type { WalletLedgerEntry } from '../types/wallet.types.js';
// Re-export for backward compatibility
export type { WalletLedgerEntry } from '../types/wallet.types.js';

export interface PerformanceMetrics {
	winRate: number;
	profitFactor: number;
	maxDrawdown: number;
	totalRealizedPnl: string;
}

export interface WalletAccount {
	id: string;
	currency: string;
	balance: string;
	locked: string;
	status: string;
	createdAt: number;
}

// Backend API response types
interface BackendAccount {
	id: string;
	userId: string;
	currency: string;
	balance: string;
	locked: string;
	available: string;
	accountType: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}

interface BackendAccountsResponse {
	accounts: BackendAccount[];
}

interface BackendDepositResponse {
	success: boolean;
	account: BackendAccount;
}

interface BackendWithdrawResponse {
	success: boolean;
	account: BackendAccount;
}

interface BackendCreateAccountResponse {
	account: BackendAccount;
}

// =============================================================================
// STATE & ACTIONS
// =============================================================================

interface WalletState {
	// Connection state
	isLoading: boolean;
	error: string | null;
	isConnectedToBackend: boolean;

	// Account data
	accounts: WalletAccount[];
	primaryAccountId: string | null;
	balances: WalletBalance[];

	// Payment methods (local for now)
	paymentMethods: PaymentMethod[];
	cryptoAddresses: CryptoAddress[];

	// Transaction history (local cache)
	deposits: DepositRecord[];
	withdraws: WithdrawRecord[];
	ledger: WalletLedgerEntry[];

	// Performance metrics
	performanceMetrics: PerformanceMetrics;
}

interface WalletActions {
	// Backend integration
	fetchAccounts: () => Promise<void>;
	createAccount: (currency?: string) => Promise<{ success: boolean; error?: string }>;
	deposit: (accountId: string, amount: string, reference?: string) => Promise<{ success: boolean; error?: string }>;
	withdraw: (accountId: string, amount: string) => Promise<{ success: boolean; error?: string }>;

	// Legacy sync methods (for fallback/simulation)
	createAccountSync: () => void;
	createDepositSync: (asset: string, amount: string, sourceType: 'bank' | 'crypto', sourceId: string) => DepositRecord;
	confirmDepositSync: (depositId: string) => void;
	createWithdrawSync: (asset: string, amount: string, destinationType: 'bank' | 'crypto', destinationId: string) => WithdrawRecord | null;

	// Utility methods
	getOnboardingStage: () => OnboardingStage;
	getTotalEquity: (prices: Record<string, string | number>) => string;
	getFilteredLedger: (filter: LedgerFilter) => WalletLedgerEntry[];
	updatePerformanceMetrics: (prices: Record<string, string>) => void;

	// Payment method management (local)
	addPaymentMethod: (bankName: string, lastFour: string, alias?: string) => void;
	removePaymentMethod: (id: string) => void;
	addCryptoAddress: (chain: ChainType, address: string, alias?: string) => void;
	removeCryptoAddress: (id: string) => void;

	// Error handling
	clearError: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

const ensureBalance = (balances: WalletBalance[], asset: string): WalletBalance => {
	const existing = balances.find((b) => b.asset === asset);
	if (existing) return existing;
	const next: WalletBalance = { asset, available: '0', frozen: '0', total: '0' };
	balances.push(next);
	return next;
};

const addLedger = (ledger: WalletLedgerEntry[], entry: Omit<WalletLedgerEntry, 'entryId'>) => {
	ledger.unshift({ ...entry, entryId: generateUUID() });
};

const backendAccountToWallet = (acc: BackendAccount): WalletAccount => ({
	id: acc.id,
	currency: acc.currency,
	balance: acc.balance,
	locked: acc.locked,
	status: acc.status,
	createdAt: new Date(acc.createdAt).getTime(),
});

const backendAccountsToBalances = (accounts: BackendAccount[]): WalletBalance[] => {
	return accounts.map((acc) => ({
		asset: acc.currency,
		available: acc.available || new Decimal(acc.balance).minus(acc.locked).toString(),
		frozen: acc.locked,
		total: acc.balance,
	}));
};

// =============================================================================
// STORE
// =============================================================================

export const useWalletStore = create<WalletState & WalletActions>((set, get) => ({
	// Initial state
	isLoading: false,
	error: null,
	isConnectedToBackend: false,
	accounts: [],
	primaryAccountId: null,
	balances: [
		{ asset: 'USD', available: '0', frozen: '0', total: '0' },
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
		totalRealizedPnl: '0',
	},

	// ---------------------------------------------------------------------------
	// BACKEND INTEGRATION
	// ---------------------------------------------------------------------------

	fetchAccounts: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await apiClient.get<BackendAccountsResponse>('/accounts');
			const accounts = response.accounts.map(backendAccountToWallet);
			const balances = backendAccountsToBalances(response.accounts);

			set({
				accounts,
				balances,
				primaryAccountId: accounts.length > 0 ? accounts[0]!.id : null,
				isConnectedToBackend: true,
				isLoading: false,
			});
		} catch (error) {
			console.error('Failed to fetch accounts:', error);
			set({
				error: error instanceof Error ? error.message : 'Failed to fetch accounts',
				isConnectedToBackend: false,
				isLoading: false,
			});
		}
	},

	createAccount: async (currency = 'USD') => {
		set({ isLoading: true, error: null });
		try {
			const response = await apiClient.post<BackendCreateAccountResponse>('/accounts', {
				currency,
				accountType: 'spot',
			});

			const newAccount = backendAccountToWallet(response.account);
			const newBalance: WalletBalance = {
				asset: response.account.currency,
				available: response.account.available || '0',
				frozen: response.account.locked,
				total: response.account.balance,
			};

			set((state) => ({
				accounts: [...state.accounts, newAccount],
				balances: [...state.balances.filter(b => b.asset !== currency), newBalance],
				primaryAccountId: state.primaryAccountId || newAccount.id,
				isConnectedToBackend: true,
				isLoading: false,
			}));

			return { success: true };
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Failed to create account';
			set({ error: errorMsg, isLoading: false });
			return { success: false, error: errorMsg };
		}
	},

	deposit: async (accountId, amount, reference) => {
		set({ isLoading: true, error: null });
		try {
			const response = await apiClient.post<BackendDepositResponse>(
				`/accounts/${accountId}/deposit`,
				{ amount, reference }
			);

			if (response.success) {
				// Update account and balance from response
				const updatedAccount = backendAccountToWallet(response.account);
				const updatedBalance: WalletBalance = {
					asset: response.account.currency,
					available: response.account.available,
					frozen: response.account.locked,
					total: response.account.balance,
				};

				set((state) => {
					// Update accounts
					const accounts = state.accounts.map((a) =>
						a.id === accountId ? updatedAccount : a
					);

					// Update balances
					const balances = state.balances.map((b) =>
						b.asset === updatedBalance.asset ? updatedBalance : b
					);

					// Add to local ledger cache
					const ledger = [...state.ledger];
					addLedger(ledger, {
						type: 'DEPOSIT',
						asset: updatedBalance.asset,
						amount,
						fee: '0',
						direction: '+',
						referenceId: reference || generateUUID(),
						createdAt: Date.now(),
					});

					return { accounts, balances, ledger, isLoading: false };
				});

				return { success: true };
			}

			set({ isLoading: false });
			return { success: false, error: 'Deposit failed' };
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Deposit failed';
			set({ error: errorMsg, isLoading: false });
			return { success: false, error: errorMsg };
		}
	},

	withdraw: async (accountId, amount) => {
		set({ isLoading: true, error: null });
		try {
			const response = await apiClient.post<BackendWithdrawResponse>(
				`/accounts/${accountId}/withdraw`,
				{ amount }
			);

			if (response.success) {
				// Update account and balance from response
				const updatedAccount = backendAccountToWallet(response.account);
				const updatedBalance: WalletBalance = {
					asset: response.account.currency,
					available: response.account.available,
					frozen: response.account.locked,
					total: response.account.balance,
				};

				set((state) => {
					const accounts = state.accounts.map((a) =>
						a.id === accountId ? updatedAccount : a
					);

					const balances = state.balances.map((b) =>
						b.asset === updatedBalance.asset ? updatedBalance : b
					);

					const ledger = [...state.ledger];
					addLedger(ledger, {
						type: 'WITHDRAW_COMPLETE',
						asset: updatedBalance.asset,
						amount,
						fee: '0',
						direction: '-',
						referenceId: generateUUID(),
						createdAt: Date.now(),
					});

					return { accounts, balances, ledger, isLoading: false };
				});

				return { success: true };
			}

			set({ isLoading: false });
			return { success: false, error: 'Withdrawal failed' };
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Withdrawal failed';
			set({ error: errorMsg, isLoading: false });
			return { success: false, error: errorMsg };
		}
	},

	// ---------------------------------------------------------------------------
	// LEGACY SYNC METHODS (for offline/demo mode)
	// ---------------------------------------------------------------------------

	createAccountSync: () => {
		set((state) => {
			if (state.accounts.length > 0) return state;
			const createdAt = Date.now();
			const account: WalletAccount = {
				id: `acct_${createdAt}`,
				currency: 'USD',
				balance: '0',
				locked: '0',
				status: 'active',
				createdAt,
			};
			const ledger = [...state.ledger];
			addLedger(ledger, {
				type: 'DEPOSIT',
				asset: 'USD',
				amount: '0',
				fee: '0',
				direction: '+',
				referenceId: account.id,
				createdAt,
			});
			return { accounts: [account], primaryAccountId: account.id, ledger };
		});
	},

	createDepositSync: (asset, amount, sourceType, sourceId) => {
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

	confirmDepositSync: (depositId) => {
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

			const deposits: DepositRecord[] = state.deposits.map((d) =>
				d.depositId === depositId ? { ...d, status: 'confirmed' as const } : d
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

			return { balances, deposits, ledger };
		});
	},

	createWithdrawSync: (asset, amount, destinationType, destinationId) => {
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
			return { balances, withdraws, ledger };
		});

		// Complete after a short simulated delay
		if (result) {
			const withdrawId = (result as WithdrawRecord).withdrawId;
			setTimeout(() => {
				set((state) => {
					const w = state.withdraws.find((x) => x.withdrawId === withdrawId);
					if (!w || w.status !== 'processing') return state;

					const balances = [...state.balances.map((b) => ({ ...b }))];
					const bal = ensureBalance(balances, asset);
					const totalFrozen = new Decimal(w.amount).plus(w.fee);
					bal.frozen = new Decimal(bal.frozen).minus(totalFrozen).toString();

					const withdraws: WithdrawRecord[] = state.withdraws.map((x) =>
						x.withdrawId === w.withdrawId ? { ...x, status: 'completed' as const } : x
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

					return { balances, withdraws, ledger };
				});
			}, 1200);
		}

		return result;
	},

	// ---------------------------------------------------------------------------
	// UTILITY METHODS
	// ---------------------------------------------------------------------------

	getOnboardingStage: () => {
		const { accounts, paymentMethods, cryptoAddresses, balances } = get();
		if (accounts.length === 0) return 'not_created';
		if (paymentMethods.length === 0 && cryptoAddresses.length === 0) return 'no_payment_method';
		const USD = balances.find((b) => b.asset === 'USD');
		const hasFunds = USD ? new Decimal(USD.total).gt(0) : false;
		if (!hasFunds) return 'no_funds';
		return 'funded';
	},

	getTotalEquity: (prices) => {
		const { balances } = get();
		const total = balances.reduce((acc, b) => {
			const qty = new Decimal(b.total || '0');
			if (qty.lte(0)) return acc;
			const px = prices[b.asset];
			const price = new Decimal(px === undefined ? (b.asset === 'USD' ? 1 : 0) : px);
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

	updatePerformanceMetrics: (_prices) => {
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

	clearError: () => set({ error: null }),
}));

// =============================================================================
// SELECTORS
// =============================================================================

export const selectBalances = (state: WalletState) => state.balances;
export const selectAccounts = (state: WalletState) => state.accounts;
export const selectPrimaryAccountId = (state: WalletState) => state.primaryAccountId;
export const selectPaymentMethods = (state: WalletState) => state.paymentMethods;
export const selectCryptoAddresses = (state: WalletState) => state.cryptoAddresses;
export const selectDeposits = (state: WalletState) => state.deposits;
export const selectWithdraws = (state: WalletState) => state.withdraws;
export const selectIsLoading = (state: WalletState) => state.isLoading;
export const selectError = (state: WalletState) => state.error;
export const selectIsConnectedToBackend = (state: WalletState) => state.isConnectedToBackend;

// Legacy selector for backward compatibility
export const selectAccount = (state: WalletState) =>
	state.accounts.length > 0 ? { id: state.accounts[0]!.id, createdAt: state.accounts[0]!.createdAt } : null;

export const selectTotalBalance = (state: WalletState) => {
	const USD = state.balances.find((b) => b.asset === 'USD');
	const total = USD ? parseFloat(USD.total) : 0;
	const available = USD ? parseFloat(USD.available) : 0;
	return { total, available };
};
