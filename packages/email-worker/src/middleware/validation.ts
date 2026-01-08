/**
 * Request Validation
 * Validates incoming email send requests
 */

import { EMAIL_TYPES, type SendEmailRequest, type EmailType } from '../types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: SendEmailRequest;
}

/**
 * Email regex pattern (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate the send email request
 */
export function validateSendEmailRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const request = body as Record<string, unknown>;

  // Validate 'type' field
  if (!request.type || typeof request.type !== 'string') {
    return { valid: false, error: 'Missing or invalid "type" field' };
  }

  if (!EMAIL_TYPES.includes(request.type as EmailType)) {
    return {
      valid: false,
      error: `Invalid email type "${request.type}". Supported types: ${EMAIL_TYPES.join(', ')}`
    };
  }

  // Validate 'to' field
  if (!request.to || typeof request.to !== 'string') {
    return { valid: false, error: 'Missing or invalid "to" field' };
  }

  if (!EMAIL_REGEX.test(request.to)) {
    return { valid: false, error: 'Invalid email address format in "to" field' };
  }

  // Validate 'userId' field
  if (!request.userId || typeof request.userId !== 'string') {
    return { valid: false, error: 'Missing or invalid "userId" field' };
  }

  // Validate 'emailRef' field
  if (!request.emailRef || typeof request.emailRef !== 'string') {
    return { valid: false, error: 'Missing or invalid "emailRef" field' };
  }

  // Validate 'payload' field
  if (!request.payload || typeof request.payload !== 'object') {
    return { valid: false, error: 'Missing or invalid "payload" field' };
  }

  // Type-specific payload validation
  const payloadValidation = validatePayload(request.type as EmailType, request.payload as Record<string, unknown>);
  if (!payloadValidation.valid) {
    return payloadValidation;
  }

  return {
    valid: true,
    data: {
      type: request.type as EmailType,
      to: request.to as string,
      userId: request.userId as string,
      emailRef: request.emailRef as string,
      payload: request.payload as SendEmailRequest['payload'],
    },
  };
}

/**
 * Validate type-specific payload
 */
function validatePayload(type: EmailType, payload: Record<string, unknown>): ValidationResult {
  switch (type) {
    case '2fa':
      if (!payload.code || typeof payload.code !== 'string') {
        return { valid: false, error: 'Missing "code" in payload for 2fa email' };
      }
      break;

    case 'registration_confirmation':
      if (!payload.confirmationLink || typeof payload.confirmationLink !== 'string') {
        return { valid: false, error: 'Missing "confirmationLink" in payload for registration_confirmation email' };
      }
      break;

    case 'reset_password':
      if (!payload.resetLink || typeof payload.resetLink !== 'string') {
        return { valid: false, error: 'Missing "resetLink" in payload for reset_password email' };
      }
      break;

    case 'email_change':
      if (!payload.newEmail || typeof payload.newEmail !== 'string') {
        return { valid: false, error: 'Missing "newEmail" in payload for email_change email' };
      }
      if (!payload.confirmationLink || typeof payload.confirmationLink !== 'string') {
        return { valid: false, error: 'Missing "confirmationLink" in payload for email_change email' };
      }
      break;

    case 'withdrawal_processed':
      if (!payload.amount || !payload.currency || !payload.withdrawalMethod || !payload.transactionId || !payload.processedAt) {
        return { valid: false, error: 'Missing required fields in payload for withdrawal_processed email (amount, currency, withdrawalMethod, transactionId, processedAt)' };
      }
      break;

    case 'deposit_confirmation':
      if (!payload.amount || !payload.currency || !payload.depositMethod || !payload.transactionId || !payload.confirmedAt) {
        return { valid: false, error: 'Missing required fields in payload for deposit_confirmation email (amount, currency, depositMethod, transactionId, confirmedAt)' };
      }
      break;

    case 'trade_opened':
      if (!payload.symbol || !payload.side || !payload.quantity || !payload.price || !payload.orderId || !payload.openedAt) {
        return { valid: false, error: 'Missing required fields in payload for trade_opened email (symbol, side, quantity, price, orderId, openedAt)' };
      }
      if (payload.side !== 'BUY' && payload.side !== 'SELL') {
        return { valid: false, error: 'Invalid "side" value in trade_opened payload. Must be "BUY" or "SELL"' };
      }
      break;

    case 'trade_closed':
      if (!payload.symbol || !payload.side || !payload.quantity || !payload.openPrice || !payload.closePrice || !payload.orderId || !payload.closedAt || !payload.pnl || !payload.pnlPercentage) {
        return { valid: false, error: 'Missing required fields in payload for trade_closed email (symbol, side, quantity, openPrice, closePrice, orderId, closedAt, pnl, pnlPercentage)' };
      }
      if (payload.side !== 'BUY' && payload.side !== 'SELL') {
        return { valid: false, error: 'Invalid "side" value in trade_closed payload. Must be "BUY" or "SELL"' };
      }
      break;

    case 'notification':
      if (!payload.subject || typeof payload.subject !== 'string') {
        return { valid: false, error: 'Missing "subject" in payload for notification email' };
      }
      if (!payload.message || typeof payload.message !== 'string') {
        return { valid: false, error: 'Missing "message" in payload for notification email' };
      }
      break;

    case 'welcome':
      // Welcome email has all optional fields
      break;
  }

  return { valid: true };
}
