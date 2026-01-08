/**
 * Ledger Email Notifications
 *
 * Email notification handler for ledger events.
 * Listens to deposit/withdrawal events and sends confirmation emails.
 */

import type { LedgerEvent } from './ledger.types.js';

/**
 * Email client interface (matches backend email client).
 */
export interface IEmailClient {
  sendDepositConfirmation(
    to: string,
    userId: string,
    payload: {
      firstName?: string;
      amount: string;
      currency: string;
      depositMethod: string;
      transactionId: string;
      confirmedAt: string;
    }
  ): Promise<{ success: boolean; emailRef: string }>;

  sendWithdrawalProcessed(
    to: string,
    userId: string,
    payload: {
      firstName?: string;
      amount: string;
      currency: string;
      withdrawalMethod: string;
      transactionId: string;
      processedAt: string;
      destination?: string;
    }
  ): Promise<{ success: boolean; emailRef: string }>;
}

/**
 * User resolver interface to get user email from account ID.
 */
export interface UserResolver {
  getUserEmailByAccountId(accountId: string): Promise<{ email: string; userId: string; firstName?: string } | null>;
}

/**
 * Ledger email handler configuration.
 */
export interface LedgerEmailHandlerConfig {
  emailClient: IEmailClient;
  userResolver: UserResolver;
  logger?: {
    info: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
}

/**
 * Create a ledger event handler that sends emails.
 */
export function createLedgerEmailHandler(config: LedgerEmailHandlerConfig) {
  const { emailClient, userResolver, logger } = config;

  return async (event: LedgerEvent): Promise<void> => {
    try {
      switch (event.type) {
        case 'deposit_completed':
          await handleDepositCompleted(event, emailClient, userResolver, logger);
          break;

        case 'withdrawal_completed':
          await handleWithdrawalCompleted(event, emailClient, userResolver, logger);
          break;

        // Other events don't trigger emails
        default:
          break;
      }
    } catch (error) {
      logger?.error({ error, event }, 'Failed to handle ledger email event');
    }
  };
}

/**
 * Handle deposit completed event.
 */
async function handleDepositCompleted(
  event: LedgerEvent & { type: 'deposit_completed' },
  emailClient: IEmailClient,
  userResolver: UserResolver,
  logger?: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void }
): Promise<void> {
  const user = await userResolver.getUserEmailByAccountId(event.accountId);
  if (!user) {
    logger?.error({ accountId: event.accountId }, 'User not found for deposit email');
    return;
  }

  const transactionId = (event.metadata?.referenceId as string) ?? `DEP_${Date.now()}`;
  const confirmedAt = new Date(event.timestamp).toISOString();

  await emailClient.sendDepositConfirmation(user.email, user.userId, {
    firstName: user.firstName,
    amount: event.change,
    currency: event.asset,
    depositMethod: 'Bank Transfer', // TODO: Get from metadata when available
    transactionId,
    confirmedAt,
  });

  logger?.info({ userId: user.userId, asset: event.asset, amount: event.change }, 'Deposit confirmation email sent');
}

/**
 * Handle withdrawal completed event.
 */
async function handleWithdrawalCompleted(
  event: LedgerEvent & { type: 'withdrawal_completed' },
  emailClient: IEmailClient,
  userResolver: UserResolver,
  logger?: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void }
): Promise<void> {
  const user = await userResolver.getUserEmailByAccountId(event.accountId);
  if (!user) {
    logger?.error({ accountId: event.accountId }, 'User not found for withdrawal email');
    return;
  }

  const transactionId = (event.metadata?.referenceId as string) ?? `WTH_${Date.now()}`;
  const processedAt = new Date(event.timestamp).toISOString();

  // Remove negative sign from change amount
  const amount = event.change.replace(/^-/, '');

  await emailClient.sendWithdrawalProcessed(user.email, user.userId, {
    firstName: user.firstName,
    amount,
    currency: event.asset,
    withdrawalMethod: 'Bank Transfer', // TODO: Get from metadata when available
    transactionId,
    processedAt,
    destination: event.metadata?.destination as string | undefined,
  });

  logger?.info({ userId: user.userId, asset: event.asset, amount }, 'Withdrawal processed email sent');
}

/**
 * Register the email handler with a ledger service.
 *
 * @example
 * ```typescript
 * const emailHandler = createLedgerEmailHandler({
 *   emailClient,
 *   userResolver: {
 *     async getUserEmailByAccountId(accountId) {
 *       const account = await accountService.getAccountById(accountId);
 *       const user = await userService.getUserById(account.userId);
 *       return { email: user.email, userId: user.id, firstName: user.profile?.firstName };
 *     }
 *   }
 * });
 *
 * ledgerService.onEvent(emailHandler);
 * ```
 */
export { createLedgerEmailHandler as default };
