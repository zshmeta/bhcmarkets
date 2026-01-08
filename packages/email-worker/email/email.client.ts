/**
 * Email Client
 *
 * HTTP client for sending emails via the email worker.
 * Provides type-safe methods for all email types.
 */

import type {
  IEmailClient,
  EmailClientConfig,
  SendEmailRequest,
  SendEmailResponse,
  EmailError,
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
  EmailType,
  EmailPayload,
} from './email.types.js';

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Generate a unique email reference for traceability.
 */
function generateEmailRef(type: EmailType, userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}_${userId}_${timestamp}_${random}`;
}

/**
 * Email client implementation.
 */
export class EmailClient implements IEmailClient {
  private config: Required<EmailClientConfig>;
  private logger?: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void };

  constructor(config: EmailClientConfig, logger?: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void }) {
    this.config = {
      workerUrl: config.workerUrl.replace(/\/$/, ''), // Remove trailing slash
      apiKey: config.apiKey,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      enabled: config.enabled ?? true,
    };
    this.logger = logger;
  }

  /**
   * Send an email via the worker.
   */
  async send(request: SendEmailRequest): Promise<SendEmailResponse> {
    // If disabled, return mock success
    if (!this.config.enabled) {
      this.logger?.info({ type: request.type, to: request.to, emailRef: request.emailRef }, 'Email sending disabled, skipping');
      return {
        success: true,
        emailRef: request.emailRef,
        message: 'Email sending disabled',
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.workerUrl}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      const data = await response.json() as SendEmailResponse | EmailError;

      if (!response.ok) {
        const errorData = data as EmailError;
        this.logger?.error(
          { status: response.status, error: errorData.error, emailRef: request.emailRef },
          'Email send failed'
        );
        throw new EmailSendError(
          errorData.error || `HTTP ${response.status}`,
          request.emailRef,
          errorData.code
        );
      }

      this.logger?.info(
        { type: request.type, to: request.to, emailRef: request.emailRef, providerId: (data as SendEmailResponse).providerId },
        'Email sent successfully'
      );

      return data as SendEmailResponse;

    } catch (error) {
      if (error instanceof EmailSendError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger?.error({ error: message, emailRef: request.emailRef }, 'Email send error');

      throw new EmailSendError(
        message.includes('aborted') ? 'Request timeout' : message,
        request.emailRef,
        'NETWORK_ERROR'
      );

    } finally {
      clearTimeout(timeout);
    }
  }

  // ===========================================================================
  // CONVENIENCE METHODS
  // ===========================================================================

  private async sendTyped<T extends EmailPayload>(
    type: EmailType,
    to: string,
    userId: string,
    payload: T
  ): Promise<SendEmailResponse> {
    const emailRef = generateEmailRef(type, userId);
    return this.send({ type, to, userId, emailRef, payload });
  }

  async sendWelcome(to: string, userId: string, payload: WelcomePayload): Promise<SendEmailResponse> {
    return this.sendTyped('welcome', to, userId, payload);
  }

  async send2FA(to: string, userId: string, payload: TwoFactorPayload): Promise<SendEmailResponse> {
    return this.sendTyped('2fa', to, userId, payload);
  }

  async sendRegistrationConfirmation(to: string, userId: string, payload: RegistrationConfirmationPayload): Promise<SendEmailResponse> {
    return this.sendTyped('registration_confirmation', to, userId, payload);
  }

  async sendPasswordReset(to: string, userId: string, payload: ResetPasswordPayload): Promise<SendEmailResponse> {
    return this.sendTyped('reset_password', to, userId, payload);
  }

  async sendEmailChange(to: string, userId: string, payload: EmailChangePayload): Promise<SendEmailResponse> {
    return this.sendTyped('email_change', to, userId, payload);
  }

  async sendWithdrawalProcessed(to: string, userId: string, payload: WithdrawalProcessedPayload): Promise<SendEmailResponse> {
    return this.sendTyped('withdrawal_processed', to, userId, payload);
  }

  async sendDepositConfirmation(to: string, userId: string, payload: DepositConfirmationPayload): Promise<SendEmailResponse> {
    return this.sendTyped('deposit_confirmation', to, userId, payload);
  }

  async sendTradeOpened(to: string, userId: string, payload: TradeOpenedPayload): Promise<SendEmailResponse> {
    return this.sendTyped('trade_opened', to, userId, payload);
  }

  async sendTradeClosed(to: string, userId: string, payload: TradeClosedPayload): Promise<SendEmailResponse> {
    return this.sendTyped('trade_closed', to, userId, payload);
  }

  async sendNotification(to: string, userId: string, payload: NotificationPayload): Promise<SendEmailResponse> {
    return this.sendTyped('notification', to, userId, payload);
  }
}

/**
 * Custom error for email send failures.
 */
export class EmailSendError extends Error {
  public readonly emailRef?: string;
  public readonly code?: string;

  constructor(message: string, emailRef?: string, code?: string) {
    super(message);
    this.name = 'EmailSendError';
    this.emailRef = emailRef;
    this.code = code;
  }
}

/**
 * Create a no-op email client for testing or when emails are disabled.
 */
export function createNoOpEmailClient(): IEmailClient {
  const noOp = async (type: EmailType, to: string, userId: string): Promise<SendEmailResponse> => ({
    success: true,
    emailRef: generateEmailRef(type, userId),
    message: 'No-op email client',
  });

  return {
    send: async (req) => noOp(req.type, req.to, req.userId),
    sendWelcome: (to, userId, _) => noOp('welcome', to, userId),
    send2FA: (to, userId, _) => noOp('2fa', to, userId),
    sendRegistrationConfirmation: (to, userId, _) => noOp('registration_confirmation', to, userId),
    sendPasswordReset: (to, userId, _) => noOp('reset_password', to, userId),
    sendEmailChange: (to, userId, _) => noOp('email_change', to, userId),
    sendWithdrawalProcessed: (to, userId, _) => noOp('withdrawal_processed', to, userId),
    sendDepositConfirmation: (to, userId, _) => noOp('deposit_confirmation', to, userId),
    sendTradeOpened: (to, userId, _) => noOp('trade_opened', to, userId),
    sendTradeClosed: (to, userId, _) => noOp('trade_closed', to, userId),
    sendNotification: (to, userId, _) => noOp('notification', to, userId),
  };
}
