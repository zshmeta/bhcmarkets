/**
 * Email Service Types
 *
 * Type definitions for email client integration with the email worker.
 */

// =============================================================================
// EMAIL TYPES
// =============================================================================

export const EMAIL_TYPES = [
  'welcome',
  '2fa',
  'registration_confirmation',
  'reset_password',
  'email_change',
  'withdrawal_processed',
  'deposit_confirmation',
  'trade_opened',
  'trade_closed',
  'notification',
] as const;

export type EmailType = (typeof EMAIL_TYPES)[number];

// =============================================================================
// PAYLOAD TYPES
// =============================================================================

export interface BasePayload {
  firstName?: string;
  lastName?: string;
}

export interface WelcomePayload extends BasePayload {
  platformName?: string;
  loginUrl?: string;
}

export interface TwoFactorPayload extends BasePayload {
  code: string;
  expiresInMinutes?: number;
}

export interface RegistrationConfirmationPayload extends BasePayload {
  confirmationLink: string;
  expiresInHours?: number;
}

export interface ResetPasswordPayload extends BasePayload {
  resetLink: string;
  expiresInMinutes?: number;
}

export interface EmailChangePayload extends BasePayload {
  newEmail: string;
  confirmationLink: string;
  expiresInHours?: number;
}

export interface WithdrawalProcessedPayload extends BasePayload {
  amount: string;
  currency: string;
  withdrawalMethod: string;
  transactionId: string;
  processedAt: string;
  destination?: string;
}

export interface DepositConfirmationPayload extends BasePayload {
  amount: string;
  currency: string;
  depositMethod: string;
  transactionId: string;
  confirmedAt: string;
}

export interface TradeOpenedPayload extends BasePayload {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: string;
  price: string;
  orderId: string;
  openedAt: string;
  leverage?: string;
  stopLoss?: string;
  takeProfit?: string;
}

export interface TradeClosedPayload extends BasePayload {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: string;
  openPrice: string;
  closePrice: string;
  orderId: string;
  closedAt: string;
  pnl: string;
  pnlPercentage: string;
}

export interface NotificationPayload extends BasePayload {
  subject: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

// Union type
export type EmailPayload =
  | WelcomePayload
  | TwoFactorPayload
  | RegistrationConfirmationPayload
  | ResetPasswordPayload
  | EmailChangePayload
  | WithdrawalProcessedPayload
  | DepositConfirmationPayload
  | TradeOpenedPayload
  | TradeClosedPayload
  | NotificationPayload;

// =============================================================================
// REQUEST / RESPONSE
// =============================================================================

export interface SendEmailRequest {
  type: EmailType;
  to: string;
  userId: string;
  emailRef: string;
  payload: EmailPayload;
}

export interface SendEmailResponse {
  success: boolean;
  emailRef: string;
  providerId?: string;
  message?: string;
}

export interface EmailError {
  success: false;
  error: string;
  emailRef?: string;
  code?: string;
}

// =============================================================================
// EMAIL CLIENT INTERFACE
// =============================================================================

export interface IEmailClient {
  send(request: SendEmailRequest): Promise<SendEmailResponse>;

