/**
 * Account Domain - Type Definitions
 *
 * This file contains all TypeScript types and interfaces for the account domain.
 * These types define the shape of data throughout the account system.
 *
 * Architecture Note:
 * - `Entity` types represent database records (what we store)
 * - `Input` types represent data coming from outside (API requests)
 * - `Repository` interfaces define database operations (ports)
 * - `Service` interfaces define business operations (what the domain can do)
 */

// =============================================================================
// BASIC TYPES
// =============================================================================

/** UUID string type for IDs. Will be replaced with @repo/types import later. */
export type UUID = string;

/**
 * Decimal string type for monetary values.
 * We use strings to avoid floating-point precision issues with money.
 * Example: "1234.56" not 1234.56
 */
export type DecimalString = string;

/**
 * Supported currencies in the platform.
 * Add new currencies here as they become supported.
 */
export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "BTC", "ETH", "USDT"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

// =============================================================================
// ACCOUNT ENTITY
// =============================================================================

/**
 * The type of trading account.
 * - spot: Regular cash account for spot trading
 * - margin: Leveraged trading account (future feature)
 * - futures: Derivatives trading account (future feature)
 * - demo: Paper trading account with fake money
 */
export type AccountType = "spot" | "margin" | "futures" | "demo";

/**
 * The current status of an account.
 * - active: Normal operating state
 * - locked: Temporarily frozen (by admin or security system)
 * - closed: Permanently closed, cannot be reopened
 */
export type AccountStatus = "active" | "locked" | "closed";

/**
 * Represents a user's account/wallet for a specific currency.
 *
 * A user can have multiple accounts (one per currency).
 * For example: USD account, BTC account, ETH account.
 *
 * Balance vs Locked:
 * - balance: Total funds in the account
 * - locked: Funds reserved for pending orders
 * - available = balance - locked (what user can actually use)
 */
export interface AccountEntity {
  id: UUID;
  userId: UUID;
  currency: CurrencyCode;

  /** Total balance (includes locked funds) */
  balance: DecimalString;

  /** Funds locked for pending orders */
  locked: DecimalString;

  accountType: AccountType;
  status: AccountStatus;

  /** Optional metadata (e.g., account nickname, notes) */
  metadata?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * A simplified view of an account for API responses.
 * Includes the computed "available" balance for convenience.
 */
export interface AccountView {
  id: UUID;
  userId: UUID;
  currency: CurrencyCode;
  balance: DecimalString;
  locked: DecimalString;
  available: DecimalString;  // Computed: balance - locked
  accountType: AccountType;
  status: AccountStatus;
  createdAt: string;  // ISO timestamp for JSON
  updatedAt: string;
}

// =============================================================================
// INPUT TYPES (for creating/updating)
// =============================================================================

/**
 * Data required to create a new account.
 */
export interface CreateAccountInput {
  userId: UUID;
  currency: CurrencyCode;
  accountType?: AccountType;  // Defaults to "spot"
  initialBalance?: DecimalString;  // Defaults to "0"
}

/**
 * Types of balance operations that can be performed.
 * Used for audit logging and ledger entries.
 */
export type BalanceOperationType =
  | "deposit"       // External funds coming in (bank, crypto transfer)
  | "withdraw"      // External funds going out
  | "lock"          // Reserving funds for a pending order
  | "unlock"        // Releasing reserved funds (order cancelled)
  | "trade_debit"   // Deducting funds after a trade executes
  | "trade_credit"  // Adding funds after a trade executes
  | "fee"           // Platform fees deducted
  | "adjustment";   // Manual admin adjustment

/**
 * Input for deposit operations.
 */
export interface DepositInput {
  accountId: UUID;
  amount: DecimalString;
  reference?: string;  // External reference (e.g., bank transaction ID)
  note?: string;
}

/**
 * Input for withdrawal operations.
 */
export interface WithdrawInput {
  accountId: UUID;
  amount: DecimalString;
  note?: string;
}

/**
 * Input for locking funds (when placing an order).
 */
export interface LockFundsInput {
  accountId: UUID;
  amount: DecimalString;
  orderId?: UUID;  // Reference to the order that caused the lock
}

/**
 * Input for unlocking funds (when cancelling an order).
 */
export interface UnlockFundsInput {
  accountId: UUID;
  amount: DecimalString;
  orderId?: UUID;
}

/**
 * Input for settling a trade (atomic transfer between accounts).
 */
export interface SettleTradeInput {
  debitAccountId: UUID;   // Account to take money from
  creditAccountId: UUID;  // Account to give money to
  amount: DecimalString;
  tradeId?: UUID;
}

// =============================================================================
// REPOSITORY INTERFACE (Database Operations)
// =============================================================================

/**
 * Repository interface for account database operations.
 *
 * This is a "port" in hexagonal architecture terms.
 * The actual implementation (PostgreSQL) lives in repositories/account.repository.pg.ts
 *
 * By depending on this interface (not the implementation), the service layer
 * can be tested with mock repositories and isn't coupled to PostgreSQL.
 */
export interface AccountRepository {
  // --- Read Operations ---

