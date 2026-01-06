/**
 * Account Domain - Validators
 *
 * This file contains validation functions for account operations.
 * Validators check that input data is correct before processing.
 *
 * Design Philosophy:
 * - Validators are pure functions (no side effects)
 * - They throw AccountError on invalid input
 * - They return the validated/normalized data on success
 *
 * Usage:
 * ```ts
 * const amount = validateAmount("100.50");  // Returns "100.50"
 * const amount = validateAmount("-50");     // Throws INVALID_AMOUNT
 * ```
 */

import { z } from "zod";
import { AccountError } from "../core/account.errors.js";
import {
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
  type DecimalString,
  type AccountEntity,
} from "../core/account.types.js";

// =============================================================================
// BASIC VALIDATORS
// =============================================================================

/**
 * Validates that a string represents a valid positive decimal amount.
 *
 * Rules:
 * - Must be a valid number string
 * - Must be greater than zero
 * - Must not be NaN or Infinity
 *
 * @param amount - The amount string to validate
 * @returns The validated amount string
 * @throws AccountError with code INVALID_AMOUNT if validation fails
 */
export function validateAmount(amount: string): DecimalString {
  const parsed = parseFloat(amount);

  if (isNaN(parsed) || !isFinite(parsed)) {
    throw new AccountError("INVALID_AMOUNT", { provided: amount });
  }

  if (parsed <= 0) {
    throw new AccountError("INVALID_AMOUNT", {
      provided: amount,
      reason: "Amount must be greater than zero",
    });
  }

  return amount;
}

/**
 * Validates that a currency code is supported by the platform.
 *
 * @param currency - The currency code to validate
 * @returns The validated currency code
 * @throws AccountError with code INVALID_CURRENCY if not supported
 */
export function validateCurrency(currency: string): CurrencyCode {
  const upper = currency.toUpperCase();

  if (!SUPPORTED_CURRENCIES.includes(upper as CurrencyCode)) {
    throw new AccountError("INVALID_CURRENCY", {
      provided: currency,
      supported: SUPPORTED_CURRENCIES,
    });
  }

  return upper as CurrencyCode;
}

/**
 * Validates that an account is in a usable state.
 *
 * @param account - The account entity to check
 * @throws AccountError if account is frozen or closed
 */
export function validateAccountActive(account: AccountEntity): void {
  if (account.status === "locked") {
    throw new AccountError("ACCOUNT_FROZEN", { accountId: account.id });
  }

  if (account.status === "closed") {
    throw new AccountError("ACCOUNT_CLOSED", { accountId: account.id });
  }
}

// =============================================================================
// OPERATION VALIDATORS
// =============================================================================

/**
 * Validates a deposit operation.
 *
 * Rules:
 * - Amount must be positive
 * - Account must be active
 *
 * @param account - The target account
 * @param amount - The amount to deposit
 * @returns The validated amount
 */
export function validateDeposit(
  account: AccountEntity,
  amount: string
): DecimalString {
  validateAccountActive(account);
  return validateAmount(amount);
}

/**
 * Validates a withdrawal operation.
 *
 * Rules:
 * - Amount must be positive
 * - Account must be active
 * - Available balance (balance - locked) must be >= amount
 *
 * @param account - The source account
 * @param amount - The amount to withdraw
 * @returns The validated amount
 */
export function validateWithdrawal(
  account: AccountEntity,
  amount: string
): DecimalString {
  validateAccountActive(account);
  const validatedAmount = validateAmount(amount);

  const available = parseFloat(account.balance) - parseFloat(account.locked);
  const requested = parseFloat(validatedAmount);

  if (requested > available) {
    throw new AccountError("INSUFFICIENT_BALANCE", {
      requested: validatedAmount,
      available: available.toString(),
      currency: account.currency,
    });
  }

  return validatedAmount;
}

/**
 * Validates a lock funds operation (for placing orders).
 *
 * Rules:
 * - Amount must be positive
 * - Account must be active
 * - Available balance must be >= amount to lock
 *
 * @param account - The account to lock funds in
 * @param amount - The amount to lock
 * @returns The validated amount
 */
export function validateLockFunds(
  account: AccountEntity,
  amount: string
): DecimalString {
  validateAccountActive(account);
  const validatedAmount = validateAmount(amount);

  const available = parseFloat(account.balance) - parseFloat(account.locked);
  const requested = parseFloat(validatedAmount);

  if (requested > available) {
    throw new AccountError("INSUFFICIENT_BALANCE", {
      requested: validatedAmount,
      available: available.toString(),
      operation: "lock",
      currency: account.currency,
    });
  }

  return validatedAmount;
}

/**
 * Validates an unlock funds operation (for cancelling orders).
 *
 * Rules:
 * - Amount must be positive
 * - Locked balance must be >= amount to unlock
 *
 * Note: We allow unlocking even on frozen accounts (admin may cancel orders)
 *
 * @param account - The account to unlock funds in
 * @param amount - The amount to unlock
 * @returns The validated amount
 */
export function validateUnlockFunds(
  account: AccountEntity,
  amount: string
): DecimalString {
  const validatedAmount = validateAmount(amount);

  const locked = parseFloat(account.locked);
  const requested = parseFloat(validatedAmount);

  if (requested > locked) {
    throw new AccountError("INSUFFICIENT_LOCKED", {
      requested: validatedAmount,
      locked: account.locked,
      currency: account.currency,
    });
  }

  return validatedAmount;
}

/**
 * Validates that an account can be closed.
 *
 * Rules:
 * - Balance must be zero
 * - Locked must be zero
 *
 * @param account - The account to close
 */
export function validateCanClose(account: AccountEntity): void {
  const balance = parseFloat(account.balance);
  const locked = parseFloat(account.locked);

  if (balance > 0 || locked > 0) {
    throw new AccountError("CANNOT_CLOSE_WITH_BALANCE", {
      balance: account.balance,
      locked: account.locked,
      currency: account.currency,
    });
  }
}

// =============================================================================
// ZOD SCHEMAS (for HTTP request validation)
// =============================================================================

/**
 * Schema for creating a new account via API.
 */
export const createAccountSchema = z.object({
  currency: z.string().min(2).max(10),
  accountType: z.enum(["spot", "margin", "futures", "demo"]).optional(),
});

/**
 * Schema for deposit/withdraw operations via API.
 */
export const balanceOperationSchema = z.object({
  amount: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && isFinite(num) && num > 0;
    },
    { message: "Amount must be a positive number" }
  ),
  reference: z.string().max(255).optional(),
  note: z.string().max(500).optional(),
});

/**
 * Schema for UUID path parameters.
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateAccountRequest = z.infer<typeof createAccountSchema>;
export type BalanceOperationRequest = z.infer<typeof balanceOperationSchema>;
