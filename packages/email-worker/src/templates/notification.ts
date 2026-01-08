/**
 * Notification Email Template (Fallback/General)
 */

import type { NotificationPayload, TemplateContext, RenderedEmail } from '../types';
import { wrapInBaseTemplate, createPlainTextWrapper, BaseTemplateConfig } from './base';

export function renderNotification(
  context: TemplateContext,
  config: BaseTemplateConfig
): RenderedEmail {
  const payload = context.payload as NotificationPayload;
  const firstName = payload.firstName || 'there';
  const { subject, message, actionUrl, actionText } = payload;

  const htmlContent = `
    <h1>${subject}</h1>

    <p>Hi ${firstName},</p>

    <p>${message.replace(/\n/g, '</p><p>')}</p>

    ${actionUrl && actionText ? `
    <p style="text-align: center;">
      <a href="${actionUrl}" class="btn">${actionText}</a>
    </p>
    ` : ''}

    <p>If you have any questions, feel free to reach out to our support team.</p>
  `;

  const textContent = `${subject}

Hi ${firstName},

${message}

${actionUrl && actionText ? `${actionText}: ${actionUrl}\n` : ''}
If you have any questions, feel free to reach out to our support team.`;

  return {
    subject,
    html: wrapInBaseTemplate(htmlContent, config),
    text: createPlainTextWrapper(textContent, config),
  };
}