  // Convenience methods
  sendWelcome(to: string, userId: string, payload: WelcomePayload): Promise<SendEmailResponse>;
  send2FA(to: string, userId: string, payload: TwoFactorPayload): Promise<SendEmailResponse>;
  sendRegistrationConfirmation(to: string, userId: string, payload: RegistrationConfirmationPayload): Promise<SendEmailResponse>;
  sendPasswordReset(to: string, userId: string, payload: ResetPasswordPayload): Promise<SendEmailResponse>;
  sendEmailChange(to: string, userId: string, payload: EmailChangePayload): Promise<SendEmailResponse>;
  sendWithdrawalProcessed(to: string, userId: string, payload: WithdrawalProcessedPayload): Promise<SendEmailResponse>;
  sendDepositConfirmation(to: string, userId: string, payload: DepositConfirmationPayload): Promise<SendEmailResponse>;
  sendTradeOpened(to: string, userId: string, payload: TradeOpenedPayload): Promise<SendEmailResponse>;
  sendTradeClosed(to: string, userId: string, payload: TradeClosedPayload): Promise<SendEmailResponse>;
  sendNotification(to: string, userId: string, payload: NotificationPayload): Promise<SendEmailResponse>;
}

// =============================================================================
// EMAIL CLIENT CONFIG
// =============================================================================

export interface EmailClientConfig {
  /** Email worker base URL */
  workerUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Enable/disable emails (for testing) */
  enabled?: boolean;
}
/**
 * Email Worker Types
 * Core type definitions for the email service
 */


// ============================================================================
// Email Request Payloads (Type-specific template parameters)
// ============================================================================

export interface BasePayload {
  firstName?: string;
  lastName?: string;
}

export interface WelcomePayload extends BasePayload {
  platformName?: string;
  loginUrl?: string;
}

export interface TwoFactorPayload extends BasePayload {
  code: string;
  expiresInMinutes?: number;
}

export interface RegistrationConfirmationPayload extends BasePayload {
  confirmationLink: string;
  expiresInHours?: number;
}

export interface ResetPasswordPayload extends BasePayload {
  resetLink: string;
  expiresInMinutes?: number;
}

export interface EmailChangePayload extends BasePayload {
  newEmail: string;
  confirmationLink: string;
  expiresInHours?: number;
}

export interface WithdrawalProcessedPayload extends BasePayload {
  amount: string;
  currency: string;
  withdrawalMethod: string;
  transactionId: string;
  processedAt: string;
  destination?: string;
}

export interface DepositConfirmationPayload extends BasePayload {
  amount: string;
  currency: string;
  depositMethod: string;
  transactionId: string;
  confirmedAt: string;
}

export interface TradeOpenedPayload extends BasePayload {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: string;
  price: string;
  orderId: string;
  openedAt: string;
  leverage?: string;
  stopLoss?: string;
  takeProfit?: string;
}

export interface TradeClosedPayload extends BasePayload {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: string;
  openPrice: string;
  closePrice: string;
  orderId: string;
  closedAt: string;
  pnl: string;
  pnlPercentage: string;
}

export interface NotificationPayload extends BasePayload {
  subject: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}


// ============================================================================
// Email Request/Response
// ============================================================================

export interface SendEmailRequest {
  /** Email type identifier */
  type: EmailType;
  /** Recipient email address */
  to: string;
  /** Internal user ID for audit */
  userId: string;
  /** Client-supplied unique reference key for traceability */
  emailRef: string;
  /** Type-specific template parameters */
  payload: EmailPayload;
}

export interface SendEmailResponse {
  success: boolean;
  emailRef: string;
  providerId?: string;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  emailRef?: string;
  code?: string;
}

// ============================================================================
// Provider Types
// ============================================================================

export type EmailProvider = 'resend' | 'sendgrid' | 'mailgun' | 'postmark';

export interface ProviderSendResult {
  success: boolean;
  providerId?: string;
  error?: string;
}

export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: string[];
  metadata?: Record<string, string>;
}

export interface IEmailProvider {
  name: EmailProvider;
  send(message: EmailMessage): Promise<ProviderSendResult>;
}

// ============================================================================
// Template Types
// ============================================================================

export interface TemplateContext {
  to: string;
  userId: string;
  emailRef: string;
  payload: EmailPayload;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface ITemplateRenderer {
  render(type: EmailType, context: TemplateContext): RenderedEmail;
}

// ============================================================================
// Environment / Config Types
// ============================================================================

export interface EmailWorkerEnv {
  // API authentication
  API_KEY: string;

  // Email provider configuration
  EMAIL_PROVIDER: EmailProvider;

  // Provider API keys (secrets)
  RESEND_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  POSTMARK_API_KEY?: string;

  // Sender configuration
  SENDER_EMAIL: string;
  SENDER_NAME: string;
  REPLY_TO_EMAIL?: string;

  // Platform branding
  PLATFORM_NAME: string;
  PLATFORM_URL: string;
  SUPPORT_EMAIL: string;

  // KV Namespaces
  RATE_LIMIT_KV?: {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: any): Promise<void>;
  };
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}
