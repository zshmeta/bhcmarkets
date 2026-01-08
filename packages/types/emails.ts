
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