  /** Get a single account by its ID */
  getById(id: UUID): Promise<AccountEntity | null>;

  /** Get a user's account for a specific currency */
  getByUserAndCurrency(userId: UUID, currency: CurrencyCode): Promise<AccountEntity | null>;

  /** Get all accounts belonging to a user */
  listByUser(userId: UUID): Promise<AccountEntity[]>;

  /** Check if an account exists for this user/currency combination */
  exists(userId: UUID, currency: CurrencyCode): Promise<boolean>;

  // --- Write Operations ---

  /** Create a new account */
  create(input: CreateAccountInput): Promise<AccountEntity>;

  /**
   * Update the balance field directly.
   * ⚠️ Internal use only - prefer using service methods that handle validation.
   */
  updateBalance(id: UUID, newBalance: DecimalString): Promise<AccountEntity>;

  /**
   * Update the locked field directly.
   * ⚠️ Internal use only - prefer using service methods that handle validation.
   */
  updateLocked(id: UUID, newLocked: DecimalString): Promise<AccountEntity>;

  /**
   * Update both balance and locked atomically.
   * Used for trade settlements where we need to modify both fields.
   */
  updateBalanceAndLocked(
    id: UUID,
    newBalance: DecimalString,
    newLocked: DecimalString
  ): Promise<AccountEntity>;

  /** Change account status (active/locked/closed) */
  setStatus(id: UUID, status: AccountStatus): Promise<AccountEntity>;
}

// =============================================================================
// SERVICE INTERFACE (Business Operations)
// =============================================================================

/**
 * Service interface for account business operations.
 *
 * This defines what the account domain can do.
 * The implementation contains the business rules and validation.
 */
export interface AccountServiceInterface {
  // --- Query Operations ---

  /** Get an account by ID, throws if not found */
  getAccountById(id: UUID): Promise<AccountEntity>;

  /** Get a user's account for a currency, throws if not found */
  getAccount(userId: UUID, currency: CurrencyCode): Promise<AccountEntity>;

  /** Get a user's account, returns null if not found (no throw) */
  findAccount(userId: UUID, currency: CurrencyCode): Promise<AccountEntity | null>;

  /** List all accounts for a user */
  listUserAccounts(userId: UUID): Promise<AccountView[]>;

  /** Get available balance (balance - locked) */
  getAvailableBalance(accountId: UUID): Promise<DecimalString>;

  // --- Account Lifecycle ---

  /** Create a new account for a user */
  createAccount(input: CreateAccountInput): Promise<AccountEntity>;

  /** Close an account (must have zero balance) */
  closeAccount(accountId: UUID): Promise<void>;

  // --- Wallet Operations ---

  /** Add funds to an account (deposit) */
  deposit(input: DepositInput): Promise<AccountEntity>;

  /** Remove funds from an account (withdrawal) */
  withdraw(input: WithdrawInput): Promise<AccountEntity>;

  // --- Order Operations (used by OrderService) ---

  /** Lock funds for a pending order */
  lockFunds(input: LockFundsInput): Promise<AccountEntity>;

  /** Unlock funds when an order is cancelled */
  unlockFunds(input: UnlockFundsInput): Promise<AccountEntity>;

  /**
   * Settle a trade - atomically move funds from one account to another.
   * Handles the locked -> debit flow for the buyer.
   */
  settleTrade(input: SettleTradeInput): Promise<void>;

  // --- Admin Operations ---

  /** Freeze an account (set status to locked) */
  freezeAccount(accountId: UUID): Promise<AccountEntity>;

  /** Unfreeze an account (set status back to active) */
  unfreezeAccount(accountId: UUID): Promise<AccountEntity>;
}
