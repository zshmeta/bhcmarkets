/**
 * Account Service - Business Logic Implementation
 *
 * This is the heart of the account domain. It contains all business rules
 * and orchestrates operations between the repository and validators.
 *
 * Architecture:
 * - Depends on interfaces (AccountRepository), not implementations
 * - All public methods validate inputs before processing
 * - Methods that modify state are atomic where possible
 *
 * Usage:
 * ```ts
 * const accountService = createAccountService({ repository });
 *
 * // Deposit funds
 * await accountService.deposit({ accountId: "...", amount: "100.00" });
 *
 * // Lock funds for an order
 * await accountService.lockFunds({ accountId: "...", amount: "50.00" });
 * ```
 */

import type {
  AccountEntity,
  AccountRepository,
  AccountServiceInterface,
  AccountView,
  CreateAccountInput,
  CurrencyCode,
  DecimalString,
  DepositInput,
  LockFundsInput,
  SettleTradeInput,
  UnlockFundsInput,
  UUID,
  WithdrawInput,
} from "./account.types.js";
import { AccountError } from "./account.errors.js";
import {
  validateAmount,
  validateCurrency,
  validateAccountActive,
  validateDeposit,
  validateWithdrawal,
  validateLockFunds,
  validateUnlockFunds,
  validateCanClose,
} from "../validators/account.validators.js";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Converts an AccountEntity to an AccountView (API-friendly format).
 * Computes the available balance and formats dates as ISO strings.
 */
