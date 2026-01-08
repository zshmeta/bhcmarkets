/**
 * Withdrawal Processed Email Template
 */

import type { WithdrawalProcessedPayload, TemplateContext, RenderedEmail } from '../types';
import { wrapInBaseTemplate, createPlainTextWrapper, BaseTemplateConfig } from './base';

export function renderWithdrawalProcessed(
  context: TemplateContext,
  config: BaseTemplateConfig
): RenderedEmail {
  const payload = context.payload as WithdrawalProcessedPayload;
  const firstName = payload.firstName || 'there';
  const { amount, currency, withdrawalMethod, transactionId, processedAt, destination } = payload;

  const subject = `Withdrawal Processed: ${amount} ${currency}`;

  const htmlContent = `
    <h1>Withdrawal Processed ✓</h1>

    <p>Hi ${firstName},</p>

    <p>Your withdrawal request has been processed successfully.</p>

    <div class="success-box">
      <p><strong>Withdrawal Complete</strong></p>
      <p>Your funds are on their way to your designated account.</p>
    </div>

    <table class="details-table">
      <tr>
        <td>Amount</td>
        <td><strong>${amount} ${currency}</strong></td>
      </tr>
      <tr>
        <td>Method</td>
        <td>${withdrawalMethod}</td>
      </tr>
      ${destination ? `
      <tr>
        <td>Destination</td>
        <td>${destination}</td>
      </tr>
      ` : ''}
      <tr>
        <td>Transaction ID</td>
        <td style="font-family: monospace; font-size: 12px;">${transactionId}</td>
      </tr>
      <tr>
        <td>Processed At</td>
        <td>${processedAt}</td>
      </tr>
    </table>

    <div class="info-box">
      <p><strong>Processing Time:</strong> Depending on your withdrawal method, funds may take 1-5 business days to appear in your account.</p>
    </div>

    <p>If you have any questions about this withdrawal, please contact our support team with your transaction ID.</p>
  `;

  const textContent = `Withdrawal Processed ✓

Hi ${firstName},

Your withdrawal request has been processed successfully. Your funds are on their way to your designated account.

WITHDRAWAL DETAILS
------------------
Amount: ${amount} ${currency}
Method: ${withdrawalMethod}
${destination ? `Destination: ${destination}\n` : ''}Transaction ID: ${transactionId}
Processed At: ${processedAt}

Processing Time: Depending on your withdrawal method, funds may take 1-5 business days to appear in your account.

If you have any questions about this withdrawal, please contact our support team with your transaction ID.`;

  return {
    subject,
    html: wrapInBaseTemplate(htmlContent, config),
    text: createPlainTextWrapper(textContent, config),
  };
}
