/**
 * Account Domain - Barrel Export
 *
 * This file provides a clean public API for the account domain.
 * All external imports should go through this file.
 *
 * Usage:
 * ```ts
 * import {
 *   createAccountService,
 *   createAccountRepository,
 *   AccountError,
 *   type AccountService,
 *   type AccountEntity,
 * } from "../domains/account";
 * ```
 */

// =============================================================================
// CORE - Types and Interfaces
// =============================================================================

export type {
  // Basic types
  UUID,
  DecimalString,
  CurrencyCode,
  AccountType,
  AccountStatus,
  BalanceOperationType,

  // Entity types
  AccountEntity,
  AccountView,

  // Input types
  CreateAccountInput,
  DepositInput,
  WithdrawInput,
  LockFundsInput,
  UnlockFundsInput,
  SettleTradeInput,

  // Interface types
  AccountRepository,
  AccountServiceInterface,
} from "./core/account.types.js";

export { SUPPORTED_CURRENCIES } from "./core/account.types.js";

// =============================================================================
// CORE - Service
// =============================================================================

export {
  createAccountService,
  type AccountServiceDependencies,
} from "./core/account.service.js";

// =============================================================================
// ERRORS
// =============================================================================

export { AccountError } from "./core/account.errors.js";
export type { AccountErrorCode } from "./core/account.errors.js";
export {
  ACCOUNT_ERROR_DESCRIPTIONS,
  ACCOUNT_ERROR_HTTP_STATUS,
} from "./core/account.errors.js";

// =============================================================================
// REPOSITORY
// =============================================================================

export { createAccountRepository } from "./repositories/account.repository.pg.js";

// =============================================================================
// VALIDATORS
// =============================================================================

export {
  validateAmount,
  validateCurrency,
  validateAccountActive,
  validateDeposit,
  validateWithdrawal,
  validateLockFunds,
  validateUnlockFunds,
  validateCanClose,
  // Zod schemas for HTTP validation
  createAccountSchema,
  balanceOperationSchema,
  uuidParamSchema,
  type CreateAccountRequest,
  type BalanceOperationRequest,
} from "./validators/account.validators.js";

// =============================================================================
// ROUTES
// =============================================================================

export {
  registerAccountRoutes,
  type AccountRouteDependencies,
} from "./routes/account.routes.js";