function toView(entity: AccountEntity): AccountView {
  const balance = parseFloat(entity.balance);
  const locked = parseFloat(entity.locked);
  const available = (balance - locked).toFixed(10); // Keep precision

  return {
    id: entity.id,
    userId: entity.userId,
    currency: entity.currency,
    balance: entity.balance,
    locked: entity.locked,
    available,
    accountType: entity.accountType,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

/**
 * Safely adds two decimal strings.
 * Uses parseFloat but maintains string output for DB storage.
 */
function addDecimals(a: DecimalString, b: DecimalString): DecimalString {
  const result = parseFloat(a) + parseFloat(b);
  return result.toFixed(10);
}

/**
 * Safely subtracts two decimal strings.
 */
function subtractDecimals(a: DecimalString, b: DecimalString): DecimalString {
  const result = parseFloat(a) - parseFloat(b);
  return result.toFixed(10);
}

// =============================================================================
// SERVICE FACTORY
// =============================================================================

/**
 * Dependencies required to create an AccountService.
 */
export interface AccountServiceDependencies {
  repository: AccountRepository;
  // Future: Add ledgerService for audit trail
  // Future: Add eventEmitter for real-time updates
}

/**
 * Creates an AccountService instance with the provided dependencies.
 *
 * @param deps - The service dependencies (repository, etc.)
 * @returns An object implementing the AccountServiceInterface
 *
 * @example
 * ```ts
 * const repository = createAccountRepository(pool);
 * const accountService = createAccountService({ repository });
 * ```
 */
export function createAccountService(
  deps: AccountServiceDependencies
): AccountServiceInterface {
  const { repository } = deps;

  const service: AccountServiceInterface = {
    // =========================================================================
    // QUERY OPERATIONS
    // =========================================================================

    /**
     * Gets an account by its ID.
     * Throws ACCOUNT_NOT_FOUND if it doesn't exist.
     */
    async getAccountById(id: UUID): Promise<AccountEntity> {
      const account = await repository.getById(id);

      if (!account) {
        throw new AccountError("ACCOUNT_NOT_FOUND", { accountId: id });
      }

      return account;
    },

    /**
     * Gets a user's account for a specific currency.
     * Throws ACCOUNT_NOT_FOUND if the user doesn't have that account.
     */
    async getAccount(userId: UUID, currency: CurrencyCode): Promise<AccountEntity> {
      const validCurrency = validateCurrency(currency);
      const account = await repository.getByUserAndCurrency(userId, validCurrency);

      if (!account) {
        throw new AccountError("ACCOUNT_NOT_FOUND", { userId, currency });
      }

      return account;
    },

    /**
     * Finds a user's account for a currency, returns null if not found.
     * Use this when you want to check existence without throwing.
     */
    async findAccount(
      userId: UUID,
      currency: CurrencyCode
    ): Promise<AccountEntity | null> {
      const validCurrency = validateCurrency(currency);
      return repository.getByUserAndCurrency(userId, validCurrency);
    },

    /**
     * Lists all accounts for a user as AccountViews.
     * Returns an empty array if the user has no accounts.
     */
    async listUserAccounts(userId: UUID): Promise<AccountView[]> {
      const accounts = await repository.listByUser(userId);
      return accounts.map(toView);
    },

    /**
     * Gets the available balance for an account.
     * Available = balance - locked (what the user can actually spend).
     */
    async getAvailableBalance(accountId: UUID): Promise<DecimalString> {
      const account = await service.getAccountById(accountId);
      return subtractDecimals(account.balance, account.locked);
    },

    // =========================================================================
    // ACCOUNT LIFECYCLE
    // =========================================================================

    /**
     * Creates a new account for a user.
     *
     * @param input - Account creation parameters
     * @throws ACCOUNT_ALREADY_EXISTS if user already has this currency
     * @throws INVALID_CURRENCY if currency is not supported
     */
    async createAccount(input: CreateAccountInput): Promise<AccountEntity> {
      const validCurrency = validateCurrency(input.currency);

      // Check if account already exists
      const exists = await repository.exists(input.userId, validCurrency);
      if (exists) {
        throw new AccountError("ACCOUNT_ALREADY_EXISTS", {
          userId: input.userId,
          currency: validCurrency,
        });
      }

      // Create the account
      return repository.create({
        ...input,
        currency: validCurrency,
      });
    },

    /**
     * Closes an account permanently.
     * Account must have zero balance and zero locked funds.
     */
    async closeAccount(accountId: UUID): Promise<void> {
      const account = await service.getAccountById(accountId);

      // Validate the account can be closed
      validateCanClose(account);

      // Set status to closed
      await repository.setStatus(accountId, "closed");
    },

    // =========================================================================
    // WALLET OPERATIONS
    // =========================================================================

    /**
     * Deposits funds into an account (increases balance).
     *
     * This is typically called when:
     * - User deposits from external source (bank, crypto)
     * - Admin credits funds manually
     * - Internal transfers from other accounts
     *
     * @param input - Deposit parameters
     * @returns The updated account
     */
    async deposit(input: DepositInput): Promise<AccountEntity> {
      const account = await service.getAccountById(input.accountId);

      // Validate the deposit
      const validAmount = validateDeposit(account, input.amount);

      // Calculate new balance
      const newBalance = addDecimals(account.balance, validAmount);

      // Update and return
      return repository.updateBalance(account.id, newBalance);

      // Future: Create ledger entry for audit trail
      // Future: Emit event for real-time updates
    },

    /**
     * Withdraws funds from an account (decreases balance).
     *
     * This is typically called when:
     * - User withdraws to external destination
     * - Admin debits funds manually
     *
     * @param input - Withdrawal parameters
     * @throws INSUFFICIENT_BALANCE if not enough available funds
     * @returns The updated account
     */
    async withdraw(input: WithdrawInput): Promise<AccountEntity> {
      const account = await service.getAccountById(input.accountId);

      // Validate the withdrawal (checks available balance)
      const validAmount = validateWithdrawal(account, input.amount);

      // Calculate new balance
      const newBalance = subtractDecimals(account.balance, validAmount);

      // Update and return
      return repository.updateBalance(account.id, newBalance);

      // Future: Create ledger entry for audit trail
      // Future: Emit event for real-time updates
    },

    // =========================================================================
    // ORDER OPERATIONS (Used by OrderService)
    // =========================================================================

    /**
     * Locks funds for a pending order.
     *
     * When a user places an order, we lock the required funds so they can't
     * be spent elsewhere while the order is pending. The funds are still in
     * their balance, but marked as unavailable.
     *
     * Example:
     * - User has $1000 balance, $0 locked
     * - User places order requiring $200
     * - After lock: $1000 balance, $200 locked, $800 available
     *
     * @param input - Lock parameters (amount and optional order reference)
     * @throws INSUFFICIENT_BALANCE if not enough available funds
     * @returns The updated account
     */
    async lockFunds(input: LockFundsInput): Promise<AccountEntity> {
      const account = await service.getAccountById(input.accountId);

      // Validate we can lock this amount
      const validAmount = validateLockFunds(account, input.amount);

      // Increase locked amount (balance stays the same)
      const newLocked = addDecimals(account.locked, validAmount);

      return repository.updateLocked(account.id, newLocked);
    },

    /**
     * Unlocks funds when an order is cancelled.
     *
     * When an order is cancelled before filling, we release the locked funds
     * back to the user's available balance.
     *
     * Example:
     * - User has $1000 balance, $200 locked, $800 available
     * - Order for $200 is cancelled
     * - After unlock: $1000 balance, $0 locked, $1000 available
     *
     * @param input - Unlock parameters
     * @throws INSUFFICIENT_LOCKED if trying to unlock more than is locked
     * @returns The updated account
     */
    async unlockFunds(input: UnlockFundsInput): Promise<AccountEntity> {
      const account = await service.getAccountById(input.accountId);

      // Validate we can unlock this amount
      const validAmount = validateUnlockFunds(account, input.amount);

      // Decrease locked amount
      const newLocked = subtractDecimals(account.locked, validAmount);

      return repository.updateLocked(account.id, newLocked);
    },

    /**
     * Settles a trade by transferring funds between accounts.
     *
     * This is the critical operation that happens when an order fills:
     * 1. Debit account: Reduce locked -> Reduce balance
     * 2. Credit account: Increase balance
     *
     * Example (User buys 1 BTC for $50,000):
     * - Debit: User's USD account - $50,000 (was locked for order)
     * - Credit: User's BTC account + 1 BTC
     *
     * @param input - Trade settlement parameters
     */
    async settleTrade(input: SettleTradeInput): Promise<void> {
      const validAmount = validateAmount(input.amount);

      // Get both accounts
      const debitAccount = await service.getAccountById(input.debitAccountId);
      const creditAccount = await service.getAccountById(input.creditAccountId);

      // Validate debit account has this amount locked
      const debitLocked = parseFloat(debitAccount.locked);
      const tradeAmount = parseFloat(validAmount);

      if (tradeAmount > debitLocked) {
        throw new AccountError("INSUFFICIENT_LOCKED", {
          required: validAmount,
          locked: debitAccount.locked,
          operation: "trade_settlement",
        });
      }

      // Calculate new values
      const newDebitBalance = subtractDecimals(debitAccount.balance, validAmount);
      const newDebitLocked = subtractDecimals(debitAccount.locked, validAmount);
      const newCreditBalance = addDecimals(creditAccount.balance, validAmount);

      // Update both accounts
      // Note: In a production system, this should be a database transaction
      await repository.updateBalanceAndLocked(
        debitAccount.id,
        newDebitBalance,
        newDebitLocked
      );
      await repository.updateBalance(creditAccount.id, newCreditBalance);

      // Future: Create ledger entries for both sides
      // Future: Emit trade settlement events
    },

    // =========================================================================
    // ADMIN OPERATIONS
    // =========================================================================

    /**
     * Freezes an account (sets status to "locked").
     *
     * A frozen account cannot:
     * - Make withdrawals
     * - Place new orders
     * - Have funds locked
     *
     * A frozen account CAN:
     * - Receive deposits
     * - Have pending orders cancelled (unlocking funds)
     */
    async freezeAccount(accountId: UUID): Promise<AccountEntity> {
      const account = await service.getAccountById(accountId);

      if (account.status === "closed") {
        throw new AccountError("ACCOUNT_CLOSED", { accountId });
      }

      return repository.setStatus(accountId, "locked");
    },

    /**
     * Unfreezes an account (sets status back to "active").
     */
    async unfreezeAccount(accountId: UUID): Promise<AccountEntity> {
      const account = await service.getAccountById(accountId);

      if (account.status === "closed") {
        throw new AccountError("ACCOUNT_CLOSED", { accountId });
      }

      return repository.setStatus(accountId, "active");
    },
  };

  return service;
}
