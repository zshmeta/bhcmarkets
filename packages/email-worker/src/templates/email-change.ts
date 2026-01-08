/**
 * Email Change Confirmation Template
 */

import type { EmailChangePayload, TemplateContext, RenderedEmail } from '../types';
import { wrapInBaseTemplate, createPlainTextWrapper, BaseTemplateConfig } from './base';

export function renderEmailChange(
  context: TemplateContext,
  config: BaseTemplateConfig
): RenderedEmail {
  const payload = context.payload as EmailChangePayload;
  const firstName = payload.firstName || 'there';
  const newEmail = payload.newEmail;
  const confirmationLink = payload.confirmationLink;
  const expiresIn = payload.expiresInHours || 24;

  const subject = `Confirm your new email address`;

  const htmlContent = `
    <h1>Confirm Your New Email</h1>

    <p>Hi ${firstName},</p>

    <p>You requested to change the email address associated with your ${config.platformName} account to:</p>

    <div class="code-box">
      <span style="font-size: 18px; color: #18181b; font-weight: 500;">${newEmail}</span>
    </div>

    <p>To confirm this change, please click the button below:</p>

    <p style="text-align: center;">
      <a href="${confirmationLink}" class="btn">Confirm New Email</a>
    </p>

    <p style="text-align: center; color: #71717a; font-size: 14px;">
      This link expires in <strong>${expiresIn} hours</strong>
    </p>

    <div class="warning-box">
      <p><strong>Didn't request this?</strong> If you didn't request this email change, please secure your account immediately by changing your password and contacting our support team.</p>
    </div>

    <div class="info-box">
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 12px;">${confirmationLink}</p>
    </div>
  `;

  const textContent = `Confirm Your New Email

Hi ${firstName},

You requested to change the email address associated with your ${config.platformName} account to:

${newEmail}

To confirm this change, please visit: ${confirmationLink}

This link expires in ${expiresIn} hours.

DIDN'T REQUEST THIS?
If you didn't request this email change, please secure your account immediately by changing your password and contacting our support team.`;

  return {
    subject,
    html: wrapInBaseTemplate(htmlContent, config),
    text: createPlainTextWrapper(textContent, config),
  };
}
