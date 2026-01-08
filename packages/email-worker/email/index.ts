/**
 * Email Service
 *
 * High-level email service that wraps the email client
 * and provides business-logic aware email sending.
 */

export { EmailClient, EmailSendError, createNoOpEmailClient } from './email.client.js';
export type {
  IEmailClient,
  EmailClientConfig,
  SendEmailRequest,
  SendEmailResponse,
  EmailType,
  EmailPayload,
  WelcomePayload,
  TwoFactorPayload,
  RegistrationConfirmationPayload,
  ResetPasswordPayload,
  EmailChangePayload,
  WithdrawalProcessedPayload,
  DepositConfirmationPayload,
  TradeOpenedPayload,
  TradeClosedPayload,
  NotificationPayload,
} from './email.types.js';
