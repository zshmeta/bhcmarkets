/**
 * Deposit Confirmation Email Template
 */

import type { DepositConfirmationPayload, TemplateContext, RenderedEmail } from '../types';
import { wrapInBaseTemplate, createPlainTextWrapper, BaseTemplateConfig } from './base';

export function renderDepositConfirmation(
  context: TemplateContext,
  config: BaseTemplateConfig
): RenderedEmail {
  const payload = context.payload as DepositConfirmationPayload;
  const firstName = payload.firstName || 'there';
  const { amount, currency, depositMethod, transactionId, confirmedAt } = payload;

  const subject = `Deposit Confirmed: ${amount} ${currency}`;

  const htmlContent = `
    <h1>Deposit Confirmed ✓</h1>

    <p>Hi ${firstName},</p>

    <p>Great news! Your deposit has been confirmed and the funds are now available in your ${config.platformName} account.</p>

    <div class="success-box">
      <p><strong>Funds Available</strong></p>
      <p>You can now use these funds for trading.</p>
    </div>

    <table class="details-table">
      <tr>
        <td>Amount</td>
        <td><strong>${amount} ${currency}</strong></td>
      </tr>
      <tr>
        <td>Method</td>
        <td>${depositMethod}</td>
      </tr>
      <tr>
        <td>Transaction ID</td>
        <td style="font-family: monospace; font-size: 12px;">${transactionId}</td>
      </tr>
      <tr>
        <td>Confirmed At</td>
        <td>${confirmedAt}</td>
      </tr>
    </table>

    <p style="text-align: center;">
      <a href="${config.platformUrl}/dashboard" class="btn">Go to Dashboard</a>
    </p>

    <p>Ready to start trading? Your funds are waiting for you!</p>
  `;

  const textContent = `Deposit Confirmed ✓

Hi ${firstName},

Great news! Your deposit has been confirmed and the funds are now available in your ${config.platformName} account.

DEPOSIT DETAILS
---------------
Amount: ${amount} ${currency}
Method: ${depositMethod}
Transaction ID: ${transactionId}
Confirmed At: ${confirmedAt}

Your funds are now available for trading.

Ready to start trading? Log in to your dashboard: ${config.platformUrl}/dashboard`;

  return {
    subject,
    html: wrapInBaseTemplate(htmlContent, config),
    text: createPlainTextWrapper(textContent, config),
  };
}
